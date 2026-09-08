import sys
import json
import re
import unicodedata
from collections import Counter

import spacy

nlp = spacy.load("en_core_web_sm")


# ==========================================================================
# 1. UNICODE / TEXT SANITIZATION
# ==========================================================================

def sanitize_text(text):
    """
    Make text safe to pass to spaCy and to json.dumps.

    Lone UTF-16 surrogate characters (e.g. '\\udc81') can appear in text
    extracted from malformed PDFs. These are not valid Unicode scalar
    values and will crash spaCy's tokenizer or Python's UTF-8 encoder.
    We strip them out before any further processing.
    """

    if not text:
        return ""

    
    text = re.sub(r"[\ud800-\udfff]", "", text)

    
    text = unicodedata.normalize("NFKC", text)

    # Collapse repeated whitespace (but keep single spaces/newlines).
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    return text.strip()


#

FIELD_LABELS = [
    ("applicant_name", ["Applicant Name", "Name of Applicant", "Submitted by"], False, None),
    ("address", ["Address"], False, None),
    ("district", ["District"], False, None),
    ("state", ["State"], False, None),
    ("contact", ["Contact"], False, None),
    ("date_of_submission", ["Date of Submission", "Submission Date", "Submitted On"], False, None),
    ("date_of_submission", ["Date"], True, None),
    ("subject", ["Subject"], True, None),
    ("to", ["To"], True, None),
    ("reference", ["Reference"], True, None),
]


MAX_FIELD_SPAN = 220


def _find_label_matches(text):
    """
    Find every occurrence of every known field label in the text.
    Returns a list of (start, end, field_key) sorted by position.
    """

    matches = []

    for field_key, labels, require_colon, skip_if_next_word in FIELD_LABELS:
        for label in labels:
            if require_colon:
                pattern = r"\b" + re.escape(label) + r"\s*:\s*"
            else:
                pattern = r"\b" + re.escape(label) + r"\b\s*:?\s*"

            for m in re.finditer(pattern, text, flags=re.IGNORECASE):
                if skip_if_next_word:
                    lookahead = text[m.end():m.end() + len(skip_if_next_word) + 2]
                    if lookahead.strip().lower().startswith(skip_if_next_word.lower()):
                        continue
                matches.append((m.start(), m.end(), field_key))

    matches.sort(key=lambda x: x[0])
    return matches


def extract_labeled_fields(text):
    """
    Slice the text between consecutive label matches to get each
    field's raw value. The first match found for a given field_key wins
    (documents shouldn't repeat "Applicant Name" twice).

    Each raw value is capped at MAX_FIELD_SPAN characters as a safety
    net against runaway spans when no closing label exists later in
    the document (e.g. "Date of Submission" is often the last labelled
    field before free-text paragraphs begin).
    """

    matches = _find_label_matches(text)
    fields = {}

    for i, (start, end, field_key) in enumerate(matches):
        if field_key in fields:
            continue

        next_start = matches[i + 1][0] if i + 1 < len(matches) else len(text)
        raw_value = text[end:next_start]
        raw_value = raw_value[:MAX_FIELD_SPAN]
        raw_value = raw_value.strip(" ,.;:-\u2022")

        if raw_value:
            fields[field_key] = raw_value

    return fields


# ==========================================================================
# 3. TYPE-SPECIFIC PARSERS (applied within a labelled field's raw span)
# ==========================================================================

MONTHS = (
    "January|February|March|April|May|June|July|August|September|"
    "October|November|December"
)

DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:" + MONTHS + r")\s+\d{4})\b", re.IGNORECASE),
    re.compile(r"\b((?:" + MONTHS + r")\s+\d{1,2},?\s+\d{4})\b", re.IGNORECASE),
    re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"),
]

NAME_PATTERN = re.compile(
    r"^\s*([A-Z][a-zA-Z.'-]*(?:\s+[A-Z][a-zA-Z.'-]*){0,3})"
)

NAME_BLACKLIST_WORDS = {
    "address", "citizen", "resident", "date", "contact", "district",
    "state", "submission", "declaration", "information", "request",
    "grievance", "applicant",
}

