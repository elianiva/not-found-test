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

const PREFIX = "/assets/fixed";

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
            <span className="text-green-700">&#x2713;</span> Fixed Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-green-700">/assets/fixed/*</span> → Worker
            returns 404 for static file extensions
          </p>
        </div>
        <a
          href="/showcase/broken"
          className="text-xs px-3 py-1.5 border border-neutral-800 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          &larr; Broken mode
        </a>
      </div>

      <div className="mb-8 p-4 border border-neutral-800 bg-green-50 text-xs text-gray-700 leading-relaxed">
        <p>
          <strong className="text-green-700">How the fix works:</strong>{" "}
          <span className="text-green-700">run_worker_first</span> routes{" "}
          <span className="text-green-700">/assets/fixed/*</span> to the Worker.
          The Worker checks for static file extensions and returns{" "}
          <span className="text-green-700">404</span> instead of index.html.
        </p>
      </div>

      <div className="border border-neutral-800 divide-y divide-neutral-800 mb-8">
        <button
          onClick={() => triggerOldChunkLoad(PREFIX)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script src="{PREFIX}/old-chunk-xxx<span className="text-green-700">.js</span>"&gt;
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no MIME error)
          </span>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import({PREFIX}/old-chunk-xxx<span className="text-green-700">.js</span>)
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no import error)
          </span>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Fetch JSON → 404</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch({PREFIX}/api-mock<span className="text-green-700">.json</span>)
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (no HTML)
          </span>
        </button>

        <div className="p-4">
          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <HydrationMismatch />
          </ErrorBoundary>
        </div>

        <button
          onClick={() => simulateRedeploy(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Simulate redeploy</span>
          <p className="text-xs text-gray-600 mt-1">
            Triggers all errors — static assets 404, no MIME errors
          </p>
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
