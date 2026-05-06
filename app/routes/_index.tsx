export default function Index() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">☁️</span>
          <h1 className="text-lg font-bold uppercase tracking-wide">
            CF Workers SPA Routing Showcase
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          Path-based demo of Cloudflare Workers{" "}
          <span className="text-green-700">run_worker_first</span> for SPA routing.
          Compare broken (HTML everywhere) vs fixed (proper 404 for assets).
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px bg-gray-300 mb-12">
        <a
          href="/showcase/broken"
          className="block p-6 bg-red-50 hover:bg-red-100 border border-neutral-800 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">&rarr; Broken</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            <span className="text-red-600">/assets/broken/*</span> routes to Worker.
            Worker returns index.html for every request — .js chunks and .json files
            get text/html → MIME type errors.
          </p>
        </a>

        <a
          href="/showcase/fixed"
          className="block p-6 bg-green-50 hover:bg-green-100 border border-neutral-800 -ml-px active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">&rarr; Fixed</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            <span className="text-green-700">/assets/fixed/*</span> routes to Worker.
            Worker returns <span className="text-green-700">404</span> for static
            file extensions (.js, .css, .json). Navigation routes still get SPA fallback.
          </p>
        </a>
      </div>

      <section className="mb-12">
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">What gets compared</h2>
        <div className="border border-neutral-800 divide-y divide-neutral-800">
          {([
            ["Script load", ".js chunk → broken: HTML (MIME error) / fixed: 404"],
            ["Dynamic import", "import() → broken: HTML / fixed: 404"],
            ["Fetch request", ".json file → broken: HTML / fixed: 404"],
            ["Navigation", "/foo/bar/route → both: index.html (platform SPA fallback)"],
          ] as const).map(([label, desc]) => (
            <div className="p-3 flex items-start gap-3" key={label}>
              <span className="text-xs font-bold text-neutral-800 w-36 shrink-0">{label}</span>
              <span className="text-xs text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">Config</h2>
        <pre className="text-xs border border-neutral-800 p-4 bg-gray-50 overflow-x-auto">{`wrangler.toml
run_worker_first = ["/assets/broken/*", "/assets/fixed/*"]
not_found_handling = "single-page-application"

workers/app.ts
/assets/broken/* → always serve index.html
/assets/fixed/* → check extension → 404 if static, else index.html
/* (everything else) → ASSETS.fetch → 404 → SPA fallback`}</pre>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">Routing Flow</h2>
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          <p>
            <span className="text-green-700 font-bold">Navigation requests</span>{" "}
            (browser page loads) → platform serves index.html directly via{" "}
            <span className="text-green-700">not_found_handling</span> — zero Worker cost.
          </p>
          <p>
            <span className="text-green-700 font-bold">/assets/broken/*</span>{" "}
            and <span className="text-green-700">/assets/fixed/*</span> → hit Worker first
            via <span className="text-green-700">run_worker_first</span>.
          </p>
          <p>
            Everything else → Worker fallthrough path → try ASSETS first,
            SPA fallback if not found.
          </p>
        </div>
      </section>
    </div>
  );
}
