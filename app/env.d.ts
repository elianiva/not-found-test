declare module "virtual:deployment-hash" {
  export const DEPLOYMENT_HASH: string;
  export function getChunkUrl(): string;
}
