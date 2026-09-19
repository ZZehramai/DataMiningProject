"use client";

import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface ModelMetrics {
  [sampler: string]: {
    [model: string]: {
      accuracy: number;
      precision_macro: number;
      recall_macro: number;
      f1_macro: number;
      auc_roc: number | null;
    };
  };
}

interface ConfusionMatrices {
  [sampler: string]: {
    [model: string]: {
      labels: string[];
      matrix: number[][];
    };
  };
}

interface ROCData {
  [sampler: string]: {
    [model: string]: {
      [label: string]: {
        fpr: number[];
        tpr: number[];
        auc: number;
      };
    };
  };
}

interface SamplingComparison {
  [sampler: string]: Record<string, number>;
}

interface MetricsData {
  modelMetrics: ModelMetrics | null;
  confusionMatrices: ConfusionMatrices | null;
  rocCurves: ROCData | null;
  samplingComparison: SamplingComparison | null;
  binaryModelMetrics: ModelMetrics | null;
  binaryConfusionMatrices: ConfusionMatrices | null;
  binaryRocCurves: ROCData | null;
  binarySamplingComparison: SamplingComparison | null;
}

const MODEL_COLORS: Record<string, string> = {
  "Logistic Regression": "#3b82f6",
  "Decision Tree": "#10b981",
  "Random Forest": "#f59e0b",
  HistGradientBoosting: "#f43f5e",
};

const SAMPLER_COLORS: Record<string, string> = {
  ROS: "#8b5cf6",
  SMOTE: "#06b6d4",
};

function getHeatColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio > 0.7) return "bg-blue-600 text-white";
  if (ratio > 0.4) return "bg-blue-500/70 text-white";
  if (ratio > 0.2) return "bg-blue-400/40 text-slate-200";
  if (value > 0) return "bg-blue-300/20 text-slate-400";
  return "bg-slate-800/50 text-slate-600";
}