ADDRESS_SEGMENT_SKIP_PATTERN = re.compile(
    r"^\s*(house\s*no\.?|h\.?\s*no\.?|plot\s*no\.?|flat\s*no\.?)\b",
    re.IGNORECASE,
)

ORG_SUFFIX_WORDS = [
    "department", "commissioner", "authority", "corporation", "board",
    "office", "cell", "ministry", "municipal corporation", "panchayat",
    "directorate", "commission",
]

ORG_BLACKLIST_WORDS = {
    "address", "citizen", "resident", "request", "information",
    "declaration", "supporting", "requested", "government action",
    "applicant", "grievance",
}


def extract_date_from_span(raw_span):
    """
    Find the first well-formed date inside a raw field span. Bare
    numbers (e.g. "42" from a house number) will never match, because
    every pattern requires either a month name or a full slash/dash
    delimited date -- never a lone 1-2 digit number.
    """

    if not raw_span:
        return None

    for pattern in DATE_PATTERNS:
        m = pattern.search(raw_span)
        if m:
            return m.group(1).strip()

    return None


def extract_name_from_span(raw_span):
    """
    Extract a person's name from a labelled span. Requires 1-4
    consecutive Title Case words starting at the beginning of the span,
    then rejects the result if it contains any blacklisted word (this
    catches cases where the label-boundary cut wasn't clean, e.g. a
    document that uses an unrecognised label right after the name).
    """

    if not raw_span:
        return None

    m = NAME_PATTERN.match(raw_span)
    if not m:
        return None

    candidate = m.group(1).strip()
    words_lower = {w.lower().strip(".,'-") for w in candidate.split()}

    if words_lower & NAME_BLACKLIST_WORDS:
        return None

    if not (1 <= len(candidate.split()) <= 4):
        return None

    return candidate


def extract_locations_from_fields(fields, full_text):
    """
    Build a location list primarily from labelled address/district/state
    fields, splitting the address into meaningful segments and dropping
    house-number-style segments. Falls back to a "Ward <n>" regex scan
    and spaCy GPE/LOC entities for anything not captured by labels.
    """

    locations = []
    seen = set()

    def add(value):
        value = value.strip(" ,.;:-")
        if not value:
            return
        key = value.lower()
        if key in seen:
            return
        seen.add(key)
        locations.append(value)

    address_raw = fields.get("address")
    if address_raw:
        for segment in address_raw.split(","):
            segment = segment.strip()
            if not segment:
                continue
            if ADDRESS_SEGMENT_SKIP_PATTERN.match(segment):
                continue
            add(segment)

    if fields.get("district"):
        add(fields["district"])

    if fields.get("state"):
        add(fields["state"])

   
    for m in re.finditer(r"\bWard\s*\d+\b", full_text, flags=re.IGNORECASE):
        add(m.group(0))

    return locations


def validate_org_candidate(candidate):
    """
    Accept an organization candidate only if it looks like a real
    government department/office name: contains a recognised
    department-type suffix word, is reasonably short, has no digits,
    and doesn't contain blacklisted boilerplate words.
    """

    if not candidate:
        return False

    candidate_clean = candidate.strip(" ,.;:-")
    if not candidate_clean:
        return False

    words = candidate_clean.split()
    if not (1 <= len(words) <= 6):
        return False

    if any(ch.isdigit() for ch in candidate_clean):
        return False

    lower = candidate_clean.lower()

    if any(bad in lower for bad in ORG_BLACKLIST_WORDS):
        return False

    if not any(suffix in lower for suffix in ORG_SUFFIX_WORDS):
        return False

    return True


def extract_organizations_from_fields(fields, doc):
    """
    Primary source: the "To" field, split on '/', ',' or ' and '.
    Fallback: spaCy ORG entities, each validated the same way.
    """

    organizations = []
    seen = set()

    def add(value):
        value = value.strip(" ,.;:-")
        if not value:
            return
        key = value.lower()
        if key in seen:
            return
        seen.add(key)
        organizations.append(value)

    to_raw = fields.get("to")
    if to_raw:
        candidates = re.split(r"/|,|\band\b", to_raw, flags=re.IGNORECASE)
        for candidate in candidates:
            candidate = candidate.strip()
            if validate_org_candidate(candidate):
                add(candidate)

    if not organizations:
        for ent in doc.ents:
            if ent.label_ == "ORG" and validate_org_candidate(ent.text):
                add(ent.text.strip())

    return organizations


