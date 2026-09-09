# SIFguard

## AI/NLP-Based Serious Injury & Fatality (SIF) Precursor Detection and Safety Intelligence Platform

SIFguard is an intelligent safety-analysis platform designed to identify **Serious Injury & Fatality (SIF) precursors** from unsafe-act, unsafe-condition, near-miss, and incident reports.

The platform combines **document processing, OCR, Natural Language Processing (NLP), fine-tuned DistilBERT-based Named Entity Recognition (NER), deterministic risk assessment, and historical trend/pattern analysis** to transform unstructured safety reports into structured and actionable safety intelligence.

The primary objective of SIFguard is to help safety teams identify potentially high-consequence events earlier, understand the contributing safety factors, prioritize risks, and discover recurring patterns across historical reports.

---

# Problem Statement

Safety and incident reports are frequently submitted as unstructured text, PDFs, scanned documents, images, or manually written reports.

Traditional safety-report processing can involve significant manual effort:

* Reading large numbers of incident and near-miss reports
* Identifying hazards manually
* Finding hazardous energy sources
* Identifying failed or missing barriers
* Determining which activities and equipment were involved
* Assessing the potential severity of an event
* Identifying reports that may contain SIF precursors
* Comparing current incidents with historical incidents
* Detecting recurring hazards and patterns

This creates several challenges:

### 1. Manual Report Analysis

Safety personnel may need to review a large number of reports individually.

### 2. Unstructured Information

Important safety information is buried inside natural-language descriptions.

For example:

> "During maintenance of the pump, electrical energy was not isolated and hydrocarbon leakage was observed."

Important information is present, but it is not structured.

### 3. Difficult SIF Precursor Identification

A report may describe an event that did not result in a serious injury but contained the conditions capable of producing a fatal or life-changing event.

### 4. Inconsistent Risk Assessment

Manual interpretation can vary between reviewers if there is no consistent and explainable risk-assessment mechanism.

### 5. Lack of Historical Intelligence

Individual reports do not necessarily reveal recurring patterns such as:

* Repeated electrical hazards
* Repeated barrier failures
* Recurring high-risk activities
* Specific equipment repeatedly involved in incidents
* Increasing SIF-potential events
* Recurring hazard-energy combinations

---

# Proposed Solution

SIFguard addresses these problems through an automated safety-intelligence pipeline.

The system converts an uploaded report into structured safety information and performs risk and pattern analysis.

```text
Safety Report
     │
     ▼
Document Processing
     │
     ├── PDF Text Extraction
     ├── OCR for Scanned Documents
     └── Image / TXT Processing
     │
     ▼
Text Cleaning
     │
     ▼
Fine-Tuned DistilBERT NER
     │
     ▼
Safety Entity Extraction
     │
     ├── Hazard
     ├── Energy
     ├── Barrier
     ├── Activity
     ├── Equipment
     └── Location
     │
     ▼
Risk Feature Mapping
     │
     ▼
Risk Matrix Engine
     │
     ├── Likelihood
     ├── Severity
     ├── Risk Score
     ├── Risk Level
     └── SIF Potential
     │
     ▼
Historical Analytics
     │
     ├── Trends
     ├── Frequency
     ├── Patterns
     ├── Entity Combinations
     └── SIF Trends
     │
     ▼
Safety Intelligence Dashboard
```

---

# Key Objectives

SIFguard is designed to:

* Automatically process safety reports
* Extract important safety information from unstructured text
* Identify SIF precursor indicators
* Structure safety-critical information using NLP
* Apply a consistent risk-assessment methodology
* Calculate likelihood and severity
* Generate a numerical risk score
* Classify reports into risk levels
* Flag potentially serious SIF precursor events
* Explain why a report was classified as high risk
* Analyze historical safety reports
* Detect recurring hazards and safety patterns
* Provide actionable information for safety teams

---

# System Architecture

## High-Level Architecture

