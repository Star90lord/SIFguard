import json
from pathlib import Path

from nlp_service.app.core.config import DATA_DIR


# --------------------------------------------------
# IOGP Rules Path
# --------------------------------------------------

IOGP_RULES_PATH = (
    DATA_DIR
    / "iogp"
    / "life_saving_rules.json"
)


# --------------------------------------------------
# Load Rules
# --------------------------------------------------

def load_iogp_rules() -> list[dict]:
    """
    Load IOGP Life-Saving Rules from JSON.
    """

    if not IOGP_RULES_PATH.exists():
        raise FileNotFoundError(
            f"IOGP rules file not found: {IOGP_RULES_PATH}"
        )

    with IOGP_RULES_PATH.open(
        "r",
        encoding="utf-8"
    ) as file:
        data = json.load(file)

    rules = data.get("rules")

    if not isinstance(rules, list):
        raise ValueError(
            "IOGP rules JSON must contain a 'rules' list."
        )

    return rules


# --------------------------------------------------
# Find Rule by Name
# --------------------------------------------------

def get_iogp_rule(
    rule_name: str
) -> dict | None:
    """
    Find an IOGP rule by its name.
    """

    if not isinstance(rule_name, str):
        raise TypeError(
            "rule_name must be a string."
        )

    target = rule_name.strip().lower()

    for rule in load_iogp_rules():
        if rule.get("name", "").lower() == target:
            return rule

    return None