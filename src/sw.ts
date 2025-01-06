/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkOnly, CacheFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

// let allowlist: RegExp[] | undefined;
// in dev mode, we disable precaching to avoid caching issues
// if (import.meta.env.DEV) allowlist = [/^\/$/];

// Cache static assets like fonts and images
registerRoute(
  ({ request }) =>
    request.destination === "font" || request.destination === "image",
  new CacheFirst()
);

registerRoute(/\/api\//, new NetworkOnly());
registerRoute(/\/auth\//, new NetworkOnly());
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/\/api\//, /\/auth\//],
  })
);

self.skipWaiting();
clientsClaim();
