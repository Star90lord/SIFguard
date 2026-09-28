from transformers import AutoTokenizer

from nlp_service.app.core.config import MODEL_PATH
from nlp_service.app.extraction.sentence_splitter import split_sentences
from nlp_service.app.ner.model import load_ner_model
from nlp_service.app.ner.predictor import predict_tokens, extract_entities
from nlp_service.app.ner.entity_normalizer import normalize_entities

from nlp_service.app.safety.precursor_engine import detect_precursors
from nlp_service.app.safety.barrier_engine import detect_barrier_failures
from nlp_service.app.risk.likelihood import calculate_likelihood
from nlp_service.app.risk.severity import calculate_severity
from nlp_service.app.risk.risk_matrix import calculate_risk, get_risk_level
from nlp_service.app.risk.sif_classifier import classify_sif, HIGH_RISK_RULES

from nlp_service.app.explanation.explanation_engine import generate_explanation


_model = None
_tokenizer = None
_device = None


def load_analysis_model():
    """
    Load the trained NER model and tokenizer once.

    The model and tokenizer are cached so that every API
    request does not reload DistilBERT from disk.
    """

    global _model
    global _tokenizer
    global _device

    if _model is None:
        _model, _device = load_ner_model(MODEL_PATH)

    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(
            MODEL_PATH
        )

    return _model, _tokenizer, _device


def _run_ner(
    text: str,
    model,
    tokenizer,
    device
) -> list[dict]:
    """
    Run NER sentence by sentence, combine entities,
    and normalize the final NER output.
    """

    sentences = split_sentences(text)

    all_entities = []

    for sentence in sentences:

        if not sentence.strip():
            continue

        token_predictions = predict_tokens(
            text=sentence,
            tokenizer=tokenizer,
            model=model,
            device=device
        )

        entities = extract_entities(
            token_predictions
        )

        all_entities.extend(entities)

    # --------------------------------------------------
    # Normalize raw NER output before downstream analysis
    # --------------------------------------------------

    return normalize_entities(
        all_entities
    )


def _count_hazards(
    entities: list[dict]
) -> int:
    """
    Count entities classified as hazards.
    """

    return sum(
        1
        for entity in entities
        if entity.get("label") == "Hazard"
    )


def _get_high_risk_rules(
    iogp_rules: list[dict]
) -> list[str]:
    """
    Return detected IOGP rules that belong to
    the configured high-risk Life-Saving Rules.
    """

    return [
        rule.get("rule")
        for rule in iogp_rules
        if rule.get("rule") in HIGH_RISK_RULES
    ]


def _generate_analytics(
    entities: list[dict],
    iogp_rules: list[dict],
    oisd_standards: list[dict],
    oil_context: dict[str, list[str]],
    barrier_failures: list[dict],
    risk_score: int,
    risk_level: str,
    classification: str
) -> dict:
    """
    Generate lightweight report-level analytics.

    These analytics summarize the result of the current
    analysis pipeline. They do not perform a second
    prediction or risk calculation.
    """

    entity_counts = {}

    for entity in entities:

        label = entity.get("label")

        if not label:
            continue

        entity_counts[label] = (
            entity_counts.get(label, 0) + 1
        )

    context_counts = {
        context_type: len(terms)
        for context_type, terms in oil_context.items()
    }

    return {
        "classification": classification,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "entity_count": len(entities),
        "entity_counts": entity_counts,
        "iogp_rule_count": len(iogp_rules),
        "oisd_standard_count": len(oisd_standards),
        "barrier_failure_count": len(barrier_failures),
        "oil_context_count": sum(
            context_counts.values()
        ),
        "oil_context_counts": context_counts
    }


def analyze_text(
    text: str
) -> dict:
    """
    Run the complete SIFguard analysis pipeline on text.
    """

    if not isinstance(text, str):
        raise TypeError(
            "text must be a string."
        )

    if not text.strip():
        raise ValueError(
            "text cannot be empty."
        )

    model, tokenizer, device = load_analysis_model()

    # --------------------------------------------------
    # 1. Named Entity Recognition
    # --------------------------------------------------

    all_entities = _run_ner(
        text=text,
        model=model,
        tokenizer=tokenizer,
        device=device
    )

    # --------------------------------------------------
    # 2. Safety precursor detection
    # --------------------------------------------------

    precursor_result = detect_precursors(
        text=text
    )

    iogp_rules = precursor_result.get(
        "iogp_rules",
        []
    )

    oisd_standards = precursor_result.get(
        "oisd_standards",
        []
    )

    oil_context = precursor_result.get(
        "oil_context",
        {}
    )

    # --------------------------------------------------
    # 3. Barrier failure detection
    # --------------------------------------------------

    barrier_failures = detect_barrier_failures(
        text=text
    )

    # --------------------------------------------------
    # 4. Risk inputs
    # --------------------------------------------------

    high_risk_rules = _get_high_risk_rules(
        iogp_rules
    )

    high_risk_rule_count = len(
        high_risk_rules
    )

    precursor_count = (
        len(iogp_rules)
        + len(oisd_standards)
    )

    hazard_count = _count_hazards(
        all_entities
    )

    # Critical-hazard detection is not yet implemented.
    # Keep this explicit instead of inventing a value.
    critical_hazard_count = 0

    # --------------------------------------------------
    # 5. Likelihood
    # --------------------------------------------------

    likelihood = calculate_likelihood(
        precursor_count=precursor_count,
        high_risk_rule_count=high_risk_rule_count,
        hazard_count=hazard_count
    )

    # --------------------------------------------------
    # 6. Severity
    # --------------------------------------------------

    severity = calculate_severity(
        hazard_count=hazard_count,
        high_risk_rule_count=high_risk_rule_count,
        critical_hazard_count=critical_hazard_count
    )

    # --------------------------------------------------
    # 7. Risk Matrix
    # --------------------------------------------------

    risk_score = calculate_risk(
        likelihood=likelihood,
        severity=severity
    )

    risk_level = get_risk_level(
        risk_score
    )

    # --------------------------------------------------
    # 8. SIF Classification
    # --------------------------------------------------

    sif_result = classify_sif(
        risk_score=risk_score,
        iogp_rules=iogp_rules,
        critical_hazard_count=critical_hazard_count
    )

    classification = sif_result[
        "classification"
    ]

    reasons = sif_result.get(
        "reasons",
        []
    )

    # --------------------------------------------------
    # 9. Explanation
    # --------------------------------------------------

    explanation = generate_explanation(
        classification=classification,
        risk_score=risk_score,
        risk_level=risk_level,
        iogp_rules=iogp_rules,
        oisd_standards=oisd_standards,
        oil_context=oil_context,
        reasons=reasons
    )

    # --------------------------------------------------
    # 10. Report Analytics
    # --------------------------------------------------

    analytics = _generate_analytics(
        entities=all_entities,
        iogp_rules=iogp_rules,
        oisd_standards=oisd_standards,
        oil_context=oil_context,
        barrier_failures=barrier_failures,
        risk_score=risk_score,
        risk_level=risk_level,
        classification=classification
    )

    # --------------------------------------------------
    # 11. Final result
    # --------------------------------------------------

    return {
        "entities": all_entities,

        "safety_analysis": {
            "iogp_rules": iogp_rules,
            "oisd_standards": oisd_standards,
            "oil_context": oil_context,
            "barrier_failures": barrier_failures
        },

        "risk_analysis": {
            "likelihood": likelihood,
            "severity": severity,
            "risk_score": risk_score,
            "risk_level": risk_level
        },

        "sif_classification": sif_result,

        "explanation": explanation,

        "analytics": analytics
    }