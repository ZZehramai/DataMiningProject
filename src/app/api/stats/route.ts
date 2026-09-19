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
  const datasetStats = readJSON("tables/dataset_stats.json");
  const classDistribution = readJSON("tables/class_distribution.json");
  const correlationMatrix = readJSON("tables/correlation_matrix.json");
  const featureImportance = readJSON("tables/feature_importance.json");
  const descriptiveStatistics = readJSON("tables/descriptive_statistics.json");
  const diseaseClassByGender = readJSON("tables/disease_class_by_gender.json");

  return NextResponse.json({
    datasetStats,
    classDistribution,
    correlationMatrix,
    featureImportance,
    descriptiveStatistics,
    diseaseClassByGender,
  });
}