export default function ModelsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSampler, setSelectedSampler] = useState("Random Over-Sampling");
  const [selectedModel, setSelectedModel] = useState("Random Forest");
  const [rocLabel, setRocLabel] = useState("all");

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.modelMetrics;
  const cm = data?.confusionMatrices;
  const roc = data?.rocCurves;
  const sampling = data?.samplingComparison;
  const binaryMetrics = data?.binaryModelMetrics;
  const binaryCM = data?.binaryConfusionMatrices;
  const binaryROC = data?.binaryRocCurves;

  const samplers = metrics ? Object.keys(metrics) : [];
  const models = metrics ? Object.keys(metrics[samplers[0]] || {}) : [];

  // Prepare metrics comparison table
  const metricsTable =
    metrics?.[selectedSampler]
      ? Object.entries(metrics[selectedSampler]).map(([model, m]) => ({
          model,
          accuracy: (m.accuracy * 100).toFixed(1),
          precision: (m.precision_macro * 100).toFixed(1),
          recall: (m.recall_macro * 100).toFixed(1),
          f1: (m.f1_macro * 100).toFixed(1),
          auc: m.auc_roc == null ? "N/A" : (m.auc_roc * 100).toFixed(1),
        }))
      : [];

  // Prepare grouped accuracy data for all 4 models across both sampling methods
  const groupedComparisonData = metrics
    ? models.map((model) => ({
        model,
        ROS: Number((((metrics["Random Over-Sampling"]?.[model]?.accuracy ?? 0) * 100)).toFixed(1)),
        SMOTE: Number((((metrics["SMOTE"]?.[model]?.accuracy ?? 0) * 100)).toFixed(1)),
      }))
    : [];

  // ROC curve data
  // The metrics JSON uses the full sampler name, while the confusion-matrix/ROC JSON uses ROS.
  const resultSamplerKey = selectedSampler === "Random Over-Sampling" ? "ROS" : selectedSampler;
  const currentCM = cm?.[resultSamplerKey]?.[selectedModel];

  // Sampling comparison
  const samplingTable: Record<string, string | number>[] = sampling
    ? Object.entries(sampling).map(([sampler, dist]) => ({
        sampler,
        ...Object.fromEntries(
          Object.entries(dist).map(([k, v]) => [k, v])
        ),
      }))
    : [];

  const samplingLabels = sampling
    ? Object.keys(Object.values(sampling)[0] || {})
    : [];



  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Model Comparison
        </h1>
        <p className="text-slate-400">
          Performance evaluation across 4 models × 2 sampling strategies
        </p>
      </div>

      {/* Sampler selector */}
      <div className="flex flex-wrap gap-3">
        {samplers.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSampler(s)}
            className={`tab-btn ${selectedSampler === s ? "active" : ""}`}
          >
            {s === "Random Over-Sampling" || s === "ROS" ? "🎲 Random Over-Sampling" : "🔄 SMOTE"} ({s === "Random Over-Sampling" ? "ROS" : s})
          </button>
        ))}
      </div>

      {/* Metrics Summary */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📊</span> Model Performance ({selectedSampler === "Random Over-Sampling" ? "ROS" : selectedSampler})
        </h2>
        <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-slate-300">
            🏆 <span className="font-semibold text-emerald-400">Random Forest</span> is the best model, achieving the highest Accuracy for the selected sampling method.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {metricsTable.map((row) => (
            <div key={row.model} className="stat-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background:
                      MODEL_COLORS[row.model] ?? "#64748b",
                  }}
                />
                <p className="text-xs text-slate-400 truncate">{row.model}</p>
              </div>
              <p className="text-2xl font-bold text-white">{row.accuracy}%</p>
              <p className="text-xs text-slate-500">Accuracy</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>AUC-ROC</th>
              </tr>
            </thead>
            <tbody>
              {metricsTable.map((row) => {
                const best = Math.max(
                  ...metricsTable.map((r) => parseFloat(r.accuracy))
                );
                const isBest = row.model === "Random Forest" && parseFloat(row.accuracy) === best;
                return (
                  <tr
                    key={row.model}
                    className={isBest ? "bg-blue-500/10" : ""}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background:
                              MODEL_COLORS[row.model] ?? "#64748b",
                          }}
                        />
                        <span className="font-medium">{row.model}</span>
                        {isBest && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{row.accuracy}%</td>
                    <td>{row.precision}%</td>
                    <td>{row.recall}%</td>
                    <td className="font-semibold text-blue-400">{row.f1}%</td>
                    <td>{row.auc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-model × 2-sampling comparison */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <span>📈</span> 4-Model Comparison with 2 Sampling Methods
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Accuracy comparison of Logistic Regression, Decision Tree, Random Forest, and HistGradientBoosting using Random Over-Sampling (ROS) and SMOTE.
        </p>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={groupedComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="model" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              formatter={(value, name) => [`${value}%`, name === "ROS" ? "Random Over-Sampling" : "SMOTE"]}
            />
            <Legend />
            <Bar dataKey="ROS" name="ROS" fill={SAMPLER_COLORS.ROS} radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="SMOTE" name="SMOTE" fill={SAMPLER_COLORS.SMOTE} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROC Curve - exact notebook figure */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📉</span> ROC Curve Comparison
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Multiclass ROC curve comparison from the updated notebook using Random Over-Sampling.
        </p>
        <div className="flex justify-center">
          <img src="/notebook_figures/roc_comparison.png" alt="Multiclass ROC Curve Comparison" className="max-w-full rounded-xl border border-slate-700" />
        </div>
      </div>

      {/* Confusion Matrix */}
      {cm && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔢</span> Confusion Matrix
          </h2>

          <div className="flex flex-wrap gap-3 mb-6">
            {models.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`tab-btn ${selectedModel === m ? "active" : ""}`}
              >
                {m}
              </button>
            ))}
          </div>

          {currentCM && (
            <div className="overflow-x-auto">
              <div className="inline-block">
                <div className="text-sm text-slate-400 mb-2 text-center">
                  {selectedModel} — {selectedSampler}
                </div>
                {/* Header */}
                <div className="flex">
                  <div className="w-20 h-8" />
                  {currentCM.labels.map((label) => (
                    <div
                      key={label}
                      className="w-16 h-8 flex items-center justify-center text-xs text-slate-400 font-semibold"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {currentCM.matrix.map((row, i) => {
                  const rowMax = Math.max(...row);
                  return (
                    <div key={i} className="flex">
                      <div className="w-20 h-10 flex items-center justify-end pr-3 text-xs text-slate-400 font-semibold">
                        {currentCM.labels[i]}
                      </div>
                      {row.map((val, j) => (
                        <div
                          key={`${i}-${j}`}
                          className={`w-16 h-10 flex items-center justify-center text-xs font-bold rounded-sm m-0.5 ${getHeatColor(
                            val,
                            rowMax
                          )} ${i === j ? "ring-1 ring-blue-400/30" : ""}`}
                          title={`Actual: ${currentCM.labels[i]}, Predicted: ${currentCM.labels[j]}`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div className="text-xs text-slate-500 text-center mt-3">
                  Predicted → &nbsp;|&nbsp; Actual ↓
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Binary Label Classification */}
      {binaryMetrics && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <span>🩺</span> Binary Label Classification — 4 Models × 2 Sampling Methods
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Binary <code>label</code> prediction uses the 23 original input features while excluding target-derived variables such as <code>sublabel</code> and <code>disease_flags</code> to prevent data leakage.
          </p>

          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-slate-300">
              🏆 <span className="font-semibold text-emerald-400">Random Forest + ROS</span> is the selected binary model based on the highest Accuracy.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sampling</th>
                  <th>Model</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>AUC-ROC</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(binaryMetrics).flatMap(([sampler, modelMap]) =>
                  Object.entries(modelMap).map(([model, m]) => {
                    const isBest = sampler === "Random Over-Sampling" && model === "Random Forest";
                    return (
                      <tr key={`${sampler}-${model}`} className={isBest ? "bg-blue-500/10" : ""}>
                        <td>{sampler === "Random Over-Sampling" ? "ROS" : sampler}</td>
                        <td className="font-medium">
                          {model} {isBest && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Best</span>}
                        </td>
                        <td>{(m.accuracy * 100).toFixed(1)}%</td>
                        <td>{(m.precision_macro * 100).toFixed(1)}%</td>
                        <td>{(m.recall_macro * 100).toFixed(1)}%</td>
                        <td>{(m.f1_macro * 100).toFixed(1)}%</td>
                        <td>{m.auc_roc == null ? "N/A" : m.auc_roc.toFixed(3)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {binaryCM?.["Random Over-Sampling"]?.["Random Forest"] && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-3">Confusion Matrix — Random Forest + ROS</h3>
              <div className="flex justify-center">
                <img
                  src="/notebook_figures/binary_label_confusion_matrix.png"
                  alt="Binary label confusion matrix for Random Forest with Random Over-Sampling"
                  className="max-w-full rounded-xl border border-slate-700"
                />
              </div>
            </div>
          )}

          {binaryROC?.["Random Over-Sampling"] && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-3">ROC Curve — Binary Label Prediction (ROS)</h3>
              <div className="flex justify-center">
                <img
                  src="/notebook_figures/binary_label_roc_comparison.png"
                  alt="Binary label ROC curve comparison for four models with Random Over-Sampling"
                  className="max-w-full rounded-xl border border-slate-700"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class Balance After Sampling */}
      {sampling && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚖️</span> Class Balance After Sampling
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Both ROS and SMOTE resample the training set to achieve balanced
            class distribution.
          </p>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Method</th>
                  {samplingLabels.map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {samplingTable.map((row) => (
                  <tr key={row.sampler}>
                    <td className="font-semibold">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          row.sampler === "ROS"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {row.sampler}
                      </span>
                    </td>
                    {samplingLabels.map((label) => (
                      <td key={label} className="text-center">
                        {row[label] as number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Interpolation helper for ROC curves
function interpolate(fpr: number[], tpr: number[], x: number): number {
  if (x <= fpr[0]) return tpr[0];
  if (x >= fpr[fpr.length - 1]) return tpr[tpr.length - 1];
  for (let i = 0; i < fpr.length - 1; i++) {
    if (x >= fpr[i] && x <= fpr[i + 1]) {
      const t = (x - fpr[i]) / (fpr[i + 1] - fpr[i]);
      return tpr[i] + t * (tpr[i + 1] - tpr[i]);
    }
  }
  return 0;
}