```text
                         ┌─────────────────────┐
                         │   Safety Officer    │
                         │      / User         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Report Upload     │
                         │ PDF/Image/TXT/etc.  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Document Processing │
                         │                     │
                         │ PyMuPDF + EasyOCR  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Text Cleaning    │
                         │   & Normalization  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   DistilBERT NER   │
                         │                     │
                         │ Fine-Tuned Model   │
                         └──────────┬──────────┘
                                    │
                                    ▼
              ┌────────────────────────────────────────┐
              │          Safety Entity Layer            │
              │                                        │
              │ Hazard | Energy | Barrier              │
              │ Activity | Equipment | Location        │
              └────────────────────┬───────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │ Risk Matrix Engine  │
                         │                     │
                         │ Likelihood          │
                         │ Severity            │
                         │ Risk Score          │
                         │ Risk Level          │
                         │ SIF Potential       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Historical Safety  │
                         │ Analytics Engine    │
                         │                     │
                         │ Trends & Patterns   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Safety Dashboard    │
                         │ & Decision Support  │
                         └─────────────────────┘
```

---

# Core Components

## 1. Document Processing and Text Extraction

SIFguard supports multiple report formats.

### Supported formats

* PDF
* Scanned PDF
* JPG
* JPEG
* PNG
* WEBP
* TXT

### Text-based PDF

For digitally generated PDFs, SIFguard uses **PyMuPDF** to extract text directly.

### Scanned PDF / Image

When a PDF does not contain sufficient machine-readable text, the system automatically switches to OCR.

**EasyOCR** is used to extract text from scanned documents and images.

```text
PDF
 │
 ├── Text available
 │       ↓
 │   PyMuPDF
 │
 └── Text unavailable / insufficient
         ↓
       EasyOCR
```

This allows the system to work with both digital and scanned safety reports.

---

# 2. Text Cleaning

Raw extracted text can contain:

* Extra whitespace
* Page breaks
* Newline characters
* OCR artifacts
* Unicode inconsistencies
* Unnecessary formatting characters

The text-cleaning module normalizes the extracted content before sending it to the NLP model.

The cleaning process intentionally preserves safety-critical words and negations.

For example:

```text
"Energy was isolated"
```

must remain distinguishable from:

```text
"Energy was not isolated"
```

This is important because negation can completely change the safety meaning of a report.

---

# 3. NLP and Safety Entity Extraction

SIFguard uses a fine-tuned **DistilBERT** model for Named Entity Recognition.

The model is based on:

```text
distilbert-base-uncased
```

The model is fine-tuned specifically for safety-report language.

## Target Entity Classes

```text
Hazard
Energy
Barrier
Activity
Equipment
Location
```

The NER label scheme uses BIO tagging:

```text
O

B-Hazard
I-Hazard

B-Energy
I-Energy

B-Barrier
I-Barrier

B-Activity
I-Activity

B-Equipment
I-Equipment

B-Location
I-Location
```

---

# Example NLP Extraction

### Input

```text
During maintenance of the centrifugal pump,
electrical energy was not isolated in the compressor
area and hydrocarbon leakage was observed.
```

### Structured Output

```json
{
  "Hazard": [
    "hydrocarbon leakage"
  ],
  "Energy": [
    "electrical energy"
  ],
  "Barrier": [
    "not isolated"
  ],
  "Activity": [
    "maintenance"
  ],
  "Equipment": [
    "centrifugal pump"
  ],
  "Location": [
    "compressor area"
  ]
}
```

The NLP model's responsibility ends at **extracting and structuring safety information**.

It does not directly calculate the risk score.

---

# 4. Risk Matrix Engine

The Risk Matrix Engine is intentionally **deterministic and explainable**.

It does not use machine learning to calculate the risk score.

The architecture separates:

```text
Machine Learning
        ↓
"What safety factors are present?"
```

from:

```text
Risk Engine
        ↓
"How risky is this according to our rules?"
```

This separation improves transparency and makes the risk calculation easier to audit.

---

# Risk Calculation

The current prototype uses a 5 × 5 risk matrix.

```text
Risk Score = Likelihood × Severity
```

### Likelihood

```text
1 → Rare
2 → Unlikely
3 → Possible
4 → Likely
5 → Almost Certain
```

### Severity

