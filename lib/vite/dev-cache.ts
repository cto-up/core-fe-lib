import type { Connect, Plugin } from "vite";
import type { ServerResponse } from "node:http";

const REVALIDATE = "no-cache";

/**
 * Vite's dev server serves pre-bundled dependencies as
 * `max-age=31536000,immutable`, keyed by a `?v=` hash. When that hash does
 * not change but the bundle does (re-optimised cache, worktrees sharing
 * node_modules), the browser keeps running the stale copy and never asks
 * again. This rewrites that header to `no-cache`: the browser revalidates,
 * Vite answers 304 from its etag, so it stays cheap. Dev server only.
 */
export function noImmutableDevCache(): Plugin {
  return {
    name: "core-fe-lib:no-immutable-dev-cache",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(revalidateImmutable);
    },
  };
}

export const revalidateImmutable: Connect.NextHandleFunction = (
  _req,
  res: ServerResponse,
  next
) => {
  const setHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) =>
    name.toLowerCase() === "cache-control" &&
    String(value).includes("immutable")
      ? setHeader(name, REVALIDATE)
      : setHeader(name, value);
  next();
};
