import { useState } from "react";

type DeployCheckResult =
  | { status: "fetched"; hash: string; time: number }
  | { status: "error"; error: string };

export function DeploymentCheck() {
  const [results, setResults] = useState<DeployCheckResult[]>([]);

  const handleClick = async () => {
    try {
      const res = await fetch(`/deploy-check?t=${Date.now()}`);
      if (!res.ok) {
        setResults((prev) => [
          ...prev,
          { status: "error" as const, error: `${res.status} ${res.statusText}` },
        ]);
        return;
      }
      const body = (await res.json()) as { hash: string; time: number };
      setResults((prev) => [
        ...prev,
        { status: "fetched" as const, hash: body.hash, time: body.time },
      ]);
    } catch (e: any) {
      setResults((prev) => [
        ...prev,
        { status: "error" as const, error: e.message ?? String(e) },
      ]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <button
        onClick={handleClick}
        className="px-12 py-4 text-lg font-bold uppercase tracking-widest border-2 border-neutral-800 bg-white hover:bg-neutral-800 hover:text-white active:translate-y-0.5 transition-colors"
      >
        Check Deployment
      </button>

      {results.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-md">
          {results.map((r, i) =>
            r.status === "error" ? (
              <div
                key={i}
                className="px-4 py-2 border-2 border-red-600 bg-red-50 text-red-600 font-mono text-xs"
              >
                [{i + 1}] ERROR: {r.error}
              </div>
            ) : (
              <div
                key={i}
                className="px-4 py-2 border-2 border-green-700 bg-green-50 text-green-700 font-mono text-xs"
              >
                [{i + 1}] deploy: {r.hash} @{" "}
                {new Date(r.time).toLocaleTimeString()}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
