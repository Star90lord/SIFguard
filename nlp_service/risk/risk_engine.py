# nlp_service/risk/risk_engine.py

from typing import Dict, List, Any


class RiskMatrixEngine:
    """
    Deterministic Risk Matrix Engine.

    This engine does NOT use machine learning.

    Input:
        Safety entities extracted by the NER model.

    Output:
        Likelihood
        Severity
        Risk Score
        Risk Level
        SIF Potential
        Reasons
    """

    def __init__(self):

        # ---------------------------------------------
        # LIKELIHOOD SCALE
        # ---------------------------------------------

        self.likelihood_levels = {
            1: "Rare",
            2: "Unlikely",
            3: "Possible",
            4: "Likely",
            5: "Almost Certain",
        }

        # ---------------------------------------------
        # SEVERITY SCALE
        # ---------------------------------------------

        self.severity_levels = {
            1: "Insignificant",
            2: "Minor",
            3: "Moderate",
            4: "Major",
            5: "Catastrophic",
        }

        # ---------------------------------------------
        # RISK LEVELS
        # ---------------------------------------------

        self.risk_levels = {
            1: "Low",
            2: "Low",
            3: "Low",
            4: "Low",

            5: "Medium",
            6: "Medium",
            7: "Medium",
            8: "Medium",
            9: "Medium",

            10: "High",
            11: "High",
            12: "High",
            13: "High",
            14: "High",
            15: "High",
            16: "High",

            17: "Extreme",
            18: "Extreme",
            19: "Extreme",
            20: "Extreme",
            21: "Extreme",
            22: "Extreme",
            23: "Extreme",
            24: "Extreme",
            25: "Extreme",
        }

        # ---------------------------------------------
        # CATASTROPHIC HAZARDS
        # ---------------------------------------------

        self.catastrophic_hazards = [
            "fatal",
            "fatality",
            "death",
            "electrocution",
            "explosion",
            "arc flash",
            "confined space",
            "fall from height",
            "hydrocarbon leak",
            "gas leak",
            "toxic gas",
            "pressure release",
            "high pressure",
            "engulfment",
            "crushing",
            "dropped object",
        ]

        # ---------------------------------------------
        # MAJOR HAZARDS
        # ---------------------------------------------

        self.major_hazards = [
            "fire",
            "chemical exposure",
            "chemical spill",
            "burn",
            "vehicle collision",
            "vehicle rollover",
            "electric shock",
            "fall",
            "injury",
        ]

        # ---------------------------------------------
        # HIGH ENERGY SOURCES
        # ---------------------------------------------

        self.high_energy_sources = [
            "electrical",
            "electricity",
            "high voltage",
            "pressure",
            "hydraulic",
            "pneumatic",
            "steam",
            "thermal",
            "chemical",
            "mechanical",
            "gravity",
            "hydrocarbon",
            "stored energy",
        ]

        # ---------------------------------------------
        # CRITICAL ACTIVITIES
        # ---------------------------------------------

        self.critical_activities = [
            "hot work",
            "welding",
            "cutting",
            "confined space entry",
            "confined space",
            "working at height",
            "lifting",
            "excavation",
            "electrical maintenance",
            "pressure testing",
            "line breaking",
            "drilling",
            "scaffolding",
        ]

        # ---------------------------------------------
        # BARRIER FAILURE INDICATORS
        # ---------------------------------------------

        self.barrier_failures = [
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

        # ---------------------------------------------
        # UNSAFE CONDITION INDICATORS
        # ---------------------------------------------

        self.unsafe_conditions = [
            "leak",
            "leaking",
            "unstable",
            "loose",
            "exposed",
            "unsecured",
            "slippery",
            "blocked",
            "damaged",
            "broken",
        ]

    # =================================================
    # PUBLIC METHOD
    # =================================================

    def assess(
        self,
        entities: Dict[str, List[str]],
        text: str = ""
    ) -> Dict[str, Any]:

        """
        Perform complete deterministic risk assessment.
        """

        normalized_entities = self._normalize_entities(
            entities
        )

        combined_text = self._build_text(
            normalized_entities,
            text
        )

        # ---------------------------------------------
        # CALCULATE LIKELIHOOD
        # ---------------------------------------------

        likelihood, likelihood_reasons = (
            self._calculate_likelihood(
                normalized_entities,
                combined_text
            )
        )

        # ---------------------------------------------
        # CALCULATE SEVERITY
        # ---------------------------------------------

        severity, severity_reasons = (
            self._calculate_severity(
                normalized_entities,
                combined_text
            )
        )

        # ---------------------------------------------
        # RISK SCORE
        # ---------------------------------------------

        risk_score = likelihood * severity

        risk_level = self._get_risk_level(
            risk_score
        )

        # ---------------------------------------------
        # SIF POTENTIAL
        # ---------------------------------------------

        sif_potential, sif_reasons = (
            self._calculate_sif_potential(
                normalized_entities,
                combined_text,
                severity,
                risk_score
            )
        )

        # ---------------------------------------------
        # COMBINE REASONS
        # ---------------------------------------------

        reasons = (
            likelihood_reasons
            + severity_reasons
            + sif_reasons
        )

        # ---------------------------------------------
        # FINAL RESPONSE
        # ---------------------------------------------

        return {
            "likelihood": likelihood,
            "severity": severity,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "sifPotential": sif_potential,
            "reasons": reasons,
        }

    # =================================================
    # NORMALIZE ENTITIES
    # =================================================

    def _normalize_entities(
        self,
        entities: Dict[str, List[str]]
    ) -> Dict[str, List[str]]:

        normalized = {}

        expected_entities = [
            "Hazard",
            "Energy",
            "Barrier",
            "Activity",
            "Equipment",
            "Location",
        ]

        for entity_type in expected_entities:

            values = entities.get(
                entity_type,
                []
            )

            if isinstance(values, str):
                values = [values]

            normalized[entity_type] = [
                str(value).strip().lower()
                for value in values
                if str(value).strip()
            ]

        return normalized

    # =================================================
    # BUILD SEARCH TEXT
    # =================================================

    def _build_text(
        self,
        entities: Dict[str, List[str]],
        text: str
    ) -> str:

        values = []

        for entity_values in entities.values():
            values.extend(entity_values)

        if text:
            values.append(text.lower())

        return " ".join(values)

    # =================================================
    # LIKELIHOOD
    # =================================================

    def _calculate_likelihood(
        self,
        entities: Dict[str, List[str]],
        text: str
    ) -> tuple:

        score = 1
        reasons = []

        # ---------------------------------------------
        # BARRIER FAILURE
        # ---------------------------------------------

        barrier_text = " ".join(
            entities.get("Barrier", [])
        )

        for indicator in self.barrier_failures:

            if indicator in barrier_text:

                score = max(score, 5)

                reasons.append(
                    f"Likelihood increased to 5 because "
                    f"barrier/control failure was detected: "
                    f"'{indicator}'."
                )

                break

        # ---------------------------------------------
        # UNSAFE CONDITIONS
        # ---------------------------------------------

        for indicator in self.unsafe_conditions:

            if indicator in text:

                score = max(score, 4)

                reasons.append(
                    f"Likelihood increased because an "
                    f"unsafe condition was detected: "
                    f"'{indicator}'."
                )

                break

        # ---------------------------------------------
        # MULTIPLE HAZARDS
        # ---------------------------------------------

        hazard_count = len(
            entities.get("Hazard", [])
        )

        if hazard_count >= 3:

            score = max(score, 4)

            reasons.append(
                "Likelihood increased because "
                "multiple hazards were identified."
            )

        # ---------------------------------------------
        # REPEATED / CONTINUOUS EXPOSURE
        # ---------------------------------------------

        exposure_terms = [
            "repeated",
            "frequent",
            "ongoing",
            "continuous",
            "multiple",
            "regularly",
        ]

        for term in exposure_terms:

            if term in text:

                score = max(score, 4)

                reasons.append(
                    f"Likelihood increased because "
                    f"repeated or continuous exposure "
                    f"was indicated: '{term}'."
                )

                break

        return score, reasons

    # =================================================
    # SEVERITY
    # =================================================

    def _calculate_severity(
        self,
        entities: Dict[str, List[str]],
        text: str
    ) -> tuple:

        score = 1
        reasons = []

        hazard_text = " ".join(
            entities.get("Hazard", [])
        )

        energy_text = " ".join(
            entities.get("Energy", [])
        )

        activity_text = " ".join(
            entities.get("Activity", [])
        )

        # ---------------------------------------------
        # CATASTROPHIC HAZARDS
        # ---------------------------------------------

        for hazard in self.catastrophic_hazards:

            if hazard in hazard_text or hazard in text:

                score = max(score, 5)

                reasons.append(
                    f"Severity set to 5 (Catastrophic) "
                    f"because a catastrophic hazard "
                    f"was identified: '{hazard}'."
                )

                break

        # ---------------------------------------------
        # MAJOR HAZARDS
        # ---------------------------------------------

        if score < 5:

            for hazard in self.major_hazards:

                if hazard in hazard_text or hazard in text:

                    score = max(score, 4)

                    reasons.append(
                        f"Severity set to at least 4 "
                        f"(Major) because a major hazard "
                        f"was identified: '{hazard}'."
                    )

                    break

        # ---------------------------------------------
        # HIGH ENERGY
        # ---------------------------------------------

        for energy in self.high_energy_sources:

            if energy in energy_text:

                score = max(score, 4)

                reasons.append(
                    f"Severity increased because "
                    f"high-energy source was identified: "
                    f"'{energy}'."
                )

                break

        # ---------------------------------------------
        # CRITICAL ACTIVITIES
        # ---------------------------------------------

        for activity in self.critical_activities:

            if activity in activity_text:

                score = max(score, 4)

                reasons.append(
                    f"Severity increased because a "
                    f"critical activity was identified: "
                    f"'{activity}'."
                )

                break

        return score, reasons

    # =================================================
    # RISK LEVEL
    # =================================================

    def _get_risk_level(
        self,
        risk_score: int
    ) -> str:

        return self.risk_levels.get(
            risk_score,
            "Unknown"
        )

    # =================================================
    # SIF POTENTIAL
    # =================================================

    def _calculate_sif_potential(
        self,
        entities: Dict[str, List[str]],
        text: str,
        severity: int,
        risk_score: int
    ) -> tuple:

        reasons = []

        hazard_text = " ".join(
            entities.get("Hazard", [])
        )

        barrier_text = " ".join(
            entities.get("Barrier", [])
        )

        energy_text = " ".join(
            entities.get("Energy", [])
        )

        # ---------------------------------------------
        # CATASTROPHIC HAZARD
        # ---------------------------------------------

        for hazard in self.catastrophic_hazards:

            if hazard in hazard_text or hazard in text:

                reasons.append(
                    f"SIF potential identified because "
                    f"the report contains a critical "
                    f"SIF precursor: '{hazard}'."
                )

                return "SIF-Potential", reasons

        # ---------------------------------------------
        # CATASTROPHIC SEVERITY
        # ---------------------------------------------

        if severity == 5:

            reasons.append(
                "SIF potential identified because "
                "severity reached the Catastrophic level."
            )

            return "SIF-Potential", reasons

        # ---------------------------------------------
        # EXTREME RISK
        # ---------------------------------------------

        if risk_score >= 17:

            reasons.append(
                f"SIF potential identified because "
                f"risk score reached the Extreme range "
                f"({risk_score})."
            )

            return "SIF-Potential", reasons

        # ---------------------------------------------
        # HIGH ENERGY + FAILED BARRIER
        # ---------------------------------------------

        barrier_failure = any(
            indicator in barrier_text
            for indicator in self.barrier_failures
        )

        high_energy = any(
            energy in energy_text
            for energy in self.high_energy_sources
        )

        if high_energy and barrier_failure:

            reasons.append(
                "SIF potential identified because "
                "high-energy exposure occurred together "
                "with a failed or missing barrier."
            )

            return "SIF-Potential", reasons

        # ---------------------------------------------
        # NOT SIF
        # ---------------------------------------------

        reasons.append(
            "No critical SIF precursor combination "
            "was detected by the current rule set."
        )

        return "Non-SIF", reasons