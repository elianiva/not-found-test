
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-2 inline-block">
              ← Back
            </a>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              ✅ Fixed Mode
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Worker middleware + <code className="text-green-400">not_found_handling = "none"</code>
              {" — "}proper 404 for assets, SPA fallback for navigation
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/showcase/broken"
              className="px-3 py-1.5 text-xs rounded bg-red-900/50 text-red-300 border border-red-700/50 hover:bg-red-900/70"
            >
              ← Try Broken
            </a>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-800/30">
          <p className="text-sm text-green-300">
            <strong>How the fix works:</strong> Before delegating to the SPA fallback, the Worker
            checks if the request path has a static file extension (".js", ".css", ".json", etc.).
            If it does, it returns a proper <strong>404 Not Found</strong> instead of serving
            index.html. Click the buttons below — they'll now log proper 404s instead of MIME type
            errors.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          <button
            onClick={() => triggerOldChunkLoad(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-green-950/30 border border-green-800/30 hover:border-green-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-green-400">Load old chunk</span>
            <p className="text-xs text-gray-500 mt-1">
              Injects a &lt;script&gt; tag — now returns 404 instead of HTML
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → 404 Not Found (no MIME error)
            </span>
          </button>

          <button
            onClick={() => triggerOldModuleImport(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-green-950/30 border border-green-800/30 hover:border-green-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-green-400">Import old module</span>
            <p className="text-xs text-gray-500 mt-1">
              Dynamic import — now returns 404 instead of HTML
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → 404 Not Found (no import error)
            </span>
          </button>

          <button
            onClick={() => triggerFetchHtmlResponse(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-green-950/30 border border-green-800/30 hover:border-green-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-green-400">Fetch API → HTML</span>
            <p className="text-xs text-gray-500 mt-1">
              fetch("/api/nonexistent-endpoint") — still gets index.html since /api/* isn't a
              static file extension (this is where you'd add API-specific routing)
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → Still loads HTML (API routes need separate handling via run_worker_first)
            </span>
          </button>

          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <div className="p-4 rounded-lg bg-green-950/30 border border-green-800/30">
              <HydrationMismatch />
            </div>
          </ErrorBoundary>

          <button
            onClick={() => simulateRedeploy(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-green-950/30 border border-green-800/30 hover:border-green-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-green-400">Simulate redeploy</span>
            <p className="text-xs text-gray-500 mt-1">
              Triggers all errors — static assets now properly 404
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → Static asset requests 404, navigation routes still get SPA fallback
            </span>
          </button>
        </div>

        <ErrorLogPanel events={events} onClear={clear} />
      </div>
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
