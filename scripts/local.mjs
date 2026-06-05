import { spawn, spawnSync } from "child_process";
import { existsSync } from "fs";
import { createConnection } from "net";
import { resolve } from "path";

await import("./load-env.mjs");

const root = process.cwd();
const envLocal = resolve(root, ".env.local");

if (!existsSync(envLocal)) {
  console.error("Missing .env.local — copy .env.example and fill in values.");
  process.exit(1);
}

function parseDatabaseHost(url) {
  try {
    const u = new URL(url.replace(/^postgresql:/, "postgres:"));
    return {
      host: u.hostname || "127.0.0.1",
      port: Number(u.port || 5432),
    };
  } catch {
    return { host: "127.0.0.1", port: 5432 };
  }
}

function canConnect(host, port, timeoutMs = 1000) {
  return new Promise((resolveConnect) => {
    const socket = createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolveConnect(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function waitForPostgres(host, port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await canConnect(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required in .env.local");
  process.exit(1);
}

const { host, port } = parseDatabaseHost(databaseUrl);

if (!(await canConnect(host, port))) {
  console.log("Postgres not reachable — starting Docker postgres…");
  const docker = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (docker.status !== 0) {
    console.error(
      "Postgres is not running and Docker is unavailable.\n" +
        "Start Postgres or fix DATABASE_URL in .env.local.",
    );
    process.exit(1);
  }
  const up = spawnSync(
    "docker",
    ["compose", "--env-file", ".env.local", "up", "postgres", "-d"],
    { stdio: "inherit", cwd: root },
  );
  if (up.status !== 0) process.exit(up.status ?? 1);
  if (!(await waitForPostgres(host, port))) {
    console.error(`Postgres did not become ready at ${host}:${port}`);
    process.exit(1);
  }
  console.log("Postgres is ready.");
} else {
  console.log("Postgres is already running.");
}

const migrate = spawnSync("node", ["scripts/migrate.mjs"], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

console.log("Starting dev server at http://localhost:3000 …");
const dev = spawn("pnpm", ["dev"], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
dev.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => dev.kill(signal));
}
