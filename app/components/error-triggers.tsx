import { createContext, useContext, useCallback, useEffect, useState, Component, type ReactNode } from "react";

export interface ErrorEvent {
  id: string;
  timestamp: number;
  type: "script-load" | "import-failed" | "fetch-failed" | "hydration" | "render" | "console-error";
  message: string;
  detail?: string;
  contentType?: string;
  url?: string;
}

interface ErrorLogContextValue {
  events: ErrorEvent[];
  addEvent: (event: Omit<ErrorEvent, "id" | "timestamp">) => void;
  clear: () => void;
}

const ErrorLogContext = createContext<ErrorLogContextValue | null>(null);

export function ErrorLogProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ErrorEvent[]>([]);

  const addEvent = useCallback((event: Omit<ErrorEvent, "id" | "timestamp">) => {
    const entry: ErrorEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setEvents((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  return (
    <ErrorLogContext value={{ events, addEvent, clear }}>
      {children}
    </ErrorLogContext>
  );
}

export function useErrorLog() {
  const ctx = useContext(ErrorLogContext);
  if (!ctx) throw new Error("useErrorLog must be inside ErrorLogProvider");
  return ctx;
}

// Hook that sets up global error listeners
export function useGlobalErrorCapture() {
  const { addEvent } = useErrorLog();

  useEffect(() => {
    const onError = (e: Event) => {
      addEvent({
        type: "script-load",
        message: e.message || "Script load error",
        detail: (e.error as Error)?.stack,
        url: (e.target as HTMLScriptElement)?.src,
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason);
      addEvent({
        type: "import-failed",
        message: msg,
        detail: e.reason?.stack,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [addEvent]);
}

// React Error Boundary
export class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const TYPE_COLORS: Record<ErrorEvent["type"], { bg: string; dot: string; label: string }> = {
  "script-load": { bg: "bg-red-950/50", dot: "bg-red-500", label: "Script Load" },
  "import-failed": { bg: "bg-orange-950/50", dot: "bg-orange-500", label: "Import Failed" },
  "fetch-failed": { bg: "bg-yellow-950/50", dot: "bg-yellow-500", label: "Fetch Failed" },
  hydration: { bg: "bg-purple-950/50", dot: "bg-purple-500", label: "Hydration" },
  render: { bg: "bg-pink-950/50", dot: "bg-pink-500", label: "Render Error" },
  "console-error": { bg: "bg-blue-950/50", dot: "bg-blue-500", label: "Info" },
};

export function ErrorLogPanel({ events, onClear }: { events: ErrorEvent[]; onClear: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
        >
          <span className="text-lg">{collapsed ? "▶" : "▼"}</span>
          Live Error Log
          {events.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-700 text-gray-300">
              {events.length}
            </span>
          )}
        </button>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800"
        >
          Clear
        </button>
      </div>
      {!collapsed && (
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {events.length === 0 && (
            <p className="text-gray-600 text-xs text-center py-8">
              No errors yet. Click a trigger button above.
            </p>
          )}
          {events.map((ev) => {
            const style = TYPE_COLORS[ev.type];
            return (
              <div key={ev.id} className={`p-3 rounded ${style.bg}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">{style.label}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 font-mono break-all">{ev.message}</p>
                    {ev.url && (
                      <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                        URL: {ev.url}
                      </p>
                    )}
                    {ev.contentType && (
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">
                        Content-Type: {ev.contentType}
                      </p>
                    )}
                    {ev.detail && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
                          Details
                        </summary>
                        <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap font-mono">
                          {ev.detail}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Trigger a simulated old chunk load
export function triggerOldChunkLoad(addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void) {
  const hash = Math.random().toString(36).slice(2, 10);
  const src = `/assets/old-chunk-${hash}.js`;

  // Track it via the error handler
  const script = document.createElement("script");
  script.src = src;
  script.onerror = () => {
    addEvent({
      type: "script-load",
      message: `"text/html" is not a valid JavaScript MIME type`,
      detail: `Failed to load script: ${src}. Cloudflare returns index.html (text/html) for missing assets when not_found_handling is "single-page-application".`,
      url: src,
    });
  };
  document.head.appendChild(script);
}

// Trigger a simulated old module import
export async function triggerOldModuleImport(addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void) {
  const hash = Math.random().toString(36).slice(2, 10);
  const src = `/assets/old-chunk-${hash}.js`;

  try {
    await import(/* @vite-ignore */ src);
  } catch (e: any) {
    addEvent({
      type: "import-failed",
      message: `Importing a module script failed`,
      detail: `Dynamic import of ${src} failed. Server returned HTML instead of JavaScript.\n${e.message}`,
      url: src,
    });
  }
}

// Trigger a fetch that returns HTML
export async function triggerFetchHtmlResponse(addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void) {
  try {
    const res = await fetch("/api/nonexistent-endpoint");
    const contentType = res.headers.get("content-type") || "unknown";
    const text = await res.text();
    addEvent({
      type: "fetch-failed",
      message: `Load failed — expected JSON, got ${contentType}`,
      detail: `GET /api/nonexistent-endpoint → ${res.status} ${contentType}\nFirst 200 chars: ${text.slice(0, 200)}`,
      contentType,
      url: "/api/nonexistent-endpoint",
    });
  } catch (e: any) {
    addEvent({
      type: "fetch-failed",
      message: e.message || "Fetch failed",
      detail: e.stack,
      url: "/api/nonexistent-endpoint",
    });
  }
}

// Simulate redeploy: dispatch all four triggers
export function simulateRedeploy(
  addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void
) {
  addEvent({
    type: "console-error",
    message: "🔄 Simulating redeploy... new chunk hashes generated, old URLs now return HTML",
    detail: "In production, a new deployment renames all chunk files with new content hashes. Any cached HTML referencing old chunks will cause MIME type errors.",
  });

  triggerOldChunkLoad(addEvent);
  setTimeout(() => triggerOldModuleImport(addEvent), 300);
  setTimeout(() => triggerFetchHtmlResponse(addEvent), 600);
}