# ==========================================================================
# 4. CATEGORY / URGENCY KEYWORD MATCHING (whole-word, case-insensitive)
# ==========================================================================
#
# Extensible: add new categories/keywords here without touching any
# other logic. Every match is a literal, citable keyword hit, which is
# what keeps this stage explainable.

DEPARTMENT_KEYWORDS = {
    "water": [
        "pipeline", "leakage", "water supply", "sewage", "drainage",
    ],
    "electricity": [
        "power cut", "streetlight", "transformer", "electricity bill",
        "power outage",
    ],
    "sanitation": [
        "waste collection", "garbage", "solid waste", "sanitation",
        "waste disposal", "unhygienic", "roadside waste",
    ],
    "rti": [
        "right to information", "RTI",
    ],
    "pension": [
        "pension", "retirement benefit", "PF withdrawal", "provident fund",
    ],
    "education": [
        "school admission", "scholarship", "education department",
        "college fee",
    ],
    "healthcare": [
        "hospital", "medical treatment", "health department", "ambulance",
    ],
    "infrastructure": [
        "road repair", "pothole", "bridge", "construction",
        "public works",
    ],
    "financial": [
        "subsidy", "loan", "tax refund", "financial assistance",
    ],
    "legal": [
        "notice", "court order", "legal action", "compliance",
    ],
}

URGENCY_KEYWORDS = [
    "emergency", "life-threatening", "life threatening", "urgent",
    "immediate", "critical", "as soon as possible",
]


def _whole_word_matches(text, keyword):
    pattern = r"\b" + re.escape(keyword) + r"\b"
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def tag_category(text):
    """
    Whole-word, case-insensitive keyword matching. Using \\b word
    boundaries (rather than substring `in` checks) is what prevents
    false positives like "rti" matching inside "supporting".
    """

    matches = {}
    for department, keywords in DEPARTMENT_KEYWORDS.items():
        hits = [kw for kw in keywords if _whole_word_matches(text, kw)]
        if hits:
            matches[department] = hits

    return matches


def tag_urgency(text):
    return [kw for kw in URGENCY_KEYWORDS if _whole_word_matches(text, kw)]


# ==========================================================================
# 5. CONTEXT EXTRACTION (frequency-ranked, deduplicated, capped)
# ==========================================================================

GENERIC_WORDS = {
    "thing", "things", "case", "cases", "example", "examples", "result",
    "results", "method", "methods", "approach", "approaches", "work",
    "works", "paper", "papers", "study", "studies", "section", "sections",
    "part", "parts", "way", "ways", "time", "times", "information",
    "problem", "problems", "process", "processes", "detail", "details",
    "observation", "observations", "action", "actions", "resolution",
    "issue", "issues", "area", "areas", "matter", "matters",
}

# Phrases that are boilerplate/document-structure, not meaningful
# document concepts, and should never appear in "context".
GENERIC_PHRASE_PATTERNS = [
    re.compile(r"^(the|this|that|these|those|several|some|a|an)\s+\w+$"),
    re.compile(r"^(nature of the grievance|details and observations|"
               r"requested government action|supporting information|"
               r"declaration|applicant information)$"),
]

MAX_CONTEXT_TERMS = 8


def normalize_phrase(text):
    """
    Normalize a candidate phrase for context output.
    """
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)

    # Remove leading articles so context contains concepts, not wrappers.
    text = re.sub(r"^(the|a|an)\s+", "", text)

    return text.strip(".,;:!?()[]{}\"'\u2022")


