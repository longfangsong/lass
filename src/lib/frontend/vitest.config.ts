import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "frontend",
    include: ["./**/*.spec.ts"],
    environment: "happy-dom",
    setupFiles: ["vitest-localstorage-mock"],
    exclude: [
      "**/node_modules/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
    alias: {
      "@": path.resolve(__dirname, "../../../src"),
    },
  },
}); 