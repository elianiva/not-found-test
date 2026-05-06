declare global {
  interface CloudflareEnvironment {
    ASSETS: Fetcher;
  }
}

const STATIC_FILE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".css", ".map", ".json",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
  ".ico", ".woff", ".woff2", ".ttf", ".eot",
  ".pdf", ".txt", ".xml", ".webmanifest",
]);

function hasStaticFileExtension(pathname: string): boolean {
  const lastSegment = pathname.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return STATIC_FILE_EXTENSIONS.has(lastSegment.slice(dotIndex).toLowerCase());
}

function serveIndexHtml(request: Request, env: CloudflareEnvironment): Promise<Response> {
  return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
}

/** Determine demo mode from the referring page. */
function getMode(request: Request): "broken" | "fixed" | "advanced" {
  const referer = request.headers.get("Referer") ?? "";
  if (referer.includes("/showcase/broken")) return "broken";
  if (referer.includes("/showcase/fixed")) return "fixed";
  return "advanced";
}

export default {
  async fetch(request: Request, env: CloudflareEnvironment): Promise<Response> {
    const url = new URL(request.url);
    const mode = getMode(request);

    // Built-in API endpoint — works in all modes
    if (url.pathname === "/api/hello") {
      return Response.json({ message: "Worker API (advanced routing)" });
    }

    // Unknown API routes — mode-dependent
    if (url.pathname.startsWith("/api/")) {
      if (mode === "advanced") {
        return Response.json({ error: "Endpoint not found" }, { status: 404 });
      }
      // broken/fixed: API calls get SPA fallback (HTML)
      return serveIndexHtml(request, env);
    }

    // Non-API requests (non-navigation missing assets)
    switch (mode) {
      case "broken":
        return serveIndexHtml(request, env);
      case "fixed":
        if (hasStaticFileExtension(url.pathname)) {
          return new Response("Not Found", { status: 404 });
        }
        return serveIndexHtml(request, env);
      case "advanced":
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};
