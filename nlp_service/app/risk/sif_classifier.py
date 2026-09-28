HIGH_RISK_RULES = {
    "Confined Space",
    "Energy Isolation",
    "Hot Work",
    "Line of Fire",
    "Safe Mechanical Lifting",
    "Working at Height",
    "Bypassing Safety Controls"
}


def classify_sif(
    risk_score: int,
    iogp_rules: list[dict],
    critical_hazard_count: int = 0
) -> dict:
    """
    Classify a report as SIF-Potential or Non-SIF.

    Classification is based on:
    - Overall risk score
    - High-risk IOGP Life-Saving Rules
    - Critical hazards

    Returns a structured classification with reasons.
    """

    if not isinstance(risk_score, int):
        raise TypeError(
            "risk_score must be an integer."
        )

    if not isinstance(iogp_rules, list):
        raise TypeError(
            "iogp_rules must be a list."
        )

    if not isinstance(critical_hazard_count, int):
        raise TypeError(
            "critical_hazard_count must be an integer."
        )

    if risk_score < 1 or risk_score > 25:
        raise ValueError(
            "risk_score must be between 1 and 25."
        )

    if critical_hazard_count < 0:
        raise ValueError(
            "critical_hazard_count cannot be negative."
        )

    high_risk_rules = []

    for rule in iogp_rules:

        rule_name = rule.get("rule")

        if rule_name in HIGH_RISK_RULES:
            high_risk_rules.append(rule_name)

    reasons = []

    if risk_score >= 15:
        reasons.append(
            "High overall risk score"
        )

    if high_risk_rules:
        reasons.append(
            "High-risk Life-Saving Rule involved"
        )

    if critical_hazard_count >= 1:
        reasons.append(
            "Critical hazard detected"
        )

    sif_potential = (
        risk_score >= 15
        or len(high_risk_rules) >= 1
        or critical_hazard_count >= 1
    )

    if sif_potential:
        classification = "SIF-Potential"
    else:
        classification = "Non-SIF"

    return {
        "classification": classification,
        "sif_potential": sif_potential,
        "high_risk_rules": high_risk_rules,
        "reasons": reasons
    }