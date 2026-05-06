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

const PREFIX = "/assets/broken";

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
            <span className="text-red-600">&#x2717;</span> Broken Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-red-600">/assets/broken/*</span> → Worker
            serves index.html for every missing request
          </p>
        </div>
        <a
          href="/showcase/fixed"
          className="text-xs px-3 py-1.5 border border-neutral-800 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          Fixed mode &rarr;
        </a>
      </div>

      <div className="mb-8 p-4 border border-neutral-800 bg-red-50 text-xs text-gray-700 leading-relaxed">
        <p>
          Requests under <span className="text-red-600">{PREFIX}/*</span> are
          routed to the Worker via
          <span className="text-red-600"> run_worker_first</span>.
          The Worker serves <span className="text-red-600">index.html</span>{" "}
          for all of them — including .js chunks and .json files.
        </p>
      </div>

      <div className="border border-neutral-800 divide-y divide-neutral-800 mb-8">
        <button
          onClick={() => triggerOldChunkLoad(PREFIX)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script src="{PREFIX}/old-chunk-xxx<span className="text-red-600">.js</span>"&gt;
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; gets text/html → MIME error
          </span>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import({PREFIX}/old-chunk-xxx<span className="text-red-600">.js</span>)
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; gets HTML → import fails
          </span>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Fetch JSON → HTML</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch({PREFIX}/api-mock<span className="text-red-600">.json</span>)
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; gets text/html instead of JSON
          </span>
        </button>

        <div className="p-4">
          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <HydrationMismatch />
          </ErrorBoundary>
        </div>

        <button
          onClick={() => simulateRedeploy(addEvent, PREFIX)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Simulate redeploy</span>
          <p className="text-xs text-gray-600 mt-1">
            Triggers all errors — simulates new deployment with fresh chunk hashes
          </p>
        </button>
      </div>

      <ErrorLogPanel events={events} onClear={clear} />
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
