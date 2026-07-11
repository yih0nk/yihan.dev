import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export async function getSiteViews(): Promise<number> {
  return (await redis.get<number>("views:site")) ?? 0;
}

export async function incrementSiteViews(): Promise<number> {
  return await redis.incr("views:site");
}

export async function getPostViews(slug: string): Promise<number> {
  return (await redis.get<number>(`views:blog:${slug}`)) ?? 0;
}

export async function incrementPostViews(slug: string): Promise<number> {
  return await redis.incr(`views:blog:${slug}`);
}
