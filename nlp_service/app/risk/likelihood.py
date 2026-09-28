def calculate_likelihood(
    precursor_count: int,
    high_risk_rule_count: int = 0,
    hazard_count: int = 0
) -> int:
    """
    Estimate likelihood of a harmful event.

    Inputs:
        precursor_count:
            Number of detected safety precursors.

        high_risk_rule_count:
            Number of high-risk IOGP Life-Saving Rules detected.

        hazard_count:
            Number of hazards detected in the report.

    Returns:
        Likelihood score from 1 to 5.
    """

    if not isinstance(precursor_count, int):
        raise TypeError(
            "precursor_count must be an integer."
        )

    if not isinstance(high_risk_rule_count, int):
        raise TypeError(
            "high_risk_rule_count must be an integer."
        )

    if not isinstance(hazard_count, int):
        raise TypeError(
            "hazard_count must be an integer."
        )

    if precursor_count < 0:
        raise ValueError(
            "precursor_count cannot be negative."
        )

    if high_risk_rule_count < 0:
        raise ValueError(
            "high_risk_rule_count cannot be negative."
        )

    if hazard_count < 0:
        raise ValueError(
            "hazard_count cannot be negative."
        )

    score = 1

    if precursor_count >= 2:
        score += 1

    if precursor_count >= 4:
        score += 1

    if high_risk_rule_count >= 1:
        score += 1

    if hazard_count >= 2:
        score += 1

    return min(score, 5)