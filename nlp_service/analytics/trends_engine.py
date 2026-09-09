# nlp_service/analytics/trends_engine.py

from typing import Dict, List, Any

import pandas as pd
import numpy as np


class TrendsAnalysisEngine:
    """
    Deterministic analytics engine for historical safety reports.

    This engine does not use machine learning.

    It identifies:
        - frequency trends
        - time trends
        - hazard patterns
        - energy patterns
        - barrier failures
        - activity patterns
        - equipment patterns
        - location patterns
        - SIF trends
        - recurring combinations
    """

    def __init__(self):

        self.entity_types = [
            "Hazard",
            "Energy",
            "Barrier",
            "Activity",
            "Equipment",
            "Location",
        ]

    # =====================================================
    # MAIN ANALYSIS
    # =====================================================

    def analyze(
        self,
        reports: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        if not reports:
            return {
                "totalReports": 0,
                "summary": {},
                "trends": {},
                "patterns": {},
                "alerts": [],
            }

        dataframe = pd.DataFrame(reports)

        dataframe = self._prepare_dataframe(
            dataframe
        )

        result = {
            "totalReports": len(dataframe),

            "summary": self._generate_summary(
                dataframe
            ),

            "trends": {
                "time": self._time_trend(
                    dataframe
                ),

                "hazards": self._entity_trend(
                    dataframe,
                    "Hazard"
                ),

                "energy": self._entity_trend(
                    dataframe,
                    "Energy"
                ),

                "barriers": self._entity_trend(
                    dataframe,
                    "Barrier"
                ),

                "activities": self._entity_trend(
                    dataframe,
                    "Activity"
                ),

                "equipment": self._entity_trend(
                    dataframe,
                    "Equipment"
                ),

                "locations": self._entity_trend(
                    dataframe,
                    "Location"
                ),

                "sif": self._sif_trend(
                    dataframe
                ),
            },

            "patterns": {
                "hazardPatterns": self._top_entities(
                    dataframe,
                    "Hazard"
                ),

                "energyPatterns": self._top_entities(
                    dataframe,
                    "Energy"
                ),

                "barrierPatterns": self._top_entities(
                    dataframe,
                    "Barrier"
                ),

                "activityPatterns": self._top_entities(
                    dataframe,
                    "Activity"
                ),

                "equipmentPatterns": self._top_entities(
                    dataframe,
                    "Equipment"
                ),

                "locationPatterns": self._top_entities(
                    dataframe,
                    "Location"
                ),

                "entityCombinations": (
                    self._entity_combinations(
                        dataframe
                    )
                ),
            },

            "alerts": self._generate_alerts(
                dataframe
            ),
        }

        return self._convert_numpy(
            result
        )

    # =====================================================
    # DATA PREPARATION
    # =====================================================

    def _prepare_dataframe(
        self,
        dataframe: pd.DataFrame
    ) -> pd.DataFrame:

        dataframe = dataframe.copy()

        # ---------------------------------------------
        # DATE
        # ---------------------------------------------

        date_columns = [
            "incident_date",
            "incidentDate",
            "date",
            "createdAt",
        ]

        date_column = None

        for column in date_columns:

            if column in dataframe.columns:
                date_column = column
                break

        if date_column:

            dataframe["analysisDate"] = pd.to_datetime(
                dataframe[date_column],
                errors="coerce"
            )

        else:

            dataframe["analysisDate"] = pd.NaT

        # ---------------------------------------------
        # ENTITY COLUMNS
        # ---------------------------------------------

        for entity in self.entity_types:

            if entity not in dataframe.columns:

                dataframe[entity] = [
                    []
                    for _ in range(len(dataframe))
                ]

            else:

                dataframe[entity] = (
                    dataframe[entity]
                    .apply(self._normalize_entity_values)
                )

        # ---------------------------------------------
        # SIF POTENTIAL
        # ---------------------------------------------

        if "sifPotential" not in dataframe.columns:

            if "sif_potential" in dataframe.columns:
                dataframe["sifPotential"] = (
                    dataframe["sif_potential"]
                )

            else:
                dataframe["sifPotential"] = (
                    "Non-SIF"
                )

        dataframe["sifPotential"] = (
            dataframe["sifPotential"]
            .fillna("Non-SIF")
            .astype(str)
        )

        # ---------------------------------------------
        # RISK SCORE
        # ---------------------------------------------

        if "riskScore" in dataframe.columns:

            dataframe["riskScore"] = pd.to_numeric(
                dataframe["riskScore"],
                errors="coerce"
            )

        else:

            dataframe["riskScore"] = np.nan

        # ---------------------------------------------
        # RISK LEVEL
        # ---------------------------------------------

        if "riskLevel" not in dataframe.columns:

            dataframe["riskLevel"] = "Unknown"

        dataframe["riskLevel"] = (
            dataframe["riskLevel"]
            .fillna("Unknown")
            .astype(str)
        )

        return dataframe

    # =====================================================
    # SUMMARY
    # =====================================================

    def _generate_summary(
        self,
        dataframe: pd.DataFrame
    ) -> Dict[str, Any]:

        total_reports = len(dataframe)

        sif_reports = int(
            (
                dataframe["sifPotential"]
                .str.lower()
                .str.contains("sif")
            ).sum()
        )

        risk_scores = dataframe[
            "riskScore"
        ].dropna()

        average_risk = (
            float(risk_scores.mean())
            if not risk_scores.empty
            else None
        )

        return {
            "totalReports": total_reports,
            "sifPotentialReports": sif_reports,
            "sifPercentage": (
                round(
                    (sif_reports / total_reports) * 100,
                    2
                )
                if total_reports
                else 0
            ),
            "averageRiskScore": average_risk,
            "riskLevelDistribution": (
                dataframe["riskLevel"]
                .value_counts()
                .to_dict()
            ),
        }

    # =====================================================
    # TIME TREND
    # =====================================================

    def _time_trend(
        self,
        dataframe: pd.DataFrame
    ) -> List[Dict[str, Any]]:

        valid_dates = dataframe[
            dataframe["analysisDate"].notna()
        ].copy()

        if valid_dates.empty:
            return []

        valid_dates["month"] = (
            valid_dates["analysisDate"]
            .dt.to_period("M")
            .astype(str)
        )

        grouped = (
            valid_dates
            .groupby("month")
            .size()
            .reset_index(
                name="reportCount"
            )
        )

        return grouped.to_dict(
            orient="records"
        )

    # =====================================================
    # ENTITY TREND
    # =====================================================

    def _entity_trend(
        self,
        dataframe: pd.DataFrame,
        entity_type: str
    ) -> List[Dict[str, Any]]:

        valid_dates = dataframe[
            dataframe["analysisDate"].notna()
        ].copy()

        if valid_dates.empty:
            return []

        valid_dates["month"] = (
            valid_dates["analysisDate"]
            .dt.to_period("M")
            .astype(str)
        )

        records = []

        for _, row in valid_dates.iterrows():

            for entity in row[entity_type]:

                records.append({
                    "month": row["month"],
                    "entity": entity,
                })

        if not records:
            return []

        entity_dataframe = pd.DataFrame(
            records
        )

        grouped = (
            entity_dataframe
            .groupby(
                ["month", "entity"]
            )
            .size()
            .reset_index(
                name="count"
            )
        )

        return grouped.to_dict(
            orient="records"
        )

    # =====================================================
    # SIF TREND
    # =====================================================

    def _sif_trend(
        self,
        dataframe: pd.DataFrame
    ) -> List[Dict[str, Any]]:

        valid_dates = dataframe[
            dataframe["analysisDate"].notna()
        ].copy()

        if valid_dates.empty:
            return []

        valid_dates["month"] = (
            valid_dates["analysisDate"]
            .dt.to_period("M")
            .astype(str)
        )

        valid_dates["isSIF"] = (
            valid_dates["sifPotential"]
            .str.lower()
            .str.contains("sif")
        )

        grouped = (
            valid_dates
            .groupby("month")
            .agg(
                totalReports=(
                    "sifPotential",
                    "count"
                ),
                sifReports=(
                    "isSIF",
                    "sum"
                )
            )
            .reset_index()
        )

        grouped["sifPercentage"] = (
            grouped["sifReports"]
            / grouped["totalReports"]
            * 100
        ).round(2)

        return grouped.to_dict(
            orient="records"
        )

    # =====================================================
    # TOP ENTITIES
    # =====================================================

    def _top_entities(
        self,
        dataframe: pd.DataFrame,
        entity_type: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:

        values = []

        for entity_values in dataframe[
            entity_type
        ]:

            values.extend(
                entity_values
            )

        if not values:
            return []

        counts = (
            pd.Series(values)
            .value_counts()
            .head(limit)
        )

        return [
            {
                "entity": str(entity),
                "count": int(count),
                "percentage": round(
                    (
                        count
                        / len(dataframe)
                    ) * 100,
                    2
                ),
            }

            for entity, count
            in counts.items()
        ]

    # =====================================================
    # ENTITY COMBINATIONS
    # =====================================================

    def _entity_combinations(
        self,
        dataframe: pd.DataFrame
    ) -> List[Dict[str, Any]]:

        combinations = {}

        for _, row in dataframe.iterrows():

            hazards = row["Hazard"]
            energies = row["Energy"]
            activities = row["Activity"]

            for hazard in hazards:

                for energy in energies:

                    key = (
                        hazard,
                        energy
                    )

                    combinations[key] = (
                        combinations.get(
                            key,
                            0
                        ) + 1
                    )

                for activity in activities:

                    key = (
                        hazard,
                        activity
                    )

                    combinations[key] = (
                        combinations.get(
                            key,
                            0
                        ) + 1
                    )

        sorted_combinations = sorted(
            combinations.items(),
            key=lambda item: item[1],
            reverse=True
        )

        results = []

        for (
            (first_entity, second_entity),
            count
        ) in sorted_combinations[:10]:

            results.append({
                "entity1": first_entity,
                "entity2": second_entity,
                "count": int(count),
            })

        return results

    # =====================================================
    # ALERT GENERATION
    # =====================================================

    def _generate_alerts(
        self,
        dataframe: pd.DataFrame
    ) -> List[str]:

        alerts = []

        # ---------------------------------------------
        # SIF ALERT
        # ---------------------------------------------

        total = len(dataframe)

        sif_count = int(
            dataframe["sifPotential"]
            .str.lower()
            .str.contains("sif")
            .sum()
        )

        if total > 0:

            sif_percentage = (
                sif_count / total
            ) * 100

            if sif_percentage >= 20:

                alerts.append(
                    f"SIF-potential reports represent "
                    f"{sif_percentage:.2f}% of reports."
                )

        # ---------------------------------------------
        # HIGH-RISK ALERT
        # ---------------------------------------------

        high_risk_levels = [
            "High",
            "Extreme",
        ]

        high_risk_count = int(
            dataframe["riskLevel"]
            .isin(high_risk_levels)
            .sum()
        )

        if high_risk_count > 0:

            percentage = (
                high_risk_count / total
            ) * 100

            if percentage >= 30:

                alerts.append(
                    f"{percentage:.2f}% of reports "
                    f"are classified as High or Extreme risk."
                )

        # ---------------------------------------------
        # BARRIER FAILURE ALERT
        # ---------------------------------------------

        barrier_values = []

        for values in dataframe["Barrier"]:
            barrier_values.extend(values)

        failure_keywords = [
            "failed",
            "missing",
            "broken",
            "damaged",
            "not isolated",
            "without isolation",
            "bypassed",
        ]

        failure_count = 0

        for barrier in barrier_values:

            if any(
                keyword in barrier
                for keyword in failure_keywords
            ):

                failure_count += 1

        if failure_count > 0:

            alerts.append(
                f"{failure_count} reports contain "
                f"potential barrier/control failures."
            )

        return alerts

    # =====================================================
    # NORMALIZE ENTITY VALUES
    # =====================================================

    def _normalize_entity_values(
        self,
        values
    ) -> List[str]:

        if values is None:
            return []

        if isinstance(values, str):

            values = values.split(",")

        if not isinstance(values, list):

            return []

        return [
            str(value)
            .strip()
            .lower()

            for value in values

            if str(value).strip()
        ]

    # =====================================================
    # CONVERT NUMPY TYPES
    # =====================================================

    def _convert_numpy(
        self,
        value
    ):

        if isinstance(
            value,
            dict
        ):

            return {
                key: self._convert_numpy(
                    item
                )

                for key, item
                in value.items()
            }

        if isinstance(
            value,
            list
        ):

            return [
                self._convert_numpy(
                    item
                )

                for item in value
            ]

        if isinstance(
            value,
            (
                np.integer,
                np.int64
            )
        ):

            return int(value)

        if isinstance(
            value,
            (
                np.floating,
                np.float64
            )
        ):

            return float(value)

        if pd.isna(value):

            return None

        return value