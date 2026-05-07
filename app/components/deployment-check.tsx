import { useCallback, useEffect, useRef, useState } from "react";

type Status = { type: "idle" } | { type: "hash"; hash: string } | { type: "chunk-error"; error: string };

export function DeploymentCheck() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const chunkUrlRef = useRef<string | null>(null);
  const [history, setHistory] = useState<Status[]>([]);

  useEffect(() => {
    // Set a unique visitor cookie if missing (for version affinity via Transform Rule)
    if (!document.cookie.includes("_vid=")) {
      const id = crypto.randomUUID();
      document.cookie = `_vid=${id}; Path=/; Max-Age=86400; SameSite=Lax`;
    }

    let cancelled = false;
    import("virtual:deployment-hash")
      .then((mod) => {
        if (cancelled) return;
        chunkUrlRef.current = mod.getChunkUrl();
        setStatus({ type: "hash", hash: mod.DEPLOYMENT_HASH });
      })
      .catch((e: Error) => {
        if (!cancelled) setStatus({ type: "chunk-error", error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheck = useCallback(async () => {
    const url = chunkUrlRef.current;
    if (!url) return;

    try {
      const mod = await import(/* @vite-ignore */ `${url}?v=${Date.now()}`);
      setHistory((prev) => [...prev, { type: "hash", hash: mod.DEPLOYMENT_HASH }]);
    } catch (e: any) {
      setHistory((prev) => [
        ...prev,
        { type: "chunk-error", error: e.message ?? String(e) },
      ]);
    }
  }, []);

  return (
    <div className="border-b-2 border-neutral-800 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Top row: badge + button */}
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Deploy
            </span>
            {status.type === "idle" ? (
              <span className="text-base font-mono text-neutral-400">loading...</span>
            ) : status.type === "hash" ? (
              <span className="text-2xl font-mono font-bold tracking-tight text-green-700">
                {status.hash}
              </span>
            ) : (
              <span className="text-base font-mono text-red-600">
                CHUNK ERROR: {status.error}
              </span>
            )}
          </div>

          <button
            onClick={handleCheck}
            disabled={!chunkUrlRef.current}
            className="px-5 py-2 text-xs font-bold uppercase tracking-widest border-2 border-neutral-800 bg-white hover:bg-neutral-800 hover:text-white active:translate-y-0.5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Re-check
          </button>
        </div>

        {/* History — rows */}
        {history.length > 0 && (
          <div className="space-y-1">
            {history.map((r, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-[11px] font-mono text-neutral-400 w-6 text-right shrink-0">
                  {i + 1}
                </span>
                {r.type === "chunk-error" ? (
                  <span className="text-base font-mono text-red-600">
                    CHUNK ERROR: {r.error}
                  </span>
                ) : (
                  <span className="text-xl font-mono font-bold tracking-tight text-green-700">
                    {r.hash}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