def is_valid_phrase(phrase):
    """
    Keep context phrases short, meaningful, and non-generic.
    """
    if not phrase:
        return False

    words = phrase.split()

    # Context should be concise.
    if len(words) > 5:
        return False

    if len(phrase) < 3:
        return False

    if not re.search(r"[a-zA-Z]", phrase):
        return False

    # Reject phrases made entirely from generic words.
    if all(word.lower() in GENERIC_WORDS for word in words):
        return False

    for pattern in GENERIC_PHRASE_PATTERNS:
        if pattern.match(phrase):
            return False

    return True

CONTEXT_STOP_WORDS = {
    "and", "a", "the", "is", "am", "are",
    "an", "was", "were", "be", "been", "being"
}


def _clean_context_phrase(phrase):
    """
    Clean grammatical filler words from context phrases.
    Keeps meaningful domain words while removing words such as:
    and, a, the, is, am, are, was, were, be, been, being.
    """
    phrase = normalize_phrase(phrase)

    if not phrase:
        return ""

    # Remove unwanted words from the beginning
    words = phrase.split()
    while words and words[0].lower() in CONTEXT_STOP_WORDS:
        words.pop(0)

    # Remove unwanted words from the end
    while words and words[-1].lower() in CONTEXT_STOP_WORDS:
        words.pop()

    phrase = " ".join(words)

    # Remove dangling conjunctions/prepositions
    phrase = re.sub(
        r"\s+(or|but|of|to|for|with|from|in|on|at|by|as)$",
        "",
        phrase,
        flags=re.IGNORECASE
    )

    return phrase.strip(".,;:!?()[]{}\"'\u2022")


def _build_content_word_freq(doc):
    """
    Count content words across the chunk. Repeated concepts receive a
    stronger score than one-off mentions.
    """
    freq = Counter()

    for token in doc:
        if (
            token.is_alpha
            and not token.is_stop
            and token.pos_ in {"NOUN", "PROPN", "ADJ"}
        ):
            freq[token.lemma_.lower()] += 1

    return freq


def _score_phrase(phrase, freq):
    """
    Rank phrases using content-word frequency plus a small multi-word bonus.
    """
    words = [
        w.lower()
        for w in re.findall(r"[a-zA-Z']+", phrase)
    ]

    if not words:
        return 0.0

    base = sum(freq.get(w, 0) for w in set(words))
    length_bonus = 1 + 0.12 * (len(words) - 1)

    return base * length_bonus


# --------------------------------------------------------------------------
# Context redundancy reduction
#
# Domain-neutral: no grievance-specific or department-specific synonym list.
# It combines:
#   1. lexical/subsumption overlap,
#   2. normalized word overlap,
#   3. shared head/modifier evidence,
#   4. a diversity-aware selection step.
#
# This avoids filling the context list with several differently worded
# mentions of the same concept while preserving unrelated concepts.
# --------------------------------------------------------------------------

_CONTEXT_COMPARISON_STOP_WORDS = {
    "and", "or", "but", "a", "an", "the", "this", "that", "these", "those",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "of", "to", "for", "with", "from", "in", "on", "at", "by", "as",
    "into", "over", "under", "through", "during", "than", "which", "who",
}

_CONTEXT_BOILERPLATE_WORDS = {
    "complaint", "application", "applicant", "request", "submission",
    "matter", "issue", "information", "details", "regarding", "concerning",
    "authority", "department", "office", "official", "government",
    "municipal", "administrative", "civic", "public", "local",
    "appropriate", "relevant", "affected", "additional", "general",
    "overall", "various", "several", "specific", "particular",
    "current", "existing", "proposed", "required", "necessary",
}

def _context_lemma_like(word):
    """Conservative normalization used only for redundancy comparison."""
    word = word.lower().strip()
    if len(word) > 5 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 5 and word.endswith("ing"):
        stem = word[:-3]
        if len(stem) >= 4:
            return stem
    if len(word) > 4 and word.endswith("ed"):
        stem = word[:-2]
        if len(stem) >= 4:
            return stem
    if len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word

def _context_content_tokens(phrase):
    words = re.findall(r"[a-zA-Z']+", phrase.lower())
    return {
        _context_lemma_like(w)
        for w in words
        if w not in _CONTEXT_COMPARISON_STOP_WORDS
        and w not in _CONTEXT_BOILERPLATE_WORDS
        and len(w) > 2
    }

