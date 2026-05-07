import { useEffect, useState } from "react";

type Status = { type: "idle" } | { type: "hash"; hash: string } | { type: "chunk-error"; error: string };

export function DeploymentCheck() {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [fetches, setFetches] = useState<{ hash: string; time: number }[]>([]);

  // Lazy import the hash module once on mount
  useEffect(() => {
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
    <div className="sticky top-0 z-50 w-full border-b-2 border-neutral-800 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Badge — always visible, shows lazy-loaded hash */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Deploy
          </span>
          {status.type === "idle" ? (
            <span className="text-[10px] font-mono text-neutral-400">loading...</span>
          ) : status.type === "hash" ? (
            <span className="text-sm font-mono font-bold text-green-700">
              {status.hash}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-red-600">
              CHUNK ERROR: {status.error}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Check button */}
        <button
          onClick={handleCheck}
          className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-800 bg-white hover:bg-neutral-800 hover:text-white active:translate-y-0.5 transition-colors shrink-0"
        >
          Re-check
        </button>
      </div>

      {/* Fetch history */}
      {fetches.length > 0 && (
        <div className="border-t border-neutral-200 bg-neutral-50">
          <div className="max-w-5xl mx-auto px-6 py-2 flex flex-wrap gap-x-4 gap-y-1">
            {fetches.map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-mono text-neutral-600"
              >
                [{i + 1}] {f.hash} @ {new Date(f.time).toLocaleTimeString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