```text
1 → Insignificant
2 → Minor
3 → Moderate
4 → Major
5 → Catastrophic
```

### Risk Matrix

```text
                  SEVERITY

             1    2    3    4    5
          -------------------------
L 1        | 1 |  2 |  3 |  4 |  5 |
I 2        | 2 |  4 |  6 |  8 | 10 |
K 3        | 3 |  6 |  9 | 12 | 15 |
E 4        | 4 |  8 | 12 | 16 | 20 |
L 5        | 5 | 10 | 15 | 20 | 25 |
```

NumPy is used to represent and calculate the numerical matrix.

---

# Risk Classification

The current prototype classifies scores as:

```text
1 – 4      → Low
5 – 9      → Medium
10 – 16    → High
17 – 25    → Extreme
```

These values are currently implemented as a **prototype risk matrix**.

For deployment in an operational OIL environment, the rules should be aligned with the organization's officially approved risk matrix and HSSE criteria.

---

# 5. SIF Potential Detection

SIF detection is performed using deterministic safety rules in the Risk Engine.

The system considers factors such as:

* Catastrophic hazards
* Hazardous energy
* Barrier/control failures
* Critical activities
* Extreme risk scores
* High-consequence precursor conditions

Examples of critical precursor indicators include:

```text
Fall from height
Electrocution
Explosion
Arc flash
Confined space
Hydrocarbon release
High pressure
Dropped objects
Crushing
Engulfment
```

A report may therefore be classified as:

```text
SIF-Potential
```

or:

```text
Non-SIF
```

The system also produces rule-based reasons for its classification.

Example:

```json
{
  "likelihood": 5,
  "severity": 5,
  "riskScore": 25,
  "riskLevel": "Extreme",
  "sifPotential": "SIF-Potential",
  "reasons": [
    "Barrier/control failure detected.",
    "Catastrophic hazard identified.",
    "High-energy source identified.",
    "Risk score reached the Extreme range."
  ]
}
```

This makes the result explainable without relying on an opaque prediction.

---

# 6. Trends and Pattern Analysis

SIFguard also provides historical safety analytics.

Instead of analyzing one report in isolation, the analytics engine can analyze hundreds or thousands of historical reports.

The analytics engine uses:

* Pandas
* NumPy
* Statistical aggregation
* Frequency analysis
* Time-based grouping
* Entity co-occurrence analysis

No additional ML model is required for the initial analytics layer.

---

# Trend Analysis

The system can identify trends such as:

```text
Monthly incident count
Monthly SIF-potential reports
Monthly hazard frequency
Monthly energy-source frequency
Monthly barrier failures
```

Example:

```text
Month       Reports      SIF Potential
--------------------------------------
January       82              12
February      91              17
March        105              23
April        118              29
```

This allows safety teams to identify whether particular safety risks are increasing or decreasing.

---

# Pattern Analysis

SIFguard can identify the most frequently occurring:

### Hazards

```text
Hydrocarbon Leak
Electrical Hazard
Fall
Fire
Chemical Exposure
```

### Energy Sources

```text
Electrical
Pressure
Mechanical
Hydraulic
Thermal
Chemical
```

### Activities

```text
Maintenance
Lifting
Welding
Pressure Testing
Excavation
Working at Height
```

### Equipment

```text
Pump
Pipeline
Crane
Forklift
Transformer
Scaffold
```

### Locations

The system can identify locations with repeated incident activity.

---

# Entity Combination Analysis

One of the important capabilities of SIFguard is identifying recurring combinations.

For example:

```text
Hydrocarbon Leak + Pressure
Electrical Hazard + Maintenance
Fall + Working at Height
Chemical Exposure + Pump
```

Repeated combinations can reveal relationships that may not be obvious from individual incident counts.

---

# Historical Safety Intelligence

The overall analytics layer can therefore answer questions such as:

> Which hazards occur most frequently?

> Which energy sources are involved in the highest number of reports?

> Which barriers fail repeatedly?

> Which activities have the highest risk?

> Which locations have recurring incidents?

> Are SIF-potential reports increasing?

