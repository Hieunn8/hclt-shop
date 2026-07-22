import "server-only";
import { createClient, type RedisClientType } from "redis";

const DEFAULT_TTL_SECONDS = 300;
const OPERATION_TIMEOUT_MS = 1500;

let clientPromise: Promise<RedisClientType> | undefined;

function redisUrl(): string | undefined {
  const value = process.env.REDIS_URL?.trim();
  if (!value || /^<[^>]+>$/.test(value)) return undefined;
  return value;
}

function isEnabled(): boolean {
  return process.env.REDIS_CACHE_DISABLED !== "true" && Boolean(redisUrl());
}

function withTimeout<T>(operation: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), OPERATION_TIMEOUT_MS))
  ]);
}

async function getClient(): Promise<RedisClientType | undefined> {
  const url = redisUrl();
  if (!isEnabled() || !url) return undefined;

  if (!clientPromise) {
    clientPromise = createClient({ url })
      .on("error", (error) => {
        console.error(JSON.stringify({ level: "warn", event: "redis_cache_error", message: error instanceof Error ? error.message : "unknown" }));
      })
      .connect() as Promise<RedisClientType>;
  }

  try {
    return await withTimeout(clientPromise, undefined);
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "redis_cache_connect_failed", message: error instanceof Error ? error.message : "unknown" }));
    clientPromise = undefined;
    return undefined;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | undefined> {
  const client = await getClient();
  if (!client) return undefined;

  try {
    const value = await withTimeout(client.get(key), null);
    if (!value) return undefined;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "redis_cache_get_failed", key, message: error instanceof Error ? error.message : "unknown" }));
    return undefined;
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
  const client = await getClient();
  if (!client) return;

  try {
    await withTimeout(client.setEx(key, ttlSeconds, JSON.stringify(value)), undefined);
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "redis_cache_set_failed", key, message: error instanceof Error ? error.message : "unknown" }));
  }
}

export async function redisDeleteKeys(keys: string[]): Promise<void> {
  const uniqueKeys = [...new Set(keys)].filter(Boolean);
  if (!uniqueKeys.length) return;

  const client = await getClient();
  if (!client) return;

  try {
    await withTimeout(client.del(uniqueKeys), 0);
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "redis_cache_delete_failed", keys: uniqueKeys, message: error instanceof Error ? error.message : "unknown" }));
  }
}

export async function redisDeletePatterns(patterns: string[]): Promise<string[]> {
  const uniquePatterns = [...new Set(patterns)].filter(Boolean);
  if (!uniquePatterns.length) return [];

  const client = await getClient();
  if (!client) return [];

  const deletedKeys: string[] = [];
  try {
    for (const pattern of uniquePatterns) {
      for await (const keys of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        if (!keys.length) continue;
        deletedKeys.push(...keys);
        await withTimeout(client.del(keys), 0);
      }
    }
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", event: "redis_cache_pattern_delete_failed", patterns: uniquePatterns, message: error instanceof Error ? error.message : "unknown" }));
  }

  return deletedKeys;
}

export function redisKeysForTags(tags: string[]): string[] {
  const keys = new Set<string>();

  for (const tag of tags) {
    if (tag === "catalog" || tag === "products" || tag === "reviews" || tag === "hero-slides" || tag === "site-settings") {
      keys.add("catalog:v1");
      keys.add("catalog:v2");
    }

    if (tag.startsWith("product:")) {
      keys.add(`product-detail:v1:${tag.slice("product:".length)}`);
      keys.add(`product-detail:v2:${tag.slice("product:".length)}`);
    }

  }

  return [...keys];
}

export function redisPatternsForTags(tags: string[]): string[] {
  return tags.some((tag) => tag === "products" || tag === "reviews") ? ["product-detail:v1:*", "product-detail:v2:*"] : [];
}
