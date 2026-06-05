interface Hyperdrive {
  connectionString: string;
}

interface CloudflareEnv {
  HYPERDRIVE: Hyperdrive;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  DEPLOY_TARGET?: string;
}
