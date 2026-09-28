# --------------------------------------------------
# SIFguard Safety Context
# --------------------------------------------------

SAFETY_CONTEXT = {
    "confined_space": {
        "life_saving_rule": "Confined Space",
        "high_risk": True
    },

    "energy_isolation": {
        "life_saving_rule": "Energy Isolation",
        "high_risk": True
    },

    "hot_work": {
        "life_saving_rule": "Hot Work",
        "high_risk": True
    },

    "line_of_fire": {
        "life_saving_rule": "Line of Fire",
        "high_risk": True
    }
}


def get_safety_context(
    context_name: str
) -> dict | None:
    """
    Retrieve safety context by name.
    """

    if not isinstance(context_name, str):
        raise TypeError(
            "context_name must be a string."
        )

    key = context_name.strip().lower()

    return SAFETY_CONTEXT.get(key)