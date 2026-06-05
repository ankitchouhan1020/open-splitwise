export async function register() {
  const { assertProductionEnv } = await import("@/lib/security/production");
  assertProductionEnv();
}
