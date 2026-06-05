/** Client-safe check — does not import postgres or Cloudflare bindings. */
export function isDatabaseConfigured(): boolean {
  return (
    Boolean(process.env.DATABASE_URL) ||
    process.env.DEPLOY_TARGET === "cloudflare"
  );
}
