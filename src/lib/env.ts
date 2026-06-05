import { z } from "zod";

const trimmedUrl = z.string().trim().url();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SESSION_SECRET: z
      .string()
      .trim()
      .min(32, "SESSION_SECRET must be at least 32 chars"),
    SPLITWISE_CLIENT_ID: z.string().trim().min(1),
    SPLITWISE_CLIENT_SECRET: z.string().trim().min(1),
    SPLITWISE_REDIRECT_URI: trimmedUrl.optional(),
    /** Server-only public app URL (runtime; preferred over NEXT_PUBLIC_APP_URL on deploy). */
    APP_URL: trimmedUrl.optional(),
    NEXT_PUBLIC_APP_URL: trimmedUrl.optional(),
  })
  .refine(
    (data) =>
      Boolean(data.SPLITWISE_REDIRECT_URI) ||
      Boolean(data.APP_URL) ||
      Boolean(data.NEXT_PUBLIC_APP_URL),
    {
      message:
        "Set SPLITWISE_REDIRECT_URI, or APP_URL, or NEXT_PUBLIC_APP_URL for OAuth callback URL",
      path: ["SPLITWISE_REDIRECT_URI"],
    },
  );

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}

/** Returns env or null when OAuth is not configured (settings page can explain). */
export function getEnvOptional(): Env | null {
  const parsed = envSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
