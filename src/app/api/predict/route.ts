import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

function runPrediction(target: string, features: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
    const script = process.cwd() + "/backend/predict.py";
    const p = spawn(python, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";

    p.stdout.on("data", d => { out += d.toString(); });
    p.stderr.on("data", d => { err += d.toString(); });
    p.on("error", reject);
    p.on("close", code => {
      if (code !== 0) {
        reject(new Error(err || `Prediction process exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`Python returned an invalid response: ${out.slice(0, 300)}`));
      }
    });

    p.stdin.end(JSON.stringify({ target, features }));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const features = body?.features;
    const target = body?.target === "label" ? "label" : "sublabel";

    if (!features || typeof features !== "object" || Array.isArray(features)) {
      return NextResponse.json({ error: "Missing or invalid features" }, { status: 400 });
    }

    const result = await runPrediction(target, features);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Prediction API error:", e);
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Prediction failed. Make sure Python dependencies are installed."
    }, { status: 500 });
  }
}
