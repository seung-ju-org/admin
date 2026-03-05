import { createClient, type RedisClientType } from "redis";

declare global {
  var redisClient: RedisClientType | undefined;
  var redisConnectPromise: Promise<RedisClientType> | undefined;
}

function buildRedisUrl() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ?? "6379";
  const password = process.env.REDIS_PASSWORD;
  const db = process.env.REDIS_DB;

  if (!host) {
    throw new Error("REDIS_HOST or REDIS_URL is required");
  }

  const url = new URL(`redis://${host}:${port}`);
  if (password) {
    url.password = password;
  }
  if (db) {
    url.pathname = `/${db}`;
  }

  return url.toString();
}

export async function getRedisClient() {
  if (!global.redisClient) {
    global.redisClient = createClient({
      url: buildRedisUrl(),
    });
  }

  if (global.redisClient.isOpen) {
    return global.redisClient;
  }

  if (!global.redisConnectPromise) {
    global.redisConnectPromise = global.redisClient.connect().then(() => global.redisClient as RedisClientType);
  }

  try {
    return await global.redisConnectPromise;
  } finally {
    global.redisConnectPromise = undefined;
  }
}
