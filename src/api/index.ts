import { Router } from "./router";
import { get } from "./words/words";

const router = new Router();

router.get("/api/words/:id", get).get("/api/*", () => {
  return Response.json({
    name: "Cloudflare",
  });
});

export default {
  fetch(request, env: Env, ctx: ExecutionContext) {
    return router.handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
