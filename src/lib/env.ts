import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("file:./data/research.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  SHUTTERSTOCK_CLIENT_ID: z.string().optional(),
  SHUTTERSTOCK_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GEMINI_FALLBACK_MODELS: z
    .string()
    .default("")
    .transform((raw) => raw.replace(/[[\]"']/g, "").split(",").map((model) => model.trim()).filter(Boolean)),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN || undefined,
  SHUTTERSTOCK_CLIENT_ID: process.env.SHUTTERSTOCK_CLIENT_ID || undefined,
  SHUTTERSTOCK_CLIENT_SECRET: process.env.SHUTTERSTOCK_CLIENT_SECRET || undefined,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
  GEMINI_MODEL: process.env.GEMINI_MODEL || undefined,
  GEMINI_FALLBACK_MODELS: process.env.GEMINI_FALLBACK_MODELS || undefined,
});
