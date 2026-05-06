import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";

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
export class ErrorBoundary extends React.Component<
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
