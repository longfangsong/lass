import path from "node:path";
import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject(async () => {
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);
  const dataPath = path.join(__dirname, "data");
  migrations.push(...(await readD1Migrations(dataPath)));
  return {
    test: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/cypress/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "**/ui_tests/**",
      ],
      setupFiles: ["./test_utils/apply-migrations.ts"],
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.test.toml" },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
            d1Databases: {
              DB: "7fd21fa5-fb30-43aa-ab55-210fd5229b91",
            },
          },
        },
        experimentalJsonConfig: false,
      },
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
