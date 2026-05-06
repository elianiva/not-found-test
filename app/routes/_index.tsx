export default function Index() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">☁️</span>
            <h1 className="text-3xl font-bold text-white">
              CF Workers SPA Bug Showcase
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Interactive demo of the classic Cloudflare Workers SPA pitfall: when{" "}
            <code className="text-cyan-400 bg-gray-900 px-1.5 py-0.5 rounded text-sm">
              not_found_handling = "single-page-application"
            </code>{" "}
            serves HTML for every missing asset — including JS chunks, CSS files, and API calls.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <a
            href="/showcase/broken"
            className="block p-6 rounded-lg bg-red-950/40 border border-red-800/40 hover:border-red-500/60 transition-colors"
          >
            <h2 className="text-xl font-semibold text-red-400 mb-2">🐛 Broken Mode</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Wrangler config with <code className="text-red-400">single-page-application</code> fallback.
              Click buttons to trigger MIME type errors, failed imports, and HTML-as-JSON responses.
            </p>
          </a>

          <a
            href="/showcase/fixed"
            className="block p-6 rounded-lg bg-green-950/40 border border-green-800/40 hover:border-green-500/60 transition-colors"
          >
            <h2 className="text-xl font-semibold text-green-400 mb-2">✅ Fixed Mode</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Worker middleware returns proper 404 for static asset extensions (".js", ".css", etc.)
              while still serving index.html for SPA navigation routes.
            </p>
          </a>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Error Scenarios</h2>
          <div className="space-y-3">
            {[
              {
                label: "Load old chunk",
                desc: "Inject a <script> tag pointing to a non-existent hash — browser gets HTML instead of JS",
                error: "'text/html' is not a valid JS MIME type",
              },
              {
                label: "Import old module",
                desc: "Dynamic import() of a chunk that no longer exists — server returns HTML",
                error: "Importing a module script failed",
              },
              {
                label: "Fetch API → HTML",
                desc: "fetch('/api/...') where the worker serves index.html instead of JSON",
                error: "Load failed — expected JSON, got text/html",
              },
              {
                label: "Hydration mismatch (#418)",
                desc: "Server and client render different output — React throws error #418",
                error: "Minified React error #418",
              },
              {
                label: "Simulate redeploy",
                desc: "Multi-step: snapshot hashes, rebuild, demonstrate old URLs returning HTML",
                error: "All of the above",
              },
            ].map((scenario) => (
              <div
                key={scenario.label}
                className="flex items-start gap-4 p-3 rounded bg-gray-900/50 border border-gray-800"
              >
                <span className="text-cyan-400 font-mono text-sm mt-0.5 shrink-0">
                  {scenario.label}
                </span>
                <div>
                  <p className="text-gray-400 text-sm">{scenario.desc}</p>
                  <p className="text-gray-500 text-xs mt-1 font-mono">
                    → {scenario.error}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">How the fix works</h2>
          <div className="p-4 rounded bg-gray-900/50 border border-gray-800">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{`const STATIC_FILE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".css", ".map", ".json",
  ".png", ".jpg", ".svg", ".ico", ".woff2", ...
]);

if (hasStaticFileExtension(url.pathname)) {
  return new Response("Not Found", { status: 404 });
}

// Otherwise serve index.html for SPA routes
return env.ASSETS.fetch(new Request("/index.html", ...));`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