def _context_surface_tokens(phrase):
    words = re.findall(r"[a-zA-Z']+", phrase.lower())
    return {
        _context_lemma_like(w)
        for w in words
        if w not in _CONTEXT_COMPARISON_STOP_WORDS
        and len(w) > 2
    }

def _context_similarity(left, right):
    """
    Conservative similarity score.

    A phrase is strongly redundant when its informative words substantially
    overlap OR when one phrase is mostly a reformulation of the other.
    No fixed government-domain synonym dictionary is used.
    """
    a = _context_content_tokens(left)
    b = _context_content_tokens(right)

    if not a or not b:
        return 0.0

    shared = a & b
    if not shared:
        return 0.0

    containment = len(shared) / min(len(a), len(b))
    jaccard = len(shared) / len(a | b)

    # One shared informative word is not enough for two multi-word phrases.
    if len(shared) == 1 and len(a) > 1 and len(b) > 1:
        return 0.0

    return max(containment, jaccard)

def _context_boilerplate_score(phrase):
    """
    Penalize phrases that mainly describe the document rather than its subject.
    This is deliberately conservative.
    """
    words = _context_surface_tokens(phrase)
    if not words:
        return 1.0

    boilerplate = _context_surface_tokens(
        " ".join(sorted(_CONTEXT_BOILERPLATE_WORDS))
    )
    hits = len(words & boilerplate)
    return hits / len(words)

def _context_quality_score(phrase, base_score):
    """
    Prefer concrete multi-word concepts over vague administrative wording.
    """
    words = _context_content_tokens(phrase)
    surface = _context_surface_tokens(phrase)

    if not words:
        return -1.0

    score = float(base_score)

    # Multi-word concepts are generally more informative than isolated nouns.
    score += min(len(words), 4) * 0.35

    # Penalize boilerplate-heavy phrases.
    score -= _context_boilerplate_score(phrase) * 3.0

    # Very long noun chunks are often sentence-like or overly broad.
    if len(surface) >= 5:
        score -= 0.8

    return score

def _dedupe_subsumed(candidates):
    """
    Select a diverse set of high-quality context concepts.

    Existing exact/subset deduplication is preserved, but selection is now
    diversity-aware: after choosing a strong phrase, another phrase that is
    substantially the same concept is skipped. This is domain-neutral.
    """
    if not candidates:
        return []

    ranked = []
    for phrase, base_score in candidates:
        ranked.append(
            (
                phrase,
                _context_quality_score(phrase, base_score),
                base_score,
            )
        )

    ranked.sort(key=lambda item: item[1], reverse=True)

    kept = []

    for phrase, quality, base_score in ranked:
        words = _context_content_tokens(phrase)
        if not words:
            continue

        redundant = False

        for kept_phrase, kept_quality, _ in kept:
            kept_words = _context_content_tokens(kept_phrase)

            # Exact/subset concept.
            if words <= kept_words:
                redundant = True
                break

            # Strong content overlap = same concept expressed differently.
            similarity = _context_similarity(phrase, kept_phrase)
            if similarity >= 0.72:
                redundant = True
                break

            # A shorter phrase with the same core is also redundant.
            if len(words) <= 2 and len(kept_words) <= 3:
                shared = words & kept_words
                if len(shared) >= 1 and len(shared) == len(words):
                    redundant = True
                    break

        if redundant:
            continue

        kept.append((phrase, quality, base_score))

    # Return in quality order, preserving the old output contract.
    kept.sort(key=lambda item: item[1], reverse=True)
    return [phrase for phrase, _, _ in kept]

# Small grammatical words that often make noun chunks look like sentences.
# These are removed only at phrase boundaries; existing extraction behavior
# for structured fields/categories is untouched.
_CONTEXT_LEADING = re.compile(
    r"^(the|a|an|this|that|these|those|some|several|various|other|"
    r"their|our|your|his|her|its)\\s+",
    re.IGNORECASE,
)

