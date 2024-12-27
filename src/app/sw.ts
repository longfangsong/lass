import type {
  PrecacheEntry,
  RouteHandlerCallbackOptions,
  SerwistGlobalConfig,
} from "serwist";
import {
  CacheFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /\/api\/.*/i,
      handler: new NetworkOnly(),
    },
    {
      matcher: /^https:\/\/lyssna-cdn\.sr\.se\/.*/i,
      handler: new CacheFirst(),
    },
    {
      matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot|otf)$/i,
      handler: new CacheFirst(),
    },
    {
      matcher: /\.(?:webmanifest)$/i,
      handler: new StaleWhileRevalidate(),
    },
    {
      matcher: /\.(?:css)$/i,
      handler: new StaleWhileRevalidate(),
    },
    {
      matcher: /\.(?:css)\?v=(.*)$/i,
      handler: async (options: RouteHandlerCallbackOptions) => {
        const cache = await caches.open("customized-cache");
        const { request, event } = options;
        const url = new URL(request.url.replace(/\?v=.*$/, ""), location.href);
        const response = await cache.match(url);
        const fetchTask = (async () => {
          const result = await fetch(request.url.replace(/\?v=.*$/, ""));
          if (result.ok) {
            await cache.put(url, result);
          }
          return result;
        })();
        event.waitUntil(fetchTask);
        if (response) {
          return response;
        } else {
          return await fetchTask;
        }
      },
    },
    {
      matcher: /\.(?:js)$/i,
      handler: new StaleWhileRevalidate(),
    },
    {
      matcher: /\.(?:js)\?v=(.*)$/i,
      handler: async (options: RouteHandlerCallbackOptions) => {
        const cache = await caches.open("customized-cache");
        const { request, event } = options;
        const url = new URL(request.url.replace(/\?v=.*$/, ""), location.href);
        const response = await cache.match(url);
        const fetchTask = (async () => {
          const result = await fetch(request.url.replace(/\?v=.*$/, ""));
          if (result.ok) {
            await cache.put(url, result);
          }
          return result;
        })();
        event.waitUntil(fetchTask);
        if (response) {
          return response;
        } else {
          return await fetchTask;
        }
      },
    },
    {
      matcher: /\/_next\/static\/chunks\/.*/i,
      handler: new StaleWhileRevalidate(),
    },
    {
      matcher: /dictionary-init/i,
      handler: new NetworkOnly(),
    },
    {
      matcher: /.*/i,
      handler: new StaleWhileRevalidate(),
    },
  ],
});

serwist.addToPrecacheList([
  { url: "/", revision: null },
  { url: "/articles", revision: null },
  { url: "/dictionary", revision: null },
  { url: "/word_book", revision: null },
]);

serwist.addEventListeners();
