import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESULTS_DIR = path.join(process.cwd(), "backend", "results");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const resolved = path.resolve(path.join(RESULTS_DIR, filePath));
  if (!resolved.startsWith(path.resolve(RESULTS_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(resolved, "utf-8");
    const ext = path.extname(resolved);

    if (ext === ".json") {
      return NextResponse.json(JSON.parse(content));
    }

    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
