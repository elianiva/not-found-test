export default function Index() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">☁️</span>
          <h1 className="text-lg font-bold uppercase tracking-wide">
            CF Workers SPA Bug Showcase
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          Interactive demo of the classic Cloudflare Workers SPA pitfall:
          when <span className="text-red-600">not_found_handling = "single-page-application"</span>
          {" "}serves HTML for every missing asset&mdash;including JS chunks, CSS files, and API calls.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px bg-gray-300 mb-12">
        <a
          href="/showcase/broken"
          className="block p-6 bg-red-50 hover:bg-red-100 border-2 border-black active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">&rarr; Broken Mode</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            <span className="text-red-600">single-page-application</span> fallback.
            Every missing asset returns index.html as text/html.
          </p>
        </a>

        <a
          href="/showcase/fixed"
          className="block p-6 bg-green-50 hover:bg-green-100 border-2 border-black -ml-px active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">&rarr; Fixed Mode</span>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Worker middleware returns proper 404 for static asset extensions,
            SPA fallback only for navigation routes.
          </p>
        </a>
      </div>

      <section className="mb-12">
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">Error Scenarios</h2>
        <div className="border border-black divide-y divide-black">
          {([
            ["Load old chunk", "Inject <script> pointing to non-existent hash &rarr; browser gets HTML"],
            ["Import old module", "Dynamic import() of missing chunk &rarr; server returns HTML"],
            ["Fetch API &rarr; HTML", "fetch('/api/...') where worker serves index.html instead of JSON"],
            ["Hydration mismatch (#418)", "Server and client render different output &rarr; React error #418"],
            ["Simulate redeploy", "Multi-step: snapshot hashes, rebuild, old URLs returning HTML"],
          ] as const).map(([label, desc]) => (
            <div className="p-3 flex items-start gap-3" key={label}>
              <span className="text-xs font-bold text-black w-36 shrink-0">{label}</span>
              <span className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase mb-4 tracking-wide">The Fix</h2>
        <pre className="text-xs border border-black p-4 bg-gray-50 overflow-x-auto">{`const STATIC_FILE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".css", ".map", ".json",
  ".png", ".jpg", ".svg", ".ico", ".woff2", ...
]);

if (hasStaticFileExtension(url.pathname)) {
  return new Response("Not Found", { status: 404 });
}

// navigation routes -> serve index.html
return env.ASSETS.fetch(new Request("/index.html", ...));`}</pre>
      </section>
    </div>
  );
}
