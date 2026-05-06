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
          Three modes comparing SPA routing strategies on Cloudflare Workers&mdash;
          from the classic pitfall to advanced routing control.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-px bg-gray-300 mb-12">
        <a
          href="/showcase/broken"
          className="block p-6 bg-red-50 hover:bg-red-100 border border-neutral-800 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">&rarr; Broken</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            <span className="text-red-600">single-page-application</span> fallback.
            Every missing asset returns index.html as text/html.
          </p>
        </a>

        <a
          href="/showcase/fixed"
          className="block p-6 bg-yellow-50 hover:bg-yellow-100 border border-neutral-800 -ml-px active:translate-y-px"
        >
          <span className="text-sm font-bold text-yellow-700">&rarr; Fixed</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Worker returns 404 for static file extensions, SPA fallback for the rest.
            Still invokes Worker on every non-navigation miss.
          </p>
        </a>

        <a
          href="/showcase/advanced"
          className="block p-6 bg-green-50 hover:bg-green-100 border border-neutral-800 -ml-px active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">&rarr; Advanced</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            <span className="text-green-700">run_worker_first</span> routes only /api/* to Worker.
            Platform handles navigation SPA fallback directly.
          </p>
        </a>
      </div>

      <section className="mb-12">
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">Error Scenarios</h2>
        <div className="border border-neutral-800 divide-y divide-neutral-800">
          {([
            ["Load old chunk", "Inject &lt;script&gt; pointing to non-existent hash &rarr; browser gets HTML"],
            ["Import old module", "Dynamic import() of missing chunk &rarr; server returns HTML"],
            ["Fetch API &rarr; HTML", "fetch('/api/...') where worker serves index.html instead of JSON"],
            ["Hydration mismatch (#418)", "Server and client render different output &rarr; React error #418"],
            ["Simulate redeploy", "Multi-step: snapshot hashes, rebuild, old URLs returning HTML"],
          ] as const).map(([label, desc]) => (
            <div className="p-3 flex items-start gap-3" key={label}>
              <span className="text-xs font-bold text-neutral-800 w-36 shrink-0">{label}</span>
              <span className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">Config Comparison</h2>
        <div className="grid grid-cols-3 gap-px bg-gray-300 text-xs">
          <div className="p-4 bg-red-50">
            <h3 className="font-bold text-red-600 mb-2">Broken</h3>
            <pre className="text-[10px] leading-relaxed">{`not_found_handling =
  "single-page-application"
// no Worker middleware`}</pre>
          </div>
          <div className="p-4 bg-yellow-50">
            <h3 className="font-bold text-yellow-700 mb-2">Fixed</h3>
            <pre className="text-[10px] leading-relaxed">{`not_found_handling = "none"
// Worker runs for ALL requests
// checks static file extensions`}</pre>
          </div>
          <div className="p-4 bg-green-50">
            <h3 className="font-bold text-green-700 mb-2">Advanced</h3>
            <pre className="text-[10px] leading-relaxed">{`run_worker_first = ["/api/*"]
not_found_handling =
  "single-page-application"
// platform handles navigation`}</pre>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">How Advanced Routing Works</h2>
        <pre className="text-xs border border-neutral-800 p-4 bg-gray-50 overflow-x-auto leading-relaxed">{`wrangler.toml
├── run_worker_first = ["/api/*"]
│   └── /api/*           → Worker handles
├── not_found_handling
│   └── navigation routes → platform serves index.html (no Worker cost)
└── everything else
    └── missing static assets (non-navigation) → Worker returns 404`}</pre>
      </section>
    </div>
  );
}
