import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy as cloudflareDevProxyVitePlugin } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { getLoadContext } from "./load-context";

export default defineConfig(() => ({
  plugins: [
    cloudflareDevProxyVitePlugin({ getLoadContext }),
    tailwindcss(),
    reactRouter(),
  ],
  ssr: {
    target: "webworker" as const,
    resolve: {
      conditions: ["workerd", "browser"],
    },
  },
}));
