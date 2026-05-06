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
            <span className="text-red-600">&#x2717;</span> Broken Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Simulates <span className="text-red-600">not_found_handling = "single-page-application"</span>
            &nbsp;fallback &mdash; Worker returns index.html for every missing request
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/showcase/fixed"
            className="text-xs px-3 py-1.5 border border-neutral-800 bg-yellow-50 hover:bg-yellow-100 active:translate-y-px"
          >
            Fixed &rarr;
          </a>
          <a
            href="/showcase/advanced"
            className="text-xs px-3 py-1.5 border border-neutral-800 bg-green-50 hover:bg-green-100 active:translate-y-px"
          >
            Advanced &rarr;
          </a>
        </div>
      </div>

      <div className="mb-8 p-4 border border-neutral-800 bg-red-50 text-xs text-gray-700 leading-relaxed">
        <strong className="text-red-600">Classic SPA pitfall:</strong>
        The Worker serves <span className="text-red-600">index.html</span> for every request that doesn&apos;t
        match an existing asset&mdash;including <span className="text-red-600">.js</span> chunks,
        <span className="text-red-600">.css</span> files, and API calls.
        Click the buttons to trigger real browser errors.
      </div>

      <div className="border border-neutral-800 divide-y divide-neutral-800 mb-8">
        <button
          onClick={() => triggerOldChunkLoad()}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script&gt; pointing to non-existent hash
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; "'text/html' is not a valid JavaScript MIME type"
          </span>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import of non-existent chunk path
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; "Importing a module script failed"
          </span>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Fetch API &rarr; HTML</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch("/api/nonexistent-endpoint") &mdash; gets HTML instead of JSON
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; "Load failed &mdash; expected JSON, got text/html"
          </span>
        </button>

        <div className="p-4">
          <ErrorBoundary onError={(e) => addEvent({ type: "hydration", message: e.message, detail: e.stack })}>
            <HydrationMismatch />
          </ErrorBoundary>
        </div>

        <button
          onClick={() => simulateRedeploy(addEvent)}
          className="w-full text-left p-4 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-red-600">Simulate redeploy</span>
          <p className="text-xs text-gray-600 mt-1">
            Triggers all errors &mdash; simulates new deployment with fresh hashes
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; All of the above
          </span>
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
