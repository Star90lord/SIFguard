RISK_MATRIX = {
    1: {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5
    },

    2: {
        1: 2,
        2: 4,
        3: 6,
        4: 8,
        5: 10
    },

    3: {
        1: 3,
        2: 6,
        3: 9,
        4: 12,
        5: 15
    },

    4: {
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20
    },

    5: {
        1: 5,
        2: 10,
        3: 15,
        4: 20,
        5: 25
    }
}


def calculate_risk(
    likelihood: int,
    severity: int
) -> int:
    """
    Calculate risk score using a 5x5 risk matrix.

    Likelihood: 1-5
    Severity:   1-5
    """

    if not isinstance(likelihood, int):
        raise TypeError(
            "likelihood must be an integer."
        )

    if not isinstance(severity, int):
        raise TypeError(
            "severity must be an integer."
        )

    if likelihood < 1 or likelihood > 5:
        raise ValueError(
            "likelihood must be between 1 and 5."
        )

    if severity < 1 or severity > 5:
        raise ValueError(
            "severity must be between 1 and 5."
        )

    return RISK_MATRIX[likelihood][severity]


def get_risk_level(
    risk_score: int
) -> str:
    """
    Convert risk score into a risk level.
    """

    if not isinstance(risk_score, int):
        raise TypeError(
            "risk_score must be an integer."
        )

    if risk_score < 1 or risk_score > 25:
        raise ValueError(
            "risk_score must be between 1 and 25."
        )

    if risk_score <= 4:
        return "Low"

    if risk_score <= 9:
        return "Moderate"

    if risk_score <= 16:
        return "High"

    return "Extreme"