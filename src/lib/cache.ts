import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sourceCache } from "@/lib/db/schema";

export interface Cached<T> {
  value: T;
  fetchedAt: Date;
  stale: boolean;
}

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<Cached<T>> {
  const db = await getDb();
  const [entry] = await db.select().from(sourceCache).where(eq(sourceCache.key, key)).limit(1);
  const isFresh = entry !== undefined && Date.now() - entry.fetchedAt.getTime() < ttlMs;

  if (entry && isFresh) return { value: entry.payload as T, fetchedAt: entry.fetchedAt, stale: false };

  try {
    return await writeCache(key, await load());
  } catch (error) {
    if (entry) return { value: entry.payload as T, fetchedAt: entry.fetchedAt, stale: true };
    throw error;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<Cached<T>> {
  const db = await getDb();
  const fetchedAt = new Date();
  await db
    .insert(sourceCache)
    .values({ key, payload: value, fetchedAt })
    .onConflictDoUpdate({ target: sourceCache.key, set: { payload: value, fetchedAt } });
  return { value, fetchedAt, stale: false };
}

export async function peekCache<T>(key: string): Promise<Cached<T> | undefined> {
  const db = await getDb();
  const [entry] = await db.select().from(sourceCache).where(eq(sourceCache.key, key)).limit(1);
  return entry && { value: entry.payload as T, fetchedAt: entry.fetchedAt, stale: false };
}
