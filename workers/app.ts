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

export default {
  async fetch(request: Request, env: CloudflareEnvironment): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/assets/broken/")) {
      return serveIndexHtml(request, env);
    }

    if (url.pathname.startsWith("/assets/fixed/")) {
      if (hasStaticFileExtension(url.pathname)) {
        return new Response("Not Found", { status: 404 });
      }
      return serveIndexHtml(request, env);
    }

    // Normal fallthrough: try asset first, SPA fallback if missing
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404) return serveIndexHtml(request, env);
    return res;
  },
};
