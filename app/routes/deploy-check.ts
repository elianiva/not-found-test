import { DEPLOYMENT_HASH } from "virtual:deployment-hash";

export const loader = () => {
  return new Response(JSON.stringify({ hash: DEPLOYMENT_HASH, time: Date.now() }), {
    headers: { "Content-Type": "application/json" },
  });
};
