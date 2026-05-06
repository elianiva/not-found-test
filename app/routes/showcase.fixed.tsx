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
          <a href="/" className="text-xs text-gray-500 hover:text-black border-b border-gray-300 hover:border-black">
            &larr; back
          </a>
          <h1 className="text-lg font-bold uppercase tracking-wide mt-2">
            <span className="text-green-700">&#x2713;</span> Fixed Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-green-700">not_found_handling = "none"</span>
            &nbsp;+ worker middleware &mdash; proper 404 for assets
          </p>
        </div>
        <a
          href="/showcase/broken"
          className="text-xs px-3 py-1.5 border border-black bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          &larr; Broken mode
        </a>
      </div>

      <div className="mb-8 p-4 border-2 border-black bg-green-50 text-xs text-gray-700 leading-relaxed">
        <strong className="text-green-700">How the fix works:</strong> Before delegating to the SPA fallback,
        the Worker checks if the request path has a static file extension
        (<span className="text-green-700">.js, .css, .json, etc.</span>).
        If it does, it returns a proper <strong>404 Not Found</strong> instead of index.html.
        Click the buttons below&mdash;missing assets now log 404s instead of MIME type errors.
      </div>

      <div className="border border-black divide-y divide-black mb-8">
        <button
          onClick={() => triggerOldChunkLoad(addEvent)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script&gt; &mdash; now returns 404 instead of HTML
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no MIME error)
          </span>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import &mdash; now returns 404 instead of HTML
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no import error)
          </span>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent)}
          className="w-full text-left p-4 bg-yellow-50 hover:bg-yellow-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-yellow-700">Fetch API &rarr; HTML</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch("/api/nonexistent-endpoint") &mdash; /api/* is not a static file extension,
            still falls through to SPA fallback
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; Still loads HTML (API routes need <span className="text-yellow-700">run_worker_first</span>)
          </span>
        </button>

        <div className="p-4">
          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <HydrationMismatch />
          </ErrorBoundary>
        </div>

        <button
          onClick={() => simulateRedeploy(addEvent)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Simulate redeploy</span>
          <p className="text-xs text-gray-600 mt-1">
            Triggers all errors &mdash; static assets now properly 404
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; Static asset requests 404, navigation routes still get SPA fallback
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
