import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "backend", "results");

function readJSON(subpath: string) {
  const filePath = path.join(RESULTS_DIR, subpath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export async function GET() {
  const modelMetrics = readJSON("metrics/model_metrics.json");
  const confusionMatrices = readJSON("metrics/confusion_matrices.json");
  const rocCurves = readJSON("metrics/roc_curves.json");
  const samplingComparison = readJSON("tables/sampling_comparison.json");
  const associationRules = readJSON("tables/association_rules.json");
  const associationRuleSummary = readJSON("tables/association_rule_summary.json");
  const clusteringResults = readJSON("tables/clustering_results.json");
  const rocSummary = readJSON("metrics/roc_summary.json");
  const binaryModelMetrics = readJSON("metrics/binary_model_metrics.json");
  const binaryConfusionMatrices = readJSON("metrics/binary_confusion_matrices.json");
  const binaryRocCurves = readJSON("metrics/binary_roc_curves.json");
  const binarySamplingComparison = readJSON("tables/binary_sampling_comparison.json");

  return NextResponse.json({
    modelMetrics,
    confusionMatrices,
    rocCurves,
    samplingComparison,
    associationRules,
    associationRuleSummary,
    clusteringResults,
    rocSummary,
    binaryModelMetrics,
    binaryConfusionMatrices,
    binaryRocCurves,
    binarySamplingComparison,
  });
}
