import { useState, useEffect } from "react";

export function HydrationMismatch() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="border-2 border-black p-4 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-3">
        &#x26a0; Hydration Mismatch Zone
      </p>
      <div className="text-xs space-y-1">
        <p>
          Server: <span className="font-bold">"Server: static"</span>
        </p>
        <p>
          Client:{" "}
          <span className="font-bold">
            "Client: {isClient ? Math.random().toString(36).slice(2, 8) : "loading..."}"
          </span>
        </p>
      </div>
      <p className="text-[10px] text-gray-500 mt-3">
        React expects server and client renders to match. When they diverge,
        you get Minified React error #418 during hydration.
      </p>
    </div>
  );
}
