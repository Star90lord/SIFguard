# SIFguard

> AI-powered safety intelligence for identifying Serious Injury and Fatality (SIF) precursors before incidents occur.

## Overview

SIFguard is an AI/NLP-based safety decision-support platform designed for Oil India Limited (OIL). It analyzes unstructured unsafe-act, unsafe-condition, and near-miss reports to detect signals associated with Serious Injury and Fatality (SIF) precursors.

The platform helps safety teams move from retrospective reporting to proactive risk identification by automatically triaging reports, highlighting high-potential risks, and surfacing the hazards and barrier failures that require attention.

## Problem Statement

Large volumes of safety reports contain valuable early-warning information, but manually reviewing and consistently classifying every report is time-consuming. Important patterns can remain hidden across different sites, activities, locations, and reporting styles.

SIFguard addresses this challenge by using natural language processing and machine learning to turn existing safety-report data into actionable safety intelligence.

## Key Capabilities

- **Automated safety report triage**: Screens and prioritizes incoming reports for further review.
- **SIF precursor detection**: Identifies language and patterns associated with high-potential incidents.
- **Risk classification**: Supports classification of reports into relevant risk categories.
- **Explainable insights**: Surfaces the hazards, activities, locations, and barrier failures behind a flagged report.
- **Safety trend analysis**: Reveals recurring unsafe conditions and high-risk patterns over time.
- **HSE decision support**: Helps safety professionals prioritize interventions and corrective actions.
- **Continuous improvement**: Can learn from new reports, expert feedback, and confirmed incidents as the system evolves.

## How It Works

```text
Safety reports
	|
	v
Data preparation and NLP analysis
	|
	v
Hazard, activity, and barrier extraction
	|
	v
SIF precursor detection and risk classification
	|
	v
Explainable triage, trends, and recommended priorities
```

The solution is designed to use OIL's existing safety-report data, reducing the need for new data collection while enabling a scalable path from a focused pilot to wider operational deployment.

## Use Cases

SIFguard supports the following operational use cases:

1. **Automated report screening**: Reduce the effort required to review large volumes of reports.
2. **High-potential risk detection**: Identify reports that may indicate serious injury or fatality precursors.
3. **Hazard and barrier identification**: Find recurring hazards and weaknesses in critical controls.
4. **Safety hotspot analysis**: Highlight patterns by activity, location, department, or operational context.
5. **HSE prioritization**: Direct expert attention toward the risks most likely to require immediate action.

## Feasibility and Viability

### Technical feasibility

- Uses established NLP and machine-learning techniques for textual safety reports.
- Requires primarily software, database, and computing infrastructure.
- Can begin with one site or department and expand as the model and data mature.

### Operational viability

- Reuses existing unsafe-act, unsafe-condition, and near-miss reports.
- Reduces manual effort while maintaining a consistent first-pass analysis.
- Supports expert review rather than replacing safety professionals.
- Provides a feedback loop for improving classifications and detection quality.

### Business potential

Early identification of SIF precursors can help reduce serious incidents, equipment damage, production losses, and associated costs. A reusable platform can also support safety intelligence across OIL sites, departments, and operating environments.

## Expected Impact

SIFguard is intended to help OIL:

- Detect warning signs before they escalate into serious incidents.
- Improve the consistency and speed of safety-report analysis.
- Make safety decisions using evidence from historical and incoming reports.
- Focus corrective actions on recurring hazards and critical barrier failures.
- Strengthen proactive risk management and overall safety performance.

## Project Details

| Field | Details |
| --- | --- |
| Organisation | Oil India Limited |
| Problem statement ID | SIH26165 |
| Theme | Smart Automation |
| Category | Software |
| Team ID | SW2026206 |
| Team name | SIFguard |
| Status | Working MVP / prototype |

## Research Foundation

The concept is informed by research and industry guidance on SIF precursors, safety-report classification, NLP, and life-saving rules, including:

- DEKRA, *SIF Precursors and Paradigms*.
- Martin & Black (2015), *Automatic Identification of PSIF Incidents*.
- Parikh, Penfield & Juaire (2024), *Automated Text Classification of Near-Misses*.
- Fang et al. (2020), *NLP Applications to Safety Occurrence Reports*.
- Ricketts et al. (2023), research on safety classification and learning.
- IOGP Report 459, *Life-Saving Rules*.
- EEI, *Power to Prevent SIF*.

## Roadmap

- Establish a pilot dataset from historical safety reports.
- Develop and validate precursor classification with HSE experts.
- Add explainable hazard, activity, and barrier extraction.
- Introduce trend and hotspot dashboards for operational teams.
- Expand deployment across sites and departments as performance is validated.

## Team

SIFguard is developed for the Smart India Hackathon 2026 under the Smart Automation theme.