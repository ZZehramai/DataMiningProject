"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface FeatureImportance {
  [model: string]: Record<string, number>;
}

interface AssociationRule {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  support_count?: number;
}

interface MiningData {
  featureImportance: FeatureImportance | null;
  associationRules: Record<string, AssociationRule> | null;
  associationRuleSummary: any | null;
  clusteringResults: any | null;
  correlationMatrix: { columns: string[]; matrix: number[][] } | null;
}

const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getCorrelationColor(value: number): string {
  if (value > 0.5) return "#ef4444";
  if (value > 0.3) return "#f97316";
  if (value > 0.1) return "#eab308";
  if (value > -0.1) return "#6b7280";
  if (value > -0.3) return "#3b82f6";
  return "#06b6d4";
}

export default function MiningPage() {
  const [data, setData] = useState<MiningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<string>("");

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const models = d.featureImportance
          ? Object.keys(d.featureImportance)
          : [];
        if (models.length > 0) setActiveModel(models[0]);
      })
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

  const featureImp = data?.featureImportance;
  const assocRules = data?.associationRules;
  const corrMatrix = data?.correlationMatrix;

  const featureImpData =
    featureImp && activeModel
      ? Object.entries(featureImp[activeModel])
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value: Math.round(value * 1000) / 1000,
          }))
      : [];

  // Correlation heatmap data for scatter plot visualization
  const heatmapData: {
    x: number;
    y: number;
    z: number;
    xlabel: string;
    ylabel: string;
    value: number;
  }[] = [];
  if (corrMatrix) {
    for (let i = 0; i < corrMatrix.columns.length; i++) {
      for (let j = 0; j < corrMatrix.columns.length; j++) {
        heatmapData.push({
          x: j,
          y: i,
          z: Math.abs(corrMatrix.matrix[i][j]) * 50 + 10,
          xlabel: corrMatrix.columns[j],
          ylabel: corrMatrix.columns[i],
          value: Math.round(corrMatrix.matrix[i][j] * 100) / 100,
        });
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Description Mining
        </h1>
        <p className="text-slate-400">
          Feature selection, correlation analysis, and association rules
        </p>
      </div>

      {/* Feature Selection */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> Feature Selection (Importance)
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Feature importance scores from tree-based models. Higher values
          indicate stronger predictive power for the target variable.
        </p>

        {/* Model tabs */}
        {featureImp && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.keys(featureImp).map((model) => (
              <button
                key={model}
                onClick={() => setActiveModel(model)}
                className={`tab-btn ${activeModel === model ? "active" : ""}`}
              >
                {model}
              </button>
            ))}
          </div>
        )}

        {featureImpData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={featureImpData}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value) => [Number(value).toFixed(4), "Importance"]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {featureImpData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Correlation Heatmap */}
      {corrMatrix && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔥</span> Correlation Heatmap
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Pearson correlation coefficients for the 37 encoded modeling
            features used by the notebook. Red indicates positive correlation,
            blue indicates negative.
          </p>

          {/* Grid-based heatmap */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-[500px]">
              {/* Header row */}
              <div className="flex">
                <div className="w-28 h-10 flex items-center justify-center text-xs text-slate-500" />
                {corrMatrix.columns.map((col) => (
                  <div
                    key={col}
                    className="w-20 h-10 flex items-center justify-center text-xs text-slate-400 font-mono"
                  >
                    {col.length > 8 ? col.slice(0, 8) + "…" : col}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {corrMatrix.columns.map((rowLabel, i) => (
                <div key={rowLabel} className="flex">
                  <div className="w-28 h-10 flex items-center text-xs text-slate-400 font-mono pr-2 justify-end">
                    {rowLabel.length > 10
                      ? rowLabel.slice(0, 10) + "…"
                      : rowLabel}
                  </div>
                  {corrMatrix.columns.map((_, j) => {
                    const val = corrMatrix.matrix[i][j];
                    const opacity = Math.abs(val);
                    const bgColor =
                      val >= 0
                        ? `rgba(239, 68, 68, ${opacity * 0.8})`
                        : `rgba(59, 130, 246, ${opacity * 0.8})`;
                    return (
                      <div
                        key={`${i}-${j}`}
                        className="w-20 h-10 flex items-center justify-center text-xs font-semibold rounded-sm m-0.5 transition-all hover:scale-110 cursor-default"
                        style={{
                          background: bgColor,
                          color: opacity > 0.4 ? "white" : "#94a3b8",
                        }}
                        title={`${rowLabel} × ${corrMatrix.columns[j]}: ${val.toFixed(2)}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/60" />
                  <span>Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-600" />
                  <span>~0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/60" />
                  <span>Negative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Association Rules */}
      {assocRules && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📜</span> Association Rules
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Best FP-Growth association rule reported by the updated notebook for
            each disease class where a qualifying rule was found. The notebook
            reports rules for 3 of the 8 classes at the current thresholds.
          </p>

          <div className="grid gap-4">
            {Object.entries(assocRules).map(([cls, rule]) => (
              <div
                key={cls}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-sm">
                    {cls}
                  </span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-400">
                      Support:{" "}
                      <span className="text-cyan-400 font-semibold">
                        {rule.support.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Confidence:{" "}
                      <span className="text-emerald-400 font-semibold">
                        {rule.confidence.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Lift:{" "}
                      <span className="text-amber-400 font-semibold">
                        {rule.lift.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 font-mono text-xs">
                    {rule.antecedent}
                  </span>
                  <span className="text-blue-400 font-bold">→</span>
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 font-mono text-xs">
                    {rule.consequent}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rules Summary Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Antecedent</th>
                  <th>Support Count</th>
                  <th>Support</th>
                  <th>Confidence</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(assocRules).map(([cls, rule]) => (
                  <tr key={cls}>
                    <td className="font-bold text-blue-400">{cls}</td>
                    <td className="font-mono text-xs text-slate-300 max-w-xs truncate">
                      {rule.antecedent}
                    </td>
                    <td>{rule.support_count ?? "—"}</td>
                    <td>{rule.support.toFixed(2)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-700">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${rule.confidence * 100}%`,
                            }}
                          />
                        </div>
                        <span>{rule.confidence.toFixed(2)}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          rule.lift > 3
                            ? "bg-amber-500/20 text-amber-400"
                            : rule.lift > 2
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {rule.lift.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clustering Analysis */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔮</span> Clustering Analysis
        </h2>
        <p className="text-slate-400 mb-5">
          K-Means was applied to the 15 numerical modeling features, excluding{" "}
          <code>sublabel</code>, <code>label</code>, and{" "}
          <code>disease_flags</code>. The updated notebook selects{" "}
          <strong>K = 2</strong> using the Calinski-Harabasz index.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Selected K</p>
            <p className="text-2xl font-bold text-blue-400">2</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Cluster 0</p>
            <p className="text-2xl font-bold text-cyan-400">23,377</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Cluster 1</p>
            <p className="text-2xl font-bold text-emerald-400">26,617</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Silhouette</p>
            <p className="text-2xl font-bold text-amber-400">0.063</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <img
            src="/notebook_figures/cell_69_fig_1.png"
            alt="Elbow Method"
            className="w-full rounded-xl border border-slate-700"
          />
          <img
            src="/notebook_figures/cell_70_fig_1.png"
            alt="Calinski-Harabasz Index"
            className="w-full rounded-xl border border-slate-700"
          />
          <img
            src="/notebook_figures/cell_73_fig_1.png"
            alt="Silhouette Distribution"
            className="w-full rounded-xl border border-slate-700"
          />
          <img
            src="/notebook_figures/cell_76_fig_1.png"
            alt="Hierarchical Clustering Dendrogram"
            className="w-full rounded-xl border border-slate-700"
          />
        </div>
      </div>
    </div>
  );
}