> Which hazard-energy combinations occur most frequently?

This transforms historical incident data into actionable safety intelligence.

---

# Dataset Strategy

SIFguard uses multiple sources of safety-report data for development and experimentation.

The datasets are maintained separately in their original/raw form.

```text
datasets/
│
├── raw/
│   ├── dataset1.csv
│   └── dataset2.csv
│
├── sif_ner_dataset.jsonl
│
└── processed/
    ├── train.json
    ├── validation.json
    ├── test.json
    └── labels.json
```

Raw datasets are not modified directly.

Relevant safety-report examples are selected and annotated for NER training.

The final annotated dataset combines suitable examples into a common schema.

---

# NER Annotation Format

SIFguard uses character-span annotations before converting them into BIO labels.

Example:

```json
{
  "text": "During maintenance the pump was isolated from electrical energy.",
  "entities": [
    {
      "start": 8,
      "end": 19,
      "label": "Activity"
    },
    {
      "start": 24,
      "end": 28,
      "label": "Equipment"
    }
  ]
}
```

This allows the same annotation format to be converted into model-compatible token labels.

---

# Training Pipeline

The DistilBERT training pipeline is organized as:

```text
Raw Safety Data
      ↓
Annotation
      ↓
Combined NER Dataset
      ↓
Dataset Validation
      ↓
BIO Label Conversion
      ↓
Train / Validation / Test Split
      ↓
DistilBERT Fine-Tuning
      ↓
Model Evaluation
      ↓
Saved Fine-Tuned Model
```

The target split is:

```text
80% → Training
10% → Validation
10% → Testing
```

A fixed random seed is used to make dataset splitting reproducible.

---

# Model Evaluation

The NER model should be evaluated using entity-level metrics rather than only raw token accuracy.

Important metrics include:

* Precision
* Recall
* F1 Score

Evaluation should be performed for individual entity classes as well as overall performance.

For example:

```text
Entity       Precision    Recall    F1
----------------------------------------
Hazard          --          --      --
Energy          --          --      --
Barrier         --          --      --
Activity        --          --      --
Equipment       --          --      --
Location        --          --      --
----------------------------------------
Overall         --          --      --
```

Actual values should be added after the final annotated dataset has been trained and evaluated.

---

# Backend Architecture

SIFguard uses a hybrid architecture.

```text
                    Node.js Backend
                          │
                          │
                    REST API Layer
                          │
                          ▼
                  Document Management
                          │
                          ▼
                  Python NLP Service
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
       Document Processing        AI/NLP Pipeline
             │                         │
             ▼                         ▼
        OCR / Parsing              DistilBERT
                                       │
                                       ▼
                                  Risk Engine
                                       │
                                       ▼
                                  Analytics
```

Node.js is responsible for application/backend operations, while Python handles NLP and analytics workloads.

This separation allows each component to use the ecosystem best suited to its task.

---

# Python NLP Service

The Python service is built using FastAPI.

Example endpoint:

```text
POST /process-document
```

The endpoint accepts an uploaded document and processes it through the NLP pipeline.

Health endpoint:

```text
GET /health
```

Example:

```json
{
  "status": "healthy"
}
```

---

# Project Structure

The project is organized into separate responsibilities.

