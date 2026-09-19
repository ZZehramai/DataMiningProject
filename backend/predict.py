#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parent

payload = json.load(sys.stdin)
target = str(payload.get("target", "sublabel")).lower()
features_payload = payload.get("features", payload)

if target == "label":
    meta_path = ROOT / "label_model_metadata.json"
    pre_path = ROOT / "label_model_preprocessor.joblib"
    model_path = ROOT / "best_label_model.joblib"
else:
    meta_path = ROOT / "model_metadata.json"
    pre_path = ROOT / "model_preprocessor.joblib"
    model_path = ROOT / "best_model.joblib"

with open(meta_path, encoding="utf-8") as f:
    meta = json.load(f)

pre = joblib.load(pre_path)
model = joblib.load(model_path)

features = meta["input_features"]
row = {k: features_payload.get(k) for k in features}
df = pd.DataFrame([row])

numeric_columns = [
    "age", "bmi", "HbA1c_level", "glucose", "cholesterol",
    "sleep_hours", "triglycerides", "blood_pressure", "crp_level",
    "homocysteine_level", "alcohol_intake", "salt_intake",
    "heart_rate", "hdl", "ldl"
]
for c in numeric_columns:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")

X = pre.transform(df[features])
proba = model.predict_proba(X)[0]

classes = [str(c) for c in model.classes_]
meta_classes = [str(c) for c in meta["classes"]]
probs = {c: 0.0 for c in meta_classes}
for c, p in zip(classes, proba):
    probs[c] = float(p)

pred = classes[int(proba.argmax())]

print(json.dumps({
    "target": meta.get("target", target),
    "prediction": pred,
    "probabilities": probs,
    "classes": meta_classes,
    "modelUsed": meta.get("best_model", meta.get("model", "Random Forest")),
    "samplingMethod": meta.get("sampling_method", "Random Over-Sampling")
}))
