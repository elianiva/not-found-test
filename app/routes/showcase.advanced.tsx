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
import { useState } from "react";

function ApiDemo() {
  const [result, setResult] = useState<{ status: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const callApi = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(path);
      const body = await res.text();
      setResult({
        status: `${res.status} ${res.headers.get("content-type") || ""}`,
        body: body.slice(0, 300),
      });
    } catch (e: any) {
      setResult({ status: "error", body: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border border-neutral-800">
      <p className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-3">
        &#x2713; API Routing Demo
      </p>
      <p className="text-xs text-gray-600 mb-3">
        With <span className="text-green-700">run_worker_first = ["/api/*"]</span>,
        API requests always hit the Worker&mdash;never the SPA fallback.
      </p>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => callApi("/api/hello")}
          disabled={loading}
          className="text-xs px-3 py-1.5 border border-neutral-800 bg-green-50 hover:bg-green-100 active:translate-y-px disabled:opacity-50"
        >
          GET /api/hello
        </button>
        <button
          onClick={() => callApi("/api/nonexistent")}
          disabled={loading}
          className="text-xs px-3 py-1.5 border border-neutral-800 bg-white hover:bg-gray-50 active:translate-y-px disabled:opacity-50"
        >
          GET /api/nonexistent
        </button>
      </div>
      {result && (
        <div className="text-xs bg-gray-50 border border-neutral-800 p-3">
          <p className="text-[10px] text-gray-500 mb-1">Response: {result.status}</p>
          <pre className="text-[10px] text-gray-700 whitespace-pre-wrap">{result.body}</pre>
        </div>
      )}
    </div>
  );
}

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
            <span className="text-green-700">&#x2713;</span> Advanced Mode
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-green-700">run_worker_first = ["/api/*"]</span>
            &nbsp;&mdash; platform handles SPA navigation, Worker handles API
          </p>
        </div>
        <a
          href="/showcase/broken"
          className="text-xs px-3 py-1.5 border border-neutral-800 bg-red-50 hover:bg-red-100 active:translate-y-px"
        >
          &larr; Broken mode
        </a>
      </div>

      <div className="mb-8 p-4 border border-neutral-800 bg-green-50 text-xs text-gray-700 leading-relaxed space-y-2">
        <p>
          <strong className="text-green-700">How it works:</strong> The
          <span className="text-green-700"> run_worker_first</span> config tells the platform
          to only invoke the Worker for <span className="text-green-700">/api/*</span> paths.
          Everything else follows the normal static asset flow.
        </p>
        <ul className="list-disc list-inside text-[11px] space-y-1">
          <li>
            <strong className="text-green-700">/api/*</strong> &rarr; Worker invoked
            (can return JSON, proxy, etc.)
          </li>
          <li>
            <strong className="text-green-700">Navigation routes</strong> &rarr; Platform
            serves index.html via SPA fallback (no Worker cost)
          </li>
          <li>
            <strong className="text-green-700">Missing assets</strong> &rarr; Worker
            returns 404 (non-navigation requests reach Worker)
          </li>
        </ul>
      </div>

      <ApiDemo />

      <div className="border border-neutral-800 divide-y divide-neutral-800 mt-8">
        <button
          onClick={() => triggerOldChunkLoad()}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Load old chunk</span>
          <p className="text-xs text-gray-600 mt-1">
            Injects &lt;script&gt; &mdash; Worker returns 404 (no MIME error)
          </p>
        </button>

        <button
          onClick={() => triggerOldModuleImport(addEvent)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Import old module</span>
          <p className="text-xs text-gray-600 mt-1">
            Dynamic import of missing chunk &mdash; Worker returns 404
          </p>
        </button>

        <button
          onClick={() => triggerFetchHtmlResponse(addEvent)}
          className="w-full text-left p-4 bg-green-50 hover:bg-green-100 active:translate-y-px"
        >
          <span className="text-sm font-bold text-green-700">Fetch API &rarr; JSON</span>
          <p className="text-xs text-gray-600 mt-1">
            fetch("/api/nonexistent-endpoint") &mdash; hits Worker, returns JSON 404
          </p>
          <span className="text-xs text-gray-400 mt-1 block">
            &rarr; 404 Not Found (application/json) &mdash; no HTML
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
            Triggers all errors &mdash; static assets 404, API returns JSON
          </p>
        </button>
      </div>

      <ErrorLogPanel events={events} onClear={clear} />
    </div>
  );
}

export default function ShowcaseAdvanced() {
  return (
    <ErrorLogProvider>
      <ShowcaseContent />
    </ErrorLogProvider>
  );
}
