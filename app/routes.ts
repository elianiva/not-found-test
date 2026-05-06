import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("showcase/broken", "routes/showcase.broken.tsx"),
  route("showcase/fixed", "routes/showcase.fixed.tsx"),
  route("showcase/advanced", "routes/showcase.advanced.tsx"),
] satisfies RouteConfig;
