declare global {
  interface CloudflareEnvironment {
    ASSETS: Fetcher;
    BUG_MODE?: "broken" | "fixed";
  }
}

const STATIC_FILE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".map",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".txt",
  ".xml",
  ".webmanifest",
]);

function hasStaticFileExtension(pathname: string): boolean {
  const lastSegment = pathname.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = lastSegment.slice(dotIndex).toLowerCase();
  return STATIC_FILE_EXTENSIONS.has(ext);
}

export default {
  async fetch(request: Request, env: CloudflareEnvironment): Promise<Response> {
    const url = new URL(request.url);

    if (env.BUG_MODE === "fixed") {
      if (hasStaticFileExtension(url.pathname)) {
        return new Response("Not Found", { status: 404 });
      }

      const res = await env.ASSETS.fetch(request);
      if (res.status === 404) {
        return env.ASSETS.fetch(
          new Request(new URL("/index.html", request.url), request)
        );
      }
      return res;
    }

    const res = await env.ASSETS.fetch(request);
    if (res.status === 404) {
      return env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url), request)
      );
    }
    return res;
  },
};
