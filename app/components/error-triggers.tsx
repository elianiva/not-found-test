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

export function useGlobalErrorCapture() {
  const { addEvent } = useErrorLog();

  useEffect(() => {
    const onError = (e: Event) => {
      const target = e.target as HTMLScriptElement;
      addEvent({
        type: "script-load",
        message: e.type === "error"
          ? `Script load failed: "${target?.src?.split("/").pop() || "unknown"}"`
          : "Script load error",
        detail: `URL: ${target?.src || "unknown"}`,
        url: target?.src,
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

const TYPE_STYLES: Record<ErrorEvent["type"], { label: string; textColor: string; bg: string }> = {
  "script-load": { label: "SCRIPT LOAD", textColor: "text-red-600", bg: "bg-red-50" },
  "import-failed": { label: "IMPORT FAILED", textColor: "text-red-600", bg: "bg-red-50" },
  "fetch-failed": { label: "FETCH FAILED", textColor: "text-red-600", bg: "bg-red-50" },
  hydration: { label: "HYDRATION", textColor: "text-red-600", bg: "bg-red-50" },
  render: { label: "RENDER ERROR", textColor: "text-red-600", bg: "bg-red-50" },
  "console-error": { label: "INFO", textColor: "text-gray-500", bg: "bg-gray-50" },
};

export function ErrorLogPanel({ events, onClear }: { events: ErrorEvent[]; onClear: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-black">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black bg-gray-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
        >
          <span>{collapsed ? "\u25b6" : "\u25bc"}</span>
          Error Log
          {events.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] border border-black bg-white">
              {events.length}
            </span>
          )}
        </button>
        <button
          onClick={onClear}
          className="text-[10px] uppercase tracking-wide text-gray-500 hover:text-black border-b border-transparent hover:border-black"
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

export function triggerOldChunkLoad(addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void) {
  const hash = Math.random().toString(36).slice(2, 10);
  const src = `/assets/old-chunk-${hash}.js`;

  const script = document.createElement("script");
  script.src = src;
  script.onerror = () => {
    addEvent({
      type: "script-load",
      message: `"text/html" is not a valid JavaScript MIME type`,
      detail: `Failed to load: ${src}\nCloudflare returns index.html (text/html) for missing assets when not_found_handling is "single-page-application".`,
      url: src,
    });
  };
  document.head.appendChild(script);
}

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

export function simulateRedeploy(addEvent: (e: Omit<ErrorEvent, "id" | "timestamp">) => void) {
  addEvent({
    type: "console-error",
    message: "Simulating redeploy... new chunk hashes generated, old URLs now return HTML",
    detail: "A new deployment renames all chunk files with new content hashes. Any cached HTML referencing old chunks will cause MIME type errors.",
  });

  triggerOldChunkLoad(addEvent);
  setTimeout(() => triggerOldModuleImport(addEvent), 300);
  setTimeout(() => triggerFetchHtmlResponse(addEvent), 600);
}
