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
  PieChart,
  Pie,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface DatasetStats {
  shape: number[];
  columns: string[];
  missing_values: Record<string, number>;
  dtypes: Record<string, string>;
  numeric_stats: Record<
    string,
    {
      mean: number;
      std: number;
      min: number;
      "25%": number;
      "50%": number;
      "75%": number;
      max: number;
    }
  >;
}

interface StatsData {
  datasetStats: DatasetStats | null;
  classDistribution: Record<string, number> | null;
  correlationMatrix: { columns: string[]; matrix: number[][] } | null;
  diseaseClassByGender: Record<string, Record<string, number>> | null;
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

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
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

  const stats = data?.datasetStats;
  const classDist = data?.classDistribution;
  const corr = data?.correlationMatrix;
  const diseaseClassByGender = data?.diseaseClassByGender;

  const missingData = stats
    ? Object.entries(stats.missing_values)
        .filter(([, v]) => v >= 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const classDistData = classDist
    ? Object.entries(classDist).map(([name, value]) => ({ name, value }))
    : [];

  const genderClassData = diseaseClassByGender
    ? Object.entries(diseaseClassByGender).map(([gender, counts]) => ({
        gender,
        ...counts,
      }))
    : [];

  const diseaseClasses = classDist
    ? Object.keys(classDist)
    : ["N", "DI", "HY", "HT", "DI_HY", "DI_HT", "HT_HY", "DI_HT_HY"];

  const totalSamples = classDist
    ? Object.values(classDist).reduce((a, b) => a + b, 0)
    : 0;
  const imbalanceRatio = classDist
    ? Math.max(...Object.values(classDist)) /
      Math.min(...Object.values(classDist))
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Data Statistics
        </h1>
        <p className="text-slate-400">
          Exploratory analysis of the disease prediction dataset
        </p>
      </div>

      {/* Dataset Overview */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📋</span> Dataset Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Rows</p>
            <p className="text-2xl font-bold text-blue-400">
              {stats?.shape?.[0] ?? "-"}
            </p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Columns</p>
            <p className="text-2xl font-bold text-cyan-400">
              {stats?.shape?.[1] ?? "-"}
            </p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Selected Features</p>
            <p className="text-2xl font-bold text-emerald-400">23</p>
          </div>
          <div className="stat-card p-4">
            <p className="text-sm text-slate-400">Imbalance Ratio</p>
            <p className="text-2xl font-bold text-amber-400">
              {imbalanceRatio.toFixed(1)}:1
            </p>
          </div>
        </div>

        {/* Columns & Dtypes */}
        {stats?.columns && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Data Type</th>
                  <th>Missing</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {stats.columns.map((col) => (
                  <tr key={col}>
                    <td className="font-mono text-blue-300">{col}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                        {stats.dtypes[col] ?? "unknown"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          (stats.missing_values[col] ?? 0) === 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {stats.missing_values[col] ?? 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          col === "sublabel" || col === "label"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {col === "sublabel" || col === "label"
                          ? "Target"
                          : "Feature"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missing Values */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>❓</span> Missing Values
        </h2>
        {missingData.every((d) => d.value === 0) ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-emerald-400 font-semibold">
                No Missing Values
              </p>
              <p className="text-sm text-slate-400">
                The dataset is complete with no null or missing entries.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={missingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Class Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Class Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {classDistData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>🥧</span> Class Proportions
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classDistData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#475569" }}
              >
                {classDistData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Imbalance Analysis */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚖️</span> Class Imbalance Analysis
        </h2>
        {classDist && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="stat-card p-4 text-center">
                <p className="text-sm text-slate-400">Total Samples</p>
                <p className="text-xl font-bold text-blue-400">
                  {totalSamples}
                </p>
              </div>
              <div className="stat-card p-4 text-center">
                <p className="text-sm text-slate-400">Majority Class</p>
                <p className="text-xl font-bold text-emerald-400">
                  {
                    Object.entries(classDist).sort(
                      (a, b) => b[1] - a[1],
                    )[0]?.[0]
                  }{" "}
                  (
                  {
                    Object.entries(classDist).sort(
                      (a, b) => b[1] - a[1],
                    )[0]?.[1]
                  }
                  )
                </p>
              </div>
              <div className="stat-card p-4 text-center">
                <p className="text-sm text-slate-400">Minority Class</p>
                <p className="text-xl font-bold text-rose-400">
                  {
                    Object.entries(classDist).sort(
                      (a, b) => a[1] - b[1],
                    )[0]?.[0]
                  }{" "}
                  (
                  {
                    Object.entries(classDist).sort(
                      (a, b) => a[1] - b[1],
                    )[0]?.[1]
                  }
                  )
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-sm">
                ⚠️ The dataset shows significant class imbalance (ratio:{" "}
                <strong>{imbalanceRatio.toFixed(1)}:1</strong>). This motivates
                the use of resampling techniques (ROS and SMOTE) to balance the
                training data before model fitting.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Disease Class Distribution by Gender */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <span>👥</span> Disease Class Distribution by Gender
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Distribution of the eight disease sublabels across Female, Male, and
          Unknown gender records.
        </p>

        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={genderClassData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="gender" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {diseaseClasses.map((label, i) => (
              <Bar
                key={label}
                dataKey={label}
                name={label}
                stackId="gender"
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto mt-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gender</th>
                {diseaseClasses.map((label) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {genderClassData.map((row) => {
                const total = diseaseClasses.reduce(
                  (sum, label) =>
                    sum + Number((row as Record<string, unknown>)[label] ?? 0),
                  0,
                );
                return (
                  <tr key={row.gender}>
                    <td className="font-semibold">{row.gender}</td>
                    {diseaseClasses.map((label) => (
                      <td key={label}>
                        {(row as Record<string, unknown>)[label] as number}
                      </td>
                    ))}
                    <td className="font-semibold text-blue-300">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
