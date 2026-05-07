import { useEffect, useState } from "react";

type Status = { type: "idle" } | { type: "hash"; hash: string } | { type: "chunk-error"; error: string };

export function DeploymentCheck() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [fetches, setFetches] = useState<{ hash: string; time: number }[]>([]);

  useEffect(() => {
    // Set a unique visitor cookie if missing (used for version affinity via Transform Rule)
    if (!document.cookie.includes("_vid=")) {
      const id = crypto.randomUUID();
      document.cookie = `_vid=${id}; Path=/; Max-Age=86400; SameSite=Lax`;
    }

    let cancelled = false;
    import("virtual:deployment-hash")
      .then((mod) => {
        if (!cancelled) setStatus({ type: "hash", hash: mod.DEPLOYMENT_HASH });
      })
      .catch((e: Error) => {
        if (!cancelled) setStatus({ type: "chunk-error", error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheck = async () => {
    try {
      const res = await fetch(`/deploy-check?t=${Date.now()}`);
      if (!res.ok) {
        setFetches((prev) => [
          ...prev,
          { hash: `HTTP ${res.status}`, time: Date.now() },
        ]);
        return;
      }
      const body = (await res.json()) as { hash: string; time: number };
      setFetches((prev) => [...prev, body]);
    } catch (e: any) {
      setFetches((prev) => [
        ...prev,
        { hash: `ERR: ${e.message}`, time: Date.now() },
      ]);
    }
  };

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
            className="px-5 py-2 text-xs font-bold uppercase tracking-widest border-2 border-neutral-800 bg-white hover:bg-neutral-800 hover:text-white active:translate-y-0.5 transition-colors"
          >
            Re-check
          </button>
        </div>

        {/* Fetch history — rows */}
        {fetches.length > 0 && (
          <div className="space-y-1">
            {fetches.map((f, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-[11px] font-mono text-neutral-400 w-6 text-right">
                  {i + 1}
                </span>
                {f.hash.startsWith("HTTP") || f.hash.startsWith("ERR") ? (
                  <span className="text-base font-mono text-red-600">
                    {f.hash}
                  </span>
                ) : (
                  <>
                    <span className="text-xl font-mono font-bold tracking-tight text-green-700">
                      {f.hash}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      @ {new Date(f.time).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
