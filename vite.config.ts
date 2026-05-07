import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy as cloudflareDevProxyVitePlugin } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { getLoadContext } from "./load-context";

function virtualDeploymentHash(): Plugin {
  return {
    name: "virtual-deployment-hash",
    resolveId(id) {
      if (id === "virtual:deployment-hash") return "\0virtual:deployment-hash";
    },
    load(id) {
      if (id === "\0virtual:deployment-hash") {
        const hash = crypto.randomUUID().slice(0, 8);
        return `
  export const DEPLOYMENT_HASH = ${JSON.stringify(hash)};
  export function getChunkUrl() { return import.meta.url; }
`;
      }
    },
  };
}

export default defineConfig(() => ({
  plugins: [cloudflareDevProxyVitePlugin({ getLoadContext }), tailwindcss(), reactRouter(), virtualDeploymentHash()],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    target: "webworker" as const,
    resolve: {
      conditions: ["workerd", "browser"],
    },
  },
}));
