import { createContext, useContext, useCallback, useEffect, useState, Component, type ReactNode } from "react";

export interface LogEvent {
  id: string;
  timestamp: number;
  type: "script-load" | "import-failed" | "fetch-failed" | "hydration" | "render" | "console-error";
  message: string;
  detail?: string;
  contentType?: string;
  url?: string;
}

interface ErrorLogContextValue {
  events: LogEvent[];
  addEvent: (event: Omit<LogEvent, "id" | "timestamp">) => void;
  clear: () => void;
}

const ErrorLogContext = createContext<ErrorLogContextValue | null>(null);

export function ErrorLogProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<LogEvent[]>([]);

  const addEvent = useCallback((event: Omit<LogEvent, "id" | "timestamp">) => {
    const entry: LogEvent = {
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

/** Global error capture — reports REAL browser errors.
 *  Uses DOM ErrorEvent.message for script load failures (includes MIME type error text). */
export function useGlobalErrorCapture() {
  const { addEvent } = useErrorLog();

  useEffect(() => {
    // Captures <script> load failures — uses DOM ErrorEvent.message which
    // contains the actual browser error (e.g. '"text/html" is not a valid JS MIME type')
    const onScriptError = (e: Event) => {
      const domEvent = e as ErrorEvent;
      const target = e.target as HTMLScriptElement;
      addEvent({
        type: "script-load",
        message: domEvent.message || `Script load error`,
        detail: `URL: ${target?.src || "unknown"}`,
        url: target?.src,
      });
    };

    // Captures unhandled promise rejections (including failed dynamic imports)
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason);
      addEvent({
        type: "import-failed",
        message: msg,
        detail: e.reason?.stack,
      });
    };

    window.addEventListener("error", onScriptError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onScriptError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [addEvent]);
}

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

const TYPE_STYLES: Record<LogEvent["type"], { label: string; textColor: string; bg: string }> = {
  "script-load": { label: "SCRIPT LOAD", textColor: "text-red-600", bg: "bg-red-50" },
  "import-failed": { label: "IMPORT FAILED", textColor: "text-red-600", bg: "bg-red-50" },
  "fetch-failed": { label: "FETCH FAILED", textColor: "text-red-600", bg: "bg-red-50" },
  hydration: { label: "HYDRATION", textColor: "text-red-600", bg: "bg-red-50" },
  render: { label: "RENDER ERROR", textColor: "text-red-600", bg: "bg-red-50" },
  "console-error": { label: "INFO", textColor: "text-gray-500", bg: "bg-gray-50" },
};

export function ErrorLogPanel({ events, onClear }: { events: LogEvent[]; onClear: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-gray-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
        >
          <span>{collapsed ? "\u25b6" : "\u25bc"}</span>
          Error Log
          {events.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] border border-neutral-800 bg-white">
              {events.length}
            </span>
          )}
        </button>
        <button
          onClick={onClear}
          className="text-[10px] uppercase tracking-wide text-gray-500 hover:text-neutral-800 border-b border-transparent hover:border-neutral-800"
        >
          Clear
        </button>
      </div>
      {!collapsed && (
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              No errors yet. Click a trigger button above.
            </p>
          )}
          {events.map((ev) => {
            const style = TYPE_STYLES[ev.type];
            return (
              <div key={ev.id} className={`border-b border-gray-200 p-3 ${style.bg}`}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${style.textColor}`}>
                        {style.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs break-all">{ev.message}</p>
                    {ev.url && (
                      <p className="text-[10px] text-gray-500 mt-1 break-all">
                        URL: {ev.url}
                      </p>
                    )}
                    {ev.contentType && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Content-Type: {ev.contentType}
                      </p>
                    )}
                    {ev.detail && (
                      <details className="mt-1">
                        <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">
                          details
                        </summary>
                        <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap">
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

/** Inject a <script> tag pointing to a non-existent chunk.
 *  The global error handler catches the REAL browser ErrorEvent,
 *  which includes the actual MIME type error from the browser. */
export function triggerOldChunkLoad() {
  const hash = Math.random().toString(36).slice(2, 10);
  const script = document.createElement("script");
  script.src = `/assets/old-chunk-${hash}.js`;
  // No onerror — the global window.addEventListener("error") catches it with
  // the real browser ErrorEvent.message (e.g. MIME type error)
  document.head.appendChild(script);
}

/** Dynamic import of a non-existent chunk.
 *  Catches the REAL import error and reports it. */
export async function triggerOldModuleImport(addEvent: (e: Omit<LogEvent, "id" | "timestamp">) => void) {
  const hash = Math.random().toString(36).slice(2, 10);
  const src = `/assets/old-chunk-${hash}.js`;

  try {
    await import(/* @vite-ignore */ src);
  } catch (e: any) {
    addEvent({
      type: "import-failed",
      message: e.message || String(e),
      detail: e.stack,
      url: src,
    });
  }
}

/** Fetch a non-existent endpoint and report what the server ACTUALLY returned. */
export async function triggerFetchHtmlResponse(addEvent: (e: Omit<LogEvent, "id" | "timestamp">) => void) {
  try {
    const res = await fetch("/api/nonexistent-endpoint");
    const contentType = res.headers.get("content-type") || "unknown";
    const text = await res.text();
    addEvent({
      type: "fetch-failed",
      message: `GET /api/nonexistent-endpoint → ${res.status} (${contentType})`,
      detail: `Status: ${res.status}\nContent-Type: ${contentType}\nFirst 300 chars:\n${text.slice(0, 300)}`,
      contentType,
      url: "/api/nonexistent-endpoint",
    });
  } catch (e: any) {
    addEvent({
      type: "fetch-failed",
      message: `fetch() threw: ${e.message}`,
      detail: e.stack,
      url: "/api/nonexistent-endpoint",
    });
  }
}

/** Trigger all error scenarios in sequence. */
export function simulateRedeploy(addEvent: (e: Omit<LogEvent, "id" | "timestamp">) => void) {
  addEvent({
    type: "console-error",
    message: "Simulating redeploy... new chunk hashes generated, old URLs now return HTML",
    detail: "A new deployment renames all chunk files with new content hashes. Any cached HTML referencing old chunks will cause MIME type errors.",
  });

  triggerOldChunkLoad();
  setTimeout(() => triggerOldModuleImport(addEvent), 300);
  setTimeout(() => triggerFetchHtmlResponse(addEvent), 600);
}
