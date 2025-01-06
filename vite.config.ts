import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",

      manifest: {
        name: "Läss",
        short_name: "Läss",
        description: "A platform for learning Svenska",
        theme_color: "#e5e7eb",
        orientation: "any",
        display: "standalone",
        icons: [
          {
            src: "apple-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "favicon.ico",
            sizes: "16x16 32x32 48x48 64x64 128x128 256x256",
          },
        ],
      },

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          flowbite: ["flowbite-react"],
          dexie: ["dexie"],
        },
      },
    },
  },
});