```text
SIFguard/
│
├── nlp_service/
│   │
│   ├── main.py
│   │
│   ├── textextraction/
│   │   ├── __init__.py
│   │   └── extractor.py
│   │
│   ├── textcleaning/
│   │   ├── __init__.py
│   │   └── cleaner.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── sif_ner.py
│   │   └── sif_distilbert/
│   │
│   ├── training/
│   │   ├── __init__.py
│   │   ├── prepare_dataset.py
│   │   ├── train.py
│   │   └── evaluate.py
│   │
│   ├── risk/
│   │   ├── __init__.py
│   │   └── risk_engine.py
│   │
│   └── analytics/
│       ├── __init__.py
│       └── trends_engine.py
│
├── datasets/
│   ├── raw/
│   ├── sif_ner_dataset.jsonl
│   └── processed/
│
├── services/
│   └── nlpService.js
│
├── uploads/
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

# Technology Stack

## Backend

* Node.js
* Express.js
* REST APIs
* Axios
* PostgreSQL
* MongoDB

## AI / NLP

* Python
* FastAPI
* PyTorch
* Hugging Face Transformers
* DistilBERT
* Hugging Face Datasets
* EasyOCR
* PyMuPDF

## Risk Analysis

* Python
* NumPy
* Deterministic rule engine
* 5 × 5 Risk Matrix

## Historical Analytics

* Python
* Pandas
* NumPy

## Frontend

The platform can expose the processed results through a web dashboard for:

* Risk visualization
* SIF alerts
* Incident trends
* Hazard frequency
* Pattern analysis
* Historical comparisons

---

# Why This Architecture?

SIFguard intentionally uses a **hybrid AI + deterministic architecture**.

### Machine Learning is used where it is strongest

DistilBERT is responsible for understanding natural-language safety reports and extracting relevant entities.

```text
"What is mentioned in the report?"
```

### Deterministic rules are used where explainability is critical

The Risk Matrix Engine determines:

```text
"How risky is this situation?"
```

using explicit rules and a numerical risk matrix.

### Statistical analytics are used for historical intelligence

The Trends & Pattern Engine determines:

```text
"What is happening repeatedly across many reports?"
```

This gives SIFguard three complementary capabilities:

```text
NLP
 ↓
Understand the report

Risk Engine
 ↓
Assess the report

Analytics
 ↓
Understand the historical pattern
```

---

# Problems Solved

SIFguard addresses several major problems in traditional safety-report analysis.

| Problem                                  | SIFguard Solution                                |
| ---------------------------------------- | ------------------------------------------------ |
| Manual report reading                    | Automated document processing                    |
| Scanned reports                          | OCR-based extraction                             |
| Unstructured safety text                 | DistilBERT NER                                   |
| Hidden safety entities                   | Structured Hazard/Energy/Barrier/etc. extraction |
| Inconsistent risk calculation            | Deterministic Risk Matrix                        |
| Difficult SIF identification             | Explicit SIF precursor rules                     |
| No explanation for risk score            | Rule-based reasons                               |
| Historical reports analyzed individually | Trends & Pattern Engine                          |
| Recurring hazards difficult to identify  | Frequency and co-occurrence analysis             |
| Increasing risks difficult to detect     | Time-based trend analysis                        |

---

# Example End-to-End Scenario

Consider the following report:

```text
During maintenance of a centrifugal pump,
the electrical energy was not isolated.
Hydrocarbon leakage was observed in the
compressor area.
```

### Step 1 — Text Extraction

The document is converted into machine-readable text.

### Step 2 — NLP

DistilBERT identifies:

```text
Activity:
maintenance

Equipment:
centrifugal pump

Energy:
electrical energy

Barrier:
not isolated

Hazard:
hydrocarbon leakage

