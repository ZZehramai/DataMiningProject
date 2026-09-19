# Disease Prediction Web Application — Real Dataset / Updated Notebook

This version uses the user's actual disease dataset and the updated mining notebook.

## Data
- Raw dataset: 50,000 rows × 37 columns
- Target: `sublabel`
- Target classes: N, DI, HY, HT, DI_HY, DI_HT, HT_HY, DI_HT_HY
- Duplicate rows removed by the notebook: 6
- Cleaned dataset used for mining/modeling: 49,994 rows
- Selected descriptive/predictive input features: 23
- Encoded modeling features: 37

## Final model selection from the updated notebook
The notebook selects **Random Forest + Random Over-Sampling** using Accuracy as the primary criterion.
- Test Accuracy: 75.45%
- Macro Precision: 41.70%
- Macro Recall: 36.47%
- Macro F1: 36.25%
- 5-fold CV mean accuracy: 75.15% (notebook output)

The website figures/tables were corrected to use the updated notebook results. In particular, the stale confusion matrix that was labeled HistGradientBoosting was replaced with the Random Forest final-model confusion matrix.

## Association mining
The notebook uses **FP-Growth** with its current thresholds. Its executed result reports qualifying best rules for N, HY, and DI_HY; the other five classes have no qualifying rule at those thresholds. The website reports this honestly rather than fabricating rules.

## Run
```bash
npm install
pip install -r backend/requirements.txt
npm run dev
```

If Python is installed under a non-default command, set `PYTHON_BIN` before running the Next.js app.


## Binary `label` prediction

The application now supports two prediction targets from the Disease Prediction page:

- **8-class `sublabel`**: Random Forest + Random Over-Sampling.
- **Binary `label`**: Random Forest + Random Over-Sampling.

For binary `label` prediction, the 23 original input features are used. `label`, `sublabel`, `disease_flags`, and disease-derived/alternative target columns are excluded to prevent data leakage. The binary model was trained using the same 80/20 stratified split, training-only preprocessing, ROS/SMOTE comparison, and four-model comparison in the updated notebook. The selected binary model is Random Forest + ROS.

The binary model artifacts are:
- `backend/best_label_model.joblib`
- `backend/label_model_preprocessor.joblib`
- `backend/label_model_metadata.json`

Binary evaluation results are served from:
- `backend/results/metrics/binary_model_metrics.json`
- `backend/results/metrics/binary_confusion_matrices.json`
- `backend/results/metrics/binary_roc_curves.json`
