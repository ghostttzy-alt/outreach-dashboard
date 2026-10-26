import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev badge out of the sidebar.
  devIndicators: { position: "bottom-right" },
  // libSQL ships native bindings that must not go through webpack.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
