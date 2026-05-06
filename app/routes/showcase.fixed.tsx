import {
  ErrorLogProvider,
  ErrorLogPanel,
  useErrorLog,
  useGlobalErrorCapture,
  ErrorBoundary,
  triggerOldChunkLoad,
  triggerOldModuleImport,
  triggerFetchHtmlResponse,
  simulateRedeploy,
} from "~/components/error-triggers";
import { HydrationMismatch } from "~/components/hydration-mismatch";

function ShowcaseContent() {
  const { events, addEvent, clear } = useErrorLog();
  useGlobalErrorCapture();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/" className="text-xs text-gray-500 hover:text-neutral-800 border-b border-gray-300 hover:border-neutral-800">
            &larr; back
          </a>
          <h1 className="text-lg font-bold uppercase tracking-wide mt-2">
            <span className="text-yellow-700">&#x2713;</span> Fixed Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Worker returns <span className="text-yellow-700">404</span> for static file extensions
            before SPA fallback &mdash; but still runs for every miss
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/showcase/broken"
            className="text-xs px-3 py-1.5 border border-neutral-800 bg-red-50 hover:bg-red-100 active:translate-y-px"
          >
            &larr; Broken
          </a>
          <a
            href="/showcase/advanced"
            className="text-xs px-3 py-1.5 border border-neutral-800 bg-green-50 hover:bg-green-100 active:translate-y-px"
          >
            Advanced &rarr;
          </a>
        </div>
      </div>

      <div className="mb-8 p-4 border border-neutral-800 bg-yellow-50 text-xs text-gray-700 leading-relaxed">
        <strong className="text-yellow-700">The naive fix:</strong> Worker checks for static file extensions
        (<span className="text-yellow-700">.js, .css, .json, etc.</span>) and returns 404 before
        the SPA fallback. But the Worker still handles <strong>every</strong> non-navigation miss,
        including API calls which still get HTML.
      </div>

      <div className="border border-neutral-800 divide-y divide-neutral-800 mb-8">
        <button
          onClick={() => triggerOldChunkLoad()}
          className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-yellow-700">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script&gt; &mdash; returns 404 instead of HTML
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no MIME error)
          </span>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent)}
          className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-yellow-700">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import &mdash; returns 404 instead of HTML
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no import error)
          </span>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Fetch API &rarr; HTML</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch("/api/nonexistent-endpoint") &mdash; /api/* is not a static file extension,
            still gets SPA fallback
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; Still loads HTML (<span className="text-yellow-700">run_worker_first</span> needed for API)
          </span>
        </button>

        <div className="p-4">
          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <HydrationMismatch />
          </ErrorBoundary>
        </div>

        <button
          onClick={() => simulateRedeploy(addEvent)}
          className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-yellow-700">Simulate redeploy</span>
          <p className="text-xs text-gray-600 mt-1">
            Triggers all errors &mdash; static assets 404, API still broken
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; Static assets 404, API routes still get HTML
          </span>
        </button>
      </div>

      <ErrorLogPanel events={events} onClear={clear} />
    </div>
  );
}

export default function ShowcaseFixed() {
  return (
    <ErrorLogProvider>
      <ShowcaseContent />
    </ErrorLogProvider>
  );
}
