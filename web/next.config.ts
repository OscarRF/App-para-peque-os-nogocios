import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const fallbackNodeModules = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "saas-web-deps", "node_modules")
  : null;
const hasLocalNodeModules = fs.existsSync(path.resolve(process.cwd(), "node_modules"));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    if (!hasLocalNodeModules && fallbackNodeModules && fs.existsSync(fallbackNodeModules)) {
      config.resolve.modules = [...(config.resolve.modules ?? ["node_modules"]), fallbackNodeModules];
      config.resolveLoader.modules = [
        ...(config.resolveLoader.modules ?? ["node_modules"]),
        fallbackNodeModules,
      ];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^\.\/([A-Za-z]:[\\/])/, (resource: { request: string }) => {
          resource.request = resource.request.slice(2);
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
