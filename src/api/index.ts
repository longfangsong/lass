import { Router } from "@api/router";
import { getById as getWordById, search } from "@api/words";

const router = new Router();

router
  .get("/api/ping", () => {
    return Response.json({
      message: "pong",
    });
  })
  .get("/api/words/:id", getWordById)
  .get("/api/words", search);

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
