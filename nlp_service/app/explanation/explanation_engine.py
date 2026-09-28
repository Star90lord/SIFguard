def generate_explanation(
    classification: str,
    risk_score: int,
    risk_level: str,
    iogp_rules: list[dict],
    oisd_standards: list[dict],
    oil_context: dict[str, list[str]],
    reasons: list[str]
) -> dict:
    """
    Generate a human-readable explanation for
    the SIFguard risk assessment.
    """

    if not isinstance(classification, str):
        raise TypeError(
            "classification must be a string."
        )

    if not isinstance(risk_score, int):
        raise TypeError(
            "risk_score must be an integer."
        )

    if not isinstance(risk_level, str):
        raise TypeError(
            "risk_level must be a string."
        )

    if not isinstance(iogp_rules, list):
        raise TypeError(
            "iogp_rules must be a list."
        )

    if not isinstance(oisd_standards, list):
        raise TypeError(
            "oisd_standards must be a list."
        )

    if not isinstance(oil_context, dict):
        raise TypeError(
            "oil_context must be a dictionary."
        )

    if not isinstance(reasons, list):
        raise TypeError(
            "reasons must be a list."
        )

    evidence = []

    for rule in iogp_rules:
        rule_name = rule.get("rule")

        if rule_name:
            evidence.append(
                f"IOGP Life-Saving Rule detected: {rule_name}"
            )

    for context_type, terms in oil_context.items():

        for term in terms:
            evidence.append(
                f"OIL context detected: {term}"
            )

    for reason in reasons:
        if reason not in evidence:
            evidence.append(reason)

    standards = []

    for standard in oisd_standards:

        number = standard.get("number")
        name = standard.get("name")

        if number and name:
            standards.append(
                f"{number} — {name}"
            )

    summary = (
        f"{classification} with a risk score of "
        f"{risk_score}/25 ({risk_level})."
    )

    return {
        "summary": summary,
        "classification": classification,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "evidence": evidence,
        "relevant_oisd_standards": standards
    }