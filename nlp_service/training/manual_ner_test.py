"""Manual NER verification (§24): 10 realistic industrial safety scenarios.

Loads the saved production model from disk (proof that the persisted
artifacts work, not just the in-memory training state) and prints the
extracted HAZARD / ENERGY / BARRIER / ACTIVITY / EQUIPMENT / LOCATION
entities for each scenario.

Usage (after training):
    SIFvenv\\Scripts\\python.exe nlp_service/training/manual_ner_test.py
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))

from nlp_service._compat import ensure_regex_shim  # noqa: E402

ensure_regex_shim()

from nlp_service.models.sif_ner import is_model_available, predict  # noqa: E402

SCENARIOS = [
    ("simple incident",
     "A worker slipped on an oil spill near the storage tank and injured "
     "his leg while walking through the warehouse."),
    ("near miss",
     "A wrench fell from the scaffolding platform and narrowly missed a "
     "technician working below in the maintenance bay."),
    ("unsafe condition",
     "Hydrocarbon leakage was observed around the corroded section of the "
     "process pipeline in the compressor area."),
    ("unsafe act",
     "An operator bypassed the machine guard to clear a jam while the "
     "conveyor was still running."),
    ("equipment incident",
     "The centrifugal pump overheated and ruptured its seal, spraying hot "
     "fluid across the pump house floor."),
    ("electrical incident",
     "Worker was exposed to 480V electrical supply while servicing the "
     "control panel because the lockout barrier was not applied."),
    ("pressure incident",
     "Worker was exposed to high pressure steam while opening the process "
     "line because the isolation valve was not locked."),
    ("maintenance incident",
     "Worker was performing maintenance on a compressor when electrical "
     "energy was released because the isolation barrier was not applied."),
    ("construction incident",
     "During lifting operations the crane hook block struck a scaffold "
     "tube and dropped it onto the laydown area."),
    ("oil & gas process safety",
     "During pressure testing of the gas pipeline, a flange gasket failed "
     "and released toxic gas near the wellhead manifold."),
]

EXPECTED_TYPES = ["HAZARD", "ENERGY", "BARRIER", "ACTIVITY", "EQUIPMENT",
                  "LOCATION"]


def main():
    if not is_model_available():
        print("FAIL: trained model not found. Run train.py first.")
        sys.exit(1)

    results = []
    for name, text in SCENARIOS:
        entities = predict(text)
        grouped = {label: [] for label in EXPECTED_TYPES}
        for entity in entities:
            grouped.setdefault(entity["label"], []).append(entity)
        print()
        print(f"--- {name} ---")
        print(f"Input: {text}")
        for label in EXPECTED_TYPES:
            found = [e["text"] for e in grouped.get(label, [])]
            print(f"  {label:<10}: {found or '-'}")
        results.append({"scenario": name, "text": text, "entities": entities})

    covered = {e["label"] for r in results for e in r["entities"]}
    missing = [label for label in EXPECTED_TYPES if label not in covered]
    print()
    print(f"Entity types observed across scenarios: {sorted(covered)}")
    if missing:
        print(f"WARNING: never predicted in these scenarios: {missing}")
        print("(May reflect genuine dataset sparsity — see eval_metrics.json "
              "per-class recall, especially ENERGY/HAZARD.)")
    else:
        print("All six entity types predicted at least once.")

    out_path = PROJECT_ROOT / "dataset" / "processed" / "manual_ner_test.json"
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2, ensure_ascii=False)
    print(f"Results saved to: {out_path}")


if __name__ == "__main__":
    main()
