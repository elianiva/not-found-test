import { useState, useEffect } from "react";

export function HydrationMismatch() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="rounded border border-red-500/30 bg-red-500/5 p-4">
      <p className="font-mono text-sm text-red-400 mb-2">
        ⚠ Hydration Mismatch Zone
      </p>
      <p className="text-sm text-gray-400">
        Server rendered: <span className="text-white font-mono">"Server: static"</span>
      </p>
      <p className="text-sm text-gray-400">
        Client rendered:{" "}
        <span className="text-white font-mono">
          "Client: {isClient ? Math.random().toString(36).slice(2, 8) : "loading..."}"
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-2">
        React expects server and client renders to match. When they diverge,
        you get Minified React error #418 during hydration.
      </p>
    </div>
  );
}
