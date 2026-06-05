import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type ResolvedDbConnection = {
  url: string;
  viaHyperdrive: boolean;
};

/** Hyperdrive binding on Workers, else DATABASE_URL (Railway/Docker/local). */
export function resolveDbConnection(): ResolvedDbConnection {
  try {
    const { env } = getCloudflareContext();
    const hyperdrive = env.HYPERDRIVE as Hyperdrive | undefined;
    if (hyperdrive?.connectionString) {
      return { url: hyperdrive.connectionString, viaHyperdrive: true };
    }
  } catch {
    // Not in a Cloudflare Workers request context.
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set and Hyperdrive binding is unavailable",
    );
  }
  return { url, viaHyperdrive: false };
}
