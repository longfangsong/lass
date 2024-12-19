import { getRequestContext } from "@cloudflare/next-on-pages";
import Semaphore from "semaphore-promise";

export const dbSemaphore = new Semaphore(6);

export async function getDB(): Promise<[() => void, D1Database]> {
  return [await dbSemaphore.acquire(), getRequestContext().env.DB];
}
