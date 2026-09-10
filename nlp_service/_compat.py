"""Windows App-Control compatibility shim.

Some locked-down Windows environments block the compiled ``regex`` package
(``_regex*.pyd`` is unsigned, so Application Control refuses to load it).
``transformers`` imports ``regex`` at startup, which would make the whole
NLP stack unusable there.

Workaround: if the compiled ``regex`` module cannot be imported, alias the
standard-library ``re`` module under the name ``regex``. The SIFguard
pipeline only uses the Hugging Face *fast* (Rust) tokenizers plus plain
``re``-compatible calls, so the fast-tokenizer training/inference path is
unaffected. Anything needing true ``regex``-only syntax (``\\p{...}``,
fuzzy matching) will raise a normal ``re.error`` instead of failing at
import time.

Must be called before importing transformers:

    from nlp_service._compat import ensure_regex_shim
    ensure_regex_shim()
"""

import sys


def ensure_regex_shim():
    try:
        import regex  # noqa: F401
        return False
    except Exception:
        pass

    import re

    sys.modules.setdefault("regex", re)
    return True
