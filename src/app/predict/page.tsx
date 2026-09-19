"use client";

import { useState } from "react";
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

const F: any[] = [
  ["gender","Gender","select",["Female","Male"]],
  ["smoking","Smoking","select",["Never","Former","Current"]],
  ["age","Age","number"],
  ["bmi","BMI","number"],
  ["HbA1c_level","HbA1c Level","number"],
  ["glucose","Glucose","number"],
  ["cholesterol","Cholesterol","number"],
  ["sleep_hours","Sleep Hours","number"],
  ["triglycerides","Triglycerides","number"],
  ["physical_activity","Physical Activity","select",["Low","Moderate","High"]],
  ["family_history","Family History","select",["No","Yes"]],
  ["stress_level","Stress Level","select",["Low","Medium","High"]],
  ["blood_pressure","Blood Pressure","number"],
  ["sugar_consumption","Sugar Consumption","select",["Low","Medium","High"]],
  ["crp_level","CRP Level","number"],
  ["homocysteine_level","Homocysteine Level","number"],
  ["alcohol_intake","Alcohol Intake","number"],
  ["salt_intake","Salt Intake","number"],
  ["heart_rate","Heart Rate","number"],
  ["hdl","HDL","number"],
  ["ldl","LDL","number"],
  ["education_level","Education Level","select",["Primary","Secondary","Tertiary"]],
  ["employment_status","Employment Status","select",["Employed","Unemployed","Retired"]],
];

const defaults: any = {
  gender:"Female", smoking:"Never", age:"55", bmi:"28.5",
  HbA1c_level:"5.8", glucose:"110", cholesterol:"220", sleep_hours:"7",
  triglycerides:"160", physical_activity:"Moderate", family_history:"No",
  stress_level:"Medium", blood_pressure:"135", sugar_consumption:"Medium",
  crp_level:"3", homocysteine_level:"12", alcohol_intake:"5", salt_intake:"6",
  heart_rate:"78", hdl:"50", ldl:"120", education_level:"Tertiary",
  employment_status:"Employed"
};

const sublabelClasses = ["N","DI","HY","HT","DI_HY","DI_HT","HT_HY","DI_HT_HY"];
const labelClasses = ["Normal","Abnormal"];

const desc: any = {
  N:"Normal - No disease detected",
  DI:"Diabetes",
  HY:"Hypertension",
  HT:"Heart Disease",
  DI_HY:"Diabetes + Hypertension",
  DI_HT:"Diabetes + Heart Disease",
  HT_HY:"Hypertension + Heart Disease",
  DI_HT_HY:"All Three Conditions",
  Normal:"Normal",
  Abnormal:"Abnormal"
};

const colors = ["#3b82f6","#06b6d4","#10b981","#f59e0b","#f43f5e","#8b5cf6","#ec4899","#14b8a6"];

export default function PredictPage() {
  const [target, setTarget] = useState<"sublabel"|"label">("sublabel");
  const [form, setForm] = useState(defaults);
  const [res, setRes] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRes(undefined);

    try {
      const r = await fetch("/api/predict", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ target, features: form })
      });

      const text = await r.text();
      let d: any;
      try {
        d = JSON.parse(text);
      } catch {
        throw new Error("Prediction server returned an invalid response. Check that Python and the model files are installed.");
      }

      if (!r.ok) throw new Error(d.error || "Prediction failed");
      setRes(d);
    } catch (e: any) {
      setError(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  const classes = target === "sublabel" ? sublabelClasses : labelClasses;
  const chart = res
    ? classes.map((x) => ({name:x, value:(res.probabilities?.[x] || 0) * 100}))
        .sort((a,b) => b.value-a.value)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Disease Prediction</h1>
        <p className="text-slate-400">
          Use the same 23 original project features for either the 8-class
          <code className="mx-1">sublabel</code> prediction or binary
          <code className="mx-1">label</code> classification.
        </p>
      </div>

      <div className="glass-card p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setTarget("sublabel"); setRes(undefined); setError(""); }}
          className={`tab-btn ${target === "sublabel" ? "active" : ""}`}
        >
          🔬 8-Class Disease Prediction (sublabel)
        </button>
        <button
          type="button"
          onClick={() => { setTarget("label"); setRes(undefined); setError(""); }}
          className={`tab-btn ${target === "label" ? "active" : ""}`}
        >
          🩺 Binary Classification (label)
        </button>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-slate-300">
        {target === "sublabel"
          ? "Target: sublabel • 8 classes • Random Forest + Random Over-Sampling"
          : "Target: label • Normal / Abnormal • Random Forest + Random Over-Sampling"}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">📋 Patient Features</h2>
          <form onSubmit={submit}>
            <div className="grid grid-cols-2 gap-4">
              {F.map(([name,label,type,opts]) => (
                <div key={name}>
                  <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
                  {type === "select" ? (
                    <select
                      value={form[name]}
                      onChange={(e) => setForm({...form,[name]:e.target.value})}
                      className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white text-sm"
                    >
                      {opts.map((o:string) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      required type="number" step="any" value={form[name]}
                      onChange={(e) => setForm({...form,[name]:e.target.value})}
                      className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2.5 text-white text-sm"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Predicting..." : target === "label" ? "🩺 Predict Binary Label" : "🔮 Predict Disease Class"}
            </button>

            {error && <div className="mt-3 p-3 rounded-lg bg-rose-500/10 text-rose-400 text-sm">❌ {error}</div>}
          </form>
        </div>

        <div className="space-y-6">
          {res ? (
            <>
              <div className="glass-card p-6 text-center">
                <p className="text-slate-400">Predicted {target === "label" ? "Label" : "Disease Class"}</p>
                <div className="text-4xl font-bold text-blue-300 mt-3">{res.prediction}</div>
                <h3 className="text-white text-lg mt-2">{desc[res.prediction]}</h3>
                <p className="text-slate-500 text-sm mt-3">
                  {res.modelUsed} + {res.samplingMethod}
                </p>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {target === "label" ? "Binary Class Probabilities" : "Class Probabilities"}
                </h2>
                <ResponsiveContainer width="100%" height={target === "label" ? 180 : 330}>
                  <BarChart data={chart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                    <XAxis type="number" domain={[0,100]} stroke="#94a3b8" tickFormatter={(v) => `${v}%`}/>
                    <YAxis type="category" dataKey="name" stroke="#94a3b8"/>
                    <Tooltip formatter={(v:any) => [`${Number(v).toFixed(2)}%`, "Probability"]}/>
                    <Bar dataKey="value" radius={[0,5,5,0]}>
                      {chart.map((_,i) => <Cell key={i} fill={colors[i % colors.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400">
              <div className="text-5xl mb-4">{target === "label" ? "🩺" : "🔮"}</div>
              <p>Enter the features and run the {target === "label" ? "binary label" : "disease class"} prediction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
