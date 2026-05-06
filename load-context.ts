declare module "@react-router/dev/vite/cloudflare" {
  interface AppLoadContext extends ReturnType<typeof getLoadContext> {}
}

export function getLoadContext({ context }: { request: Request; context: any }) {
  return context;
}
