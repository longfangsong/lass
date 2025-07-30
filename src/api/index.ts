import { Router } from "@api/router";
import { getById as getWordById, search } from "@api/words";
import { get as login } from "./auth/login";
import { get as authCallback } from "./auth/callback";
import { get as session } from "./auth/session";
import { get as logout } from "./auth/logout";

const router = new Router();

router
  .get("/api/auth/logout", logout)
  .get("/api/auth/session", session)
  .get("/api/auth/:provider/login", login)
  .get("/api/auth/:provider/callback", authCallback)
  .get("/api/words/:id", getWordById)
  .get("/api/words", search)
  .get("/api/ping", () => {
    return new Response("pong");
  });

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
