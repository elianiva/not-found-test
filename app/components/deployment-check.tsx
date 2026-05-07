import { useState } from "react";

export function DeploymentCheck() {
  const [result, setResult] = useState<{ hash: string } | { error: string } | null>(null);

  const handleClick = async () => {
    try {
      const mod = await import("virtual:deployment-hash");
      setResult({ hash: mod.DEPLOYMENT_HASH });
    } catch (e: any) {
      setResult({ error: e.message ?? String(e) });
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

      {result && (
        <div className="text-center">
          {"error" in result ? (
            <div className="px-6 py-3 border-2 border-red-600 bg-red-50 text-red-600 font-mono text-sm">
              CHUNK ERROR: {result.error}
            </div>
          ) : (
            <div className="px-6 py-3 border-2 border-green-700 bg-green-50 text-green-700 font-mono text-sm">
              deploy: {result.hash}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
