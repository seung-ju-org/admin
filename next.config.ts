import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["ssh2"],
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