_CONTEXT_TRAILING = re.compile(
    r"\\s+(and|or|but|of|to|for|with|from|in|on|at|by|as|that|which|"
    r"who|whose)$",
    re.IGNORECASE,
)

_CONTEXT_SPLIT = re.compile(
    r"\\s+(?:and|or|but)\\s+|[,;:]+",
    re.IGNORECASE,
)


def _atomic_context_phrases(raw_phrase):
    """
    Turn a spaCy noun chunk into short, concept-like phrases.

    Example:
        "unpleasant odour, and scattered waste"
    becomes:
        ["unpleasant odour", "scattered waste"]

    This is intentionally conservative: it only splits/cleans text that
    spaCy has already identified as a noun phrase. It does not alter any
    other extraction stage.
    """
    pieces = _CONTEXT_SPLIT.split(raw_phrase)

    cleaned = []
    for piece in pieces:
        phrase = _clean_context_phrase(piece)

        # Remove repeated leading modifiers/articles left after splitting.
        while True:
            updated = _CONTEXT_LEADING.sub("", phrase).strip()
            if updated == phrase:
                break
            phrase = updated

        phrase = _CONTEXT_TRAILING.sub("", phrase).strip()
        phrase = re.sub(r"\\s+", " ", phrase)
        phrase = phrase.strip(".,;:!?()[]{}\"'\\u2022")

        if is_valid_phrase(phrase):
            cleaned.append(phrase)

    return cleaned


def _phrase_is_too_broad(phrase):
    """
    Reject noun chunks that are grammatical but too vague to be useful as
    context concepts. This is deliberately narrow so existing behavior is
    preserved for domain-specific phrases.
    """
    words = phrase.lower().split()

    if len(words) >= 4 and words[-1] in {
        "arrangements", "information", "details", "matters",
        "activities", "facilities", "services", "requirements",
    }:
        return True

    # A phrase such as "other domestic waste" is less useful than the
    # underlying concept "domestic waste".
    if words and words[0] in {"other", "various", "several", "some"}:
        return True

    return False


def extract_context(doc, exclude_terms=None, max_terms=MAX_CONTEXT_TERMS):
    """
    Extract concise, meaningful context concepts for this chunk.

    The process remains deterministic and rule-based:
      - collect noun phrases;
      - clean unnecessary grammatical wrappers;
      - add individual nouns/proper nouns as fallbacks;
      - remove structured-field duplicates;
      - rank by content-word frequency;
      - remove redundant phrases;
      - cap the result at max_terms.
    """
    exclude_terms = exclude_terms or set()

    normalized_exclusions = {
        normalize_phrase(term)
        for term in exclude_terms
        if term
    }

    candidates = []
    seen_phrases = set()

    def _overlaps_excluded(phrase):
        """
        Prevent context from repeating applicant, subject, location, or
        organization values already returned as structured fields.
        """
        phrase_words = set(phrase.split())

        for term in normalized_exclusions:
            if not term:
                continue

            term_words = set(term.split())

            if term in phrase or phrase in term:
                return True

            if phrase_words and phrase_words <= term_words:
                return True

        return False

    def _add_candidate(raw_phrase):
        phrase = _clean_context_phrase(raw_phrase)

        if not is_valid_phrase(phrase):
            return

        if _overlaps_excluded(phrase):
            return

        # Do not let formal document wording consume context slots.
        if _context_boilerplate_score(phrase) >= 0.75:
            return

        key = phrase.lower()

        if key in seen_phrases:
            return

        seen_phrases.add(key)
        candidates.append(phrase)

    # Noun phrases preserve useful concepts such as
    # "waste collection", "water supply", and "road repair".
    # Split coordinated/comma-heavy chunks first so a whole sentence-like
    # fragment does not become one noisy context item.
    for chunk in doc.noun_chunks:
        meaningful_words = [
            token
            for token in chunk
            if not token.is_stop and token.is_alpha
        ]

        if not meaningful_words:
            continue

        if not any(
            token.pos_ in {"NOUN", "PROPN"}
            for token in meaningful_words
        ):
            continue

        for phrase in _atomic_context_phrases(chunk.text):
            if _phrase_is_too_broad(phrase):
                continue
            _add_candidate(phrase)

    # Individual nouns/proper nouns act as fallback concepts when spaCy
    # does not produce a useful noun phrase.
    for token in doc:
        if (
            not token.is_alpha
            or token.is_stop
            or len(token.text) < 3
            or token.pos_ not in {"NOUN", "PROPN"}
        ):
            continue

        phrase = token.lemma_
        if phrase.lower() not in GENERIC_WORDS:
            _add_candidate(phrase)

    if not candidates:
        return []

    freq = _build_content_word_freq(doc)

    scored = [
        (phrase, _score_phrase(phrase, freq))
        for phrase in candidates
    ]

    # Stable sort: ties retain the original document order.
    scored.sort(key=lambda pair: pair[1], reverse=True)

    deduped = _dedupe_subsumed(scored)

    return deduped[:max_terms]


