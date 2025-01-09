declare module "cloudflare:test" {
  interface ProvidedEnv extends CloudflareEnv {
    TEST_MIGRATIONS: D1Migration[];
  }
}
