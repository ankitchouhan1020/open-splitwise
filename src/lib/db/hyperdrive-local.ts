/** Wrangler local Hyperdrive uses a *.hyperdrive.local proxy that can fail to reach Postgres. */
export function isLocalHyperdriveProxy(connectionString: string): boolean {
  return connectionString.includes(".hyperdrive.local");
}
