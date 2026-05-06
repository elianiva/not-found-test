
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
              🐛 Broken Mode
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              <code className="text-red-400">not_found_handling = "single-page-application"</code>
              {" — "}every unmatched request returns index.html
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/showcase/fixed"
              className="px-3 py-1.5 text-xs rounded bg-green-900/50 text-green-300 border border-green-700/50 hover:bg-green-900/70"
            >
              Switch to Fixed →
            </a>
          </div>
        </div>

        <div className="grid gap-4 mb-8">
          <button
            onClick={() => triggerOldChunkLoad(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-red-950/30 border border-red-800/30 hover:border-red-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-red-400">Load old chunk</span>
            <p className="text-xs text-gray-500 mt-1">
              Injects a &lt;script&gt; tag pointing to a non-existent hash
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → "'text/html' is not a valid JavaScript MIME type"
            </span>
          </button>

          <button
            onClick={() => triggerOldModuleImport(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-orange-950/30 border border-orange-800/30 hover:border-orange-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-orange-400">Import old module</span>
            <p className="text-xs text-gray-500 mt-1">
              Dynamic import of a non-existent chunk path
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → "Importing a module script failed"
            </span>
          </button>

          <button
            onClick={() => triggerFetchHtmlResponse(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-yellow-950/30 border border-yellow-800/30 hover:border-yellow-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-yellow-400">Fetch API → HTML</span>
            <p className="text-xs text-gray-500 mt-1">
              fetch("/api/nonexistent-endpoint") — gets HTML instead of JSON
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → "Load failed — expected JSON, got text/html"
            </span>
          </button>

          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-800/30">
              <HydrationMismatch />
            </div>
          </ErrorBoundary>

          <button
            onClick={() => simulateRedeploy(addEvent)}
            className="w-full text-left p-4 rounded-lg bg-blue-950/30 border border-blue-800/30 hover:border-blue-600/60 transition-colors"
          >
            <span className="text-sm font-medium text-blue-400">Simulate redeploy</span>
            <p className="text-xs text-gray-500 mt-1">
              Triggers all errors in sequence — simulates a new deployment with fresh hashes
            </p>
            <span className="text-xs text-gray-600 mt-1 block font-mono">
              → All of the above
            </span>
          </button>
        </div>

        <ErrorLogPanel events={events} onClear={clear} />
      </div>
    </div>
  );
}

export default function ShowcaseBroken() {
  return (
    <ErrorLogProvider>
      <ShowcaseContent />
    </ErrorLogProvider>
  );
}
