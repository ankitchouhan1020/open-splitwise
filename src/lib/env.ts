import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 chars"),
  SPLITWISE_CLIENT_ID: z.string().min(1),
  SPLITWISE_CLIENT_SECRET: z.string().min(1),
  SPLITWISE_REDIRECT_URI: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  cached = parsed.data;
  return parsed.data;
}

/** Returns env or null when OAuth is not configured (settings page can explain). */
export function getEnvOptional(): Env | null {
  const parsed = envSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