Location:
compressor area
```

### Step 3 — Risk Assessment

The Risk Engine evaluates the extracted factors.

Example prototype result:

```json
{
  "likelihood": 5,
  "severity": 5,
  "riskScore": 25,
  "riskLevel": "Extreme",
  "sifPotential": "SIF-Potential"
}
```

### Step 4 — Explanation

The system can provide deterministic reasons:

```text
Barrier/control failure detected.
High-energy source detected.
Catastrophic hazard detected.
Risk score reached the Extreme range.
```

### Step 5 — Historical Analysis

If similar reports appear repeatedly, the analytics engine can identify patterns such as:

```text
Electrical energy + Maintenance
Hydrocarbon leak + Pressure
Barrier failure + Pump maintenance
```

This creates a complete safety-intelligence workflow rather than simply classifying an individual report.

---

# Current Achievements

The current SIFguard implementation has established the core technical architecture and development pipeline.

### Completed / Implemented Components

* Project architecture defined
* Node.js backend established
* Python NLP service architecture established
* FastAPI NLP service created
* Health-check endpoint implemented
* PDF text extraction implemented
* Scanned-PDF OCR fallback implemented
* Image text extraction implemented
* TXT processing implemented
* Text cleaning and normalization implemented
* DistilBERT selected as the NER base model
* Safety-specific NER entity schema defined
* BIO label structure defined
* NER dataset preparation pipeline created
* Train/validation/test dataset pipeline established
* DistilBERT fine-tuning pipeline created
* Model inference structure created
* Deterministic Risk Matrix Engine implemented
* Likelihood calculation implemented
* Severity calculation implemented
* 5 × 5 numerical risk matrix defined
* Risk score calculation implemented
* Risk-level classification implemented
* SIF-potential rule engine implemented
* Rule-based risk explanations implemented
* Trends and Pattern Analysis Engine implemented
* Historical frequency analysis implemented
* Time-based trend analysis implemented
* SIF trend analysis implemented
* Entity frequency analysis implemented
* Entity combination analysis implemented
* Analytics alert generation implemented
* Node.js → Python NLP service integration architecture established

---

# Current Development Status

The project is being developed incrementally.

```text
Component                         Status
------------------------------------------------
Backend API                       Implemented
Document Upload                   Implemented
PDF Extraction                    Implemented
OCR Pipeline                      Implemented
Text Cleaning                     Implemented
NER Architecture                  Implemented
NER Dataset Pipeline              Implemented
DistilBERT Training Pipeline      Implemented
Fine-Tuned Model                  Dataset/Training in progress
NER Evaluation                    In progress
Risk Matrix Engine                Implemented
SIF Rule Engine                   Implemented
Trends Engine                     Implemented
Node ↔ Python Integration         In progress
Database Persistence              In progress
Dashboard                         In progress
Production OIL Risk Rules         Pending validation
```

---

# Important Design Considerations

## DistilBERT is not the Risk Engine

DistilBERT is used for:

```text
Named Entity Recognition
```

It extracts safety information.

It does not directly determine:

```text
Risk Score
Severity
Likelihood
```

This is intentional.

---

## Risk Matrix is not Machine Learning

The Risk Matrix Engine is deterministic.

Its calculation is based on:

```text
Extracted Safety Factors
        ↓
Rules
        ↓
Likelihood
        ↓
Severity
        ↓
Risk Matrix
        ↓
Risk Score
```

This provides transparency and auditability.

---

## Prototype Risk Rules

The current hazard lists, likelihood rules, severity rules, SIF rules, and score thresholds are development/prototype rules.

They must be validated and calibrated against the **official OIL HSSE methodology, approved risk matrix, SIF definitions, and relevant safety standards** before operational deployment.

---

# Future Enhancements

The architecture allows SIFguard to be expanded with:

### 1. Improved NER

* Larger domain-specific dataset
* More safety entity categories
* Better contextual understanding
* Long-document chunking
* Improved annotation quality

### 2. SIF Classification

A dedicated SIF classifier can be introduced after the NER pipeline is stable.

```text
NER
 ↓
Safety Features
 ↓
SIF Classification Model
```

### 3. Advanced Explainability

Model explainability techniques such as SHAP can be added later to explain ML predictions.

### 4. Improved Risk Intelligence

* Official OIL risk matrix integration
* Life-Saving Rule mapping
* Barrier model integration
* Risk-control recommendations
* Confidence scoring

### 5. Advanced Analytics

* Anomaly detection
* Predictive safety analytics
* Seasonal trend detection
* Department-level comparisons
* Location risk heatmaps
* Hazard-energy relationship graphs

### 6. Real-Time Safety Dashboard

A centralized dashboard can provide:

* Current high-risk reports
* SIF-potential alerts
* Risk distribution
* Historical trends
* Top hazards
* Barrier failures
* Location analysis
* Activity analysis

---

# Installation

## Clone the Repository

```bash
git clone <repository-url>
cd SIFguard
```

---

# Python Environment

Create a virtual environment:

```powershell
python -m venv SIFvenv
```

Activate it:

```powershell
SIFvenv\Scripts\activate
```

Install NLP dependencies:

```powershell
pip install fastapi uvicorn python-multipart pymupdf easyocr
```

Install ML dependencies:

```powershell
pip install torch transformers datasets accelerate evaluate seqeval scikit-learn
```

Install analytics dependencies:

```powershell
pip install pandas numpy
```

---

# Running the Python NLP Service

From the project root:

```powershell
uvicorn nlp_service.main:app --host 127.0.0.1 --port 8000
```

The service should be available at:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /health
```

