import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./backend/**/*"],
  },
};

export default nextConfig;
