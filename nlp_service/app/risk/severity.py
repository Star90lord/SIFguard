def calculate_severity(
    hazard_count: int,
    high_risk_rule_count: int = 0,
    critical_hazard_count: int = 0
) -> int:
    """
    Estimate potential consequence severity.

    Inputs:
        hazard_count:
            Total hazards detected.

        high_risk_rule_count:
            Number of high-risk IOGP Life-Saving Rules detected.

        critical_hazard_count:
            Number of hazards capable of causing
            severe injury or fatality.

    Returns:
        Severity score from 1 to 5.
    """

    if not isinstance(hazard_count, int):
        raise TypeError(
            "hazard_count must be an integer."
        )

    if not isinstance(high_risk_rule_count, int):
        raise TypeError(
            "high_risk_rule_count must be an integer."
        )

    if not isinstance(critical_hazard_count, int):
        raise TypeError(
            "critical_hazard_count must be an integer."
        )

    if hazard_count < 0:
        raise ValueError(
            "hazard_count cannot be negative."
        )

    if high_risk_rule_count < 0:
        raise ValueError(
            "high_risk_rule_count cannot be negative."
        )

    if critical_hazard_count < 0:
        raise ValueError(
            "critical_hazard_count cannot be negative."
        )

    score = 1

    if hazard_count >= 1:
        score += 1

    if hazard_count >= 2:
        score += 1

    if high_risk_rule_count >= 1:
        score += 1

    if critical_hazard_count >= 1:
        score += 1

    return min(score, 5)