---

# Preparing the NER Dataset

After the annotated dataset has been placed at:

```text
datasets/sif_ner_dataset.jsonl
```

run:

```powershell
python -m nlp_service.training.prepare_dataset
```

This generates:

```text
datasets/processed/
├── train.json
├── validation.json
├── test.json
└── labels.json
```

---

# Training DistilBERT

Run:

```powershell
python -m nlp_service.training.train
```

The fine-tuned model is saved under:

```text
nlp_service/models/sif_distilbert/
```

---

# Evaluating the Model

Run:

```powershell
python -m nlp_service.training.evaluate
```

The evaluation pipeline should report entity-level performance such as:

```text
Precision
Recall
F1 Score
```

---

# Risk Engine

The Risk Matrix Engine can be tested independently using structured safety entities.

Example:

```python
from nlp_service.risk.risk_engine import RiskMatrixEngine


engine = RiskMatrixEngine()

entities = {
    "Hazard": ["hydrocarbon leak"],
    "Energy": ["electrical energy"],
    "Barrier": ["not isolated"],
    "Activity": ["maintenance"],
    "Equipment": ["centrifugal pump"],
    "Location": ["compressor area"]
}

result = engine.assess(
    entities=entities,
    text="Electrical energy was not isolated during maintenance."
)

print(result)
```

---

# Analytics Engine

Historical reports can be passed to the Trends & Pattern Analysis Engine.

Conceptually:

```python
from nlp_service.analytics.trends_engine import (
    TrendsAnalysisEngine
)

engine = TrendsAnalysisEngine()

result = engine.analyze(
    historical_reports
)

print(result)
```

The output contains:

```text
Summary
Trends
Patterns
Entity Frequencies
Entity Combinations
SIF Trends
Alerts
```

---

# Development Philosophy

SIFguard follows three principles:

## 1. Explainability

Safety decisions should be understandable.

## 2. Separation of Responsibilities

Each component performs a specific task:

```text
OCR
 ↓
Text Extraction

DistilBERT
 ↓
Entity Extraction

Risk Engine
 ↓
Risk Calculation

Analytics Engine
 ↓
Historical Intelligence
```

## 3. Scalability

The architecture separates the Node.js application layer from the Python AI/analytics layer so individual components can evolve independently.

---

# Expected Impact

SIFguard aims to help safety teams move from:

```text
Manual Report Review
        ↓
Reactive Analysis
        ↓
Individual Incident Investigation
```

towards:

```text
Automated Report Processing
        ↓
Early SIF Precursor Detection
        ↓
Consistent Risk Assessment
        ↓
Historical Pattern Recognition
        ↓
Proactive Safety Intervention
```

The ultimate goal is not simply to classify reports.

The goal is to **identify high-consequence precursor conditions early and convert large volumes of safety-report data into actionable safety intelligence.**

---

# Project Vision

SIFguard is designed as a foundation for an intelligent occupational safety platform capable of processing large volumes of safety reports and identifying signals that may otherwise remain hidden inside unstructured incident data.

By combining:

```text
NLP
+
OCR
+
Risk Engineering
+
Historical Analytics
```

SIFguard provides a complete pipeline from:

```text
Unstructured Safety Report
          ↓
Structured Safety Information
          ↓
Risk Assessment
          ↓
SIF Potential Detection
          ↓
Historical Trends
          ↓
Actionable Safety Intelligence
```

---

## Disclaimer

SIFguard is a research/prototype system developed for the intended SIH 2026 problem context.

The current risk rules and thresholds are not intended to replace an organization's approved safety procedures, professional safety assessment, or officially approved risk matrix.

Before operational deployment, the system should be validated using authoritative organizational data, approved HSSE criteria, domain-expert annotations, and appropriate safety governance processes.
