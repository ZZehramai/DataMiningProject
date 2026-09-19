"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsResponse {
  datasetStats: {
    shape: number[];
    columns: string[];
    missing_values: Record<string, number>;
  } | null;
  classDistribution: Record<string, number> | null;
}

interface MetricsResponse {
  modelMetrics: Record<string, Record<string, {
    accuracy: number;
    precision_macro: number;
    recall_macro: number;
    f1_macro: number;
    auc_roc: number;
  }>> | null;
}

const COLORS = [
  "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
  "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6",
];

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/metrics").then((r) => r.json()),
    ])
      .then(([s, m]) => {
        setStats(s);
        setMetrics(m);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const classDistData = stats?.classDistribution
    ? Object.entries(stats.classDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const bestModel = metrics?.modelMetrics
    ? (() => {
        let best = { model: "", sampler: "", accuracy: 0 };
        for (const [sampler, models] of Object.entries(metrics.modelMetrics)) {
          for (const [model, m] of Object.entries(models)) {
            if (m.accuracy > best.accuracy) {
              best = { model, sampler, accuracy: m.accuracy };
            }
          }
        }
        return best;
      })()
    : null;

  const overviewCards = [
    {
      label: "Dataset Samples",
      value: stats?.datasetStats?.shape?.[0] ?? "-",
      icon: "📋",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Selected Features",
      value: 23,
      icon: "🔢",
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Target Classes",
      value: "8",
      icon: "🎯",
      color: "from-violet-500 to-purple-500",
    },
    {
      label: "Missing Values",
      value: stats?.datasetStats
        ? Object.values(stats.datasetStats.missing_values).reduce(
            (a, b) => a + b,
            0
          )
        : 0,
      icon: "❓",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Disease Prediction</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-3xl mx-auto">
          Multi-class disease classification using data mining techniques.
          Comparing 4 ML models with 2 sampling strategies across 8 disease sub-labels.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="stat-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`}
              />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Target Labels */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          🎯 8-Class Target Labels
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: "N", desc: "Normal", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
            { code: "DI", desc: "Diabetes", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
            { code: "HY", desc: "Hypertension", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
            { code: "HT", desc: "Heart Disease", color: "bg-red-500/20 text-red-400 border-red-500/30" },
            { code: "DI_HY", desc: "Diabetes + Hypertension", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
            { code: "DI_HT", desc: "Diabetes + Heart", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
            { code: "HT_HY", desc: "Hypertension + Heart", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
            { code: "DI_HT_HY", desc: "All Three", color: "bg-red-600/20 text-red-300 border-red-600/30" },
          ].map((label) => (
            <div
              key={label.code}
              className={`rounded-xl p-4 border ${label.color} text-center`}
            >
              <p className="text-lg font-bold">{label.code}</p>
              <p className="text-xs opacity-75 mt-1">{label.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Class Distribution Chart */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          📊 Class Distribution
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classDistData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {classDistData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best Model Card */}
      {bestModel && (
        <div className="glass-card p-6 border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-xl font-semibold text-white">
              Best Performing Model
            </h2>
          </div>
          <p className="text-slate-300">
            <span className="text-blue-400 font-semibold">
              {bestModel.model}
            </span>{" "}
            with{" "}
            <span className="text-cyan-400 font-semibold">
              {bestModel.sampler}
            </span>{" "}
            achieved the highest Accuracy of{" "}
            <span className="text-emerald-400 font-bold">
              {(bestModel.accuracy * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: "/statistics",
            title: "Data Statistics",
            desc: "Shape, missing values, distribution",
            icon: "📈",
            gradient: "from-blue-600 to-cyan-600",
          },
          {
            href: "/mining",
            title: "Description Mining",
            desc: "Feature selection, association rules, clustering",
            icon: "⛏️",
            gradient: "from-emerald-600 to-teal-600",
          },
          {
            href: "/models",
            title: "Model Comparison",
            desc: "ROC curves, confusion matrices, metrics",
            icon: "🤖",
            gradient: "from-violet-600 to-purple-600",
          },
          {
            href: "/predict",
            title: "Try Prediction",
            desc: "Enter features and get predictions",
            icon: "🔮",
            gradient: "from-amber-600 to-orange-600",
          },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <div className="glass-card p-5 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl mb-4 shadow-lg`}
              >
                {card.icon}
              </div>
              <h3 className="font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-sm text-slate-400">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Methodology */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          🔬 Methodology
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Models
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>• Logistic Regression</li>
              <li>• Decision Tree</li>
              <li>• Random Forest</li>
              <li>• HistGradientBoosting</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              Sampling Methods
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>• Random Over-Sampling (ROS)</li>
              <li>• SMOTE</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Analysis
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>• Feature Selection</li>
              <li>• Correlation Analysis</li>
              <li>• Association Rules</li>
              <li>• Clustering</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
