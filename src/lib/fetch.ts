import Semaphore from "semaphore-promise";

export const fetchSemaphore = new Semaphore(6);

export async function fetchWithSemaphore(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const release = await fetchSemaphore.acquire();
  try {
    return await fetch(url, options);
  } finally {
    release();
  }
}
