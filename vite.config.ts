import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      base: "/",
      registerType: "autoUpdate",
      workbox: {
        navigateFallbackDenylist: [/\/api\/.*/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkOnly",
          },
        ],
        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,jpeg,svg,otf,eot,ttf,woff,woff2}",
        ],
      },
      manifest: {
        name: "Läss",
        short_name: "Läss",
        description: "A platform for learning Svenska",
        theme_color: "#ffffff",
        orientation: "any",
        display: "standalone",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        // There's no point developing offline features during development.
        // The service worker will try to load things like main.tsx and fail.
        // And nothing will work.
        // Use `pnpm run preview` to test the PWA in "semi-deployment" mode instead.
        enabled: false,
      },
    }),
    visualizer({ open: true }) as unknown as PluginOption,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          utils: ["dexie", "date-fns", "remeda"],
          dataDisplay: ["recharts", "@tanstack/react-table"],
        },
      },
    },
  },
});
