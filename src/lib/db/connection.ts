import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isLocalHyperdriveProxy } from "@/lib/db/hyperdrive-local";

export type ResolvedDbConnection = {
  url: string;
  viaHyperdrive: boolean;
};

export { isLocalHyperdriveProxy } from "@/lib/db/hyperdrive-local";

/** Hyperdrive binding on Workers, else DATABASE_URL (Railway/Docker/local). */
export function resolveDbConnection(): ResolvedDbConnection {
  const directUrl = process.env.DATABASE_URL?.trim();

  try {
    const { env } = getCloudflareContext();
    const hyperdrive = env.HYPERDRIVE as Hyperdrive | undefined;
    const hyperdriveUrl = hyperdrive?.connectionString?.trim();
    if (hyperdriveUrl) {
      // Local `pnpm cf:preview`: prefer direct Postgres from .dev.vars over the proxy.
      if (directUrl && isLocalHyperdriveProxy(hyperdriveUrl)) {
        return { url: directUrl, viaHyperdrive: false };
      }
      return { url: hyperdriveUrl, viaHyperdrive: true };
    }
  } catch {
    // Not in a Cloudflare Workers request context.
  }

  if (directUrl) {
    return { url: directUrl, viaHyperdrive: false };
  }

  throw new Error(
    "DATABASE_URL is not set and Hyperdrive binding is unavailable",
  );
}
