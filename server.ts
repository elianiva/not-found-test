import { createRequestHandler, type ServerBuild } from "react-router";

// @ts-ignore This file won't exist if it hasn't yet been built
import * as build from "./build/server";
import { getLoadContext } from "./load-context";

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

const handleRemixRequest = createRequestHandler(build as any as ServerBuild);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    try {
      // run_worker_first hooks: intercepted before SSR
      if (url.pathname.startsWith("/assets/broken/")) {
        return new Response("<!DOCTYPE html><html><body></body></html>", {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (url.pathname.startsWith("/assets/fixed/")) {
        if (hasStaticFileExtension(url.pathname)) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response("<!DOCTYPE html><html><body></body></html>", {
          headers: { "Content-Type": "text/html" },
        });
      }

      // Normal SSR
      const loadContext = getLoadContext({
        request,
        context: {
          cloudflare: {
            cf: request.cf,
            ctx: {
              waitUntil: ctx.waitUntil.bind(ctx),
              passThroughOnException: ctx.passThroughOnException.bind(ctx),
              props: ctx.props,
            },
            caches,
            env,
          },
        },
      });
      return await handleRemixRequest(request, loadContext);
    } catch (error) {
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
