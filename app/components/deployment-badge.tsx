import { useEffect, useState } from "react";

export function DeploymentBadge() {
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("virtual:deployment-hash")
      .then((mod) => {
        if (!cancelled) setHash(mod.DEPLOYMENT_HASH);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 border border-red-600 bg-red-50 text-red-600 font-mono z-50">
        CHUNK ERROR: {error}
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 border border-neutral-800 bg-white font-mono z-50">
      {hash ? `deploy: ${hash}` : "deploy: loading..."}
    </div>
  );
}
