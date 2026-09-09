# nlp_service/risk/risk_rules.py


# ---------------------------------------------------------
# HIGH-SEVERITY HAZARDS
# ---------------------------------------------------------

HIGH_SEVERITY_HAZARDS = [
    "electrocution",
    "electric shock",
    "arc flash",
    "explosion",
    "fire",
    "hydrocarbon leak",
    "gas leak",
    "toxic gas",
    "confined space",
    "fall from height",
    "dropped object",
    "crushing",
    "engulfment",
    "pressure release",
    "high pressure",
    "vehicle collision",
    "vehicle rollover",
]


# ---------------------------------------------------------
# HIGH-ENERGY SOURCES
# ---------------------------------------------------------

HIGH_ENERGY_SOURCES = [
    "electrical",
    "electricity",
    "high voltage",
    "pressure",
    "hydraulic",
    "pneumatic",
    "steam",
    "thermal",
    "chemical",
    "stored energy",
    "mechanical",
    "gravity",
    "hydrocarbon",
]


# ---------------------------------------------------------
# CRITICAL ACTIVITIES
# ---------------------------------------------------------

CRITICAL_ACTIVITIES = [
    "hot work",
    "welding",
    "cutting",
    "confined space entry",
    "working at height",
    "lifting",
    "excavation",
    "electrical maintenance",
    "pressure testing",
    "line breaking",
    "maintenance",
    "drilling",
    "scaffolding",
]


# ---------------------------------------------------------
# CRITICAL EQUIPMENT
# ---------------------------------------------------------

CRITICAL_EQUIPMENT = [
    "crane",
    "forklift",
    "pressure vessel",
    "pipeline",
    "transformer",
    "electrical panel",
    "compressor",
    "pump",
    "scaffold",
    "ladder",
    "truck",
    "drilling machine",
]


# ---------------------------------------------------------
# BARRIER / CONTROL INDICATORS
# ---------------------------------------------------------

BARRIER_FAILURE_INDICATORS = [
    "failed",
    "failure",
    "missing",
    "damaged",
    "broken",
    "defective",
    "not working",
    "not isolated",
    "without isolation",
    "no isolation",
    "bypassed",
    "bypass",
    "removed",
    "unguarded",
    "unprotected",
    "loose",
    "inadequate",
]


BARRIER_PRESENT_INDICATORS = [
    "isolated",
    "lockout",
    "tagout",
    "guarded",
    "protected",
    "secured",
    "barrier installed",
    "permit issued",
    "ppe used",
]