# ==========================================================================
# 6. PER-CHUNK PIPELINE
# ==========================================================================

def process_chunk(raw_text):
    text = sanitize_text(raw_text)

    if not text:
        return {
            "context": [],
            "applicant_name": None,
            "submission_date": None,
            "subject": None,
            "locations": [],
            "organizations": [],
            "category_matches": {},
            "category_method": "keyword_match_whole_word",
            "urgency_keywords": [],
        }

    doc = nlp(text)
    fields = extract_labeled_fields(text)

    # --- Applicant name: label-aware first, spaCy PERSON as fallback ---
    applicant_name = None
    if fields.get("applicant_name"):
        applicant_name = extract_name_from_span(fields["applicant_name"])

    if not applicant_name:
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                candidate = ent.text.strip()
                words_lower = {w.lower().strip(".,'-") for w in candidate.split()}
                if not (words_lower & NAME_BLACKLIST_WORDS) and 1 <= len(candidate.split()) <= 4:
                    applicant_name = candidate
                    break

    # --- Submission date ---
    submission_date = None
    if fields.get("date_of_submission"):
        submission_date = extract_date_from_span(fields["date_of_submission"])

    if not submission_date:
        # Fallback: scan whole text for the first well-formed date.
        submission_date = extract_date_from_span(text[:MAX_FIELD_SPAN * 2])

    # --- Subject line (bonus field, useful context for priority scoring) ---
    subject = fields.get("subject")
    if subject:
        subject = subject.strip(" ,.;:-")

    # --- Locations ---
    locations = extract_locations_from_fields(fields, text)

    # --- Organizations ---
    organizations = extract_organizations_from_fields(fields, doc)

    # --- Category and urgency (whole-word matching) ---
    category_matches = tag_category(text)
    urgency_keywords = tag_urgency(text)

    # --- Context: top MAX_CONTEXT_TERMS relevant phrases, excluding
    #     anything already captured by a structured field above ---
    exclude_terms = {normalize_phrase(applicant_name)} if applicant_name else set()
    if subject:
        exclude_terms.add(normalize_phrase(subject))
    exclude_terms.update(normalize_phrase(loc) for loc in locations)
    exclude_terms.update(normalize_phrase(org) for org in organizations)

    context = extract_context(doc, exclude_terms=exclude_terms)

    return {
        "context": context,
        "applicant_name": applicant_name,
        "submission_date": submission_date,
        "subject": subject,
        "locations": locations,
        "organizations": organizations,
        "category_matches": category_matches,
        "category_method": "keyword_match_whole_word",
        "urgency_keywords": urgency_keywords,
    }




def main():
    input_data = sys.stdin.read()

    try:
        chunks = json.loads(input_data)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": "Invalid JSON input", "details": str(e)}))
        sys.exit(1)

    results = [process_chunk(chunk) for chunk in chunks]

    try:
        print(json.dumps(results, ensure_ascii=False))
    except UnicodeEncodeError:
        # Safety net: fall back to ASCII-escaped output rather than crash.
        print(json.dumps(results, ensure_ascii=True))


if __name__ == "__main__":
    main()