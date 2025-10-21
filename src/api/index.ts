import { Router } from "@api/router";
import { getById as getWordById, search } from "@api/words";
import { get as login } from "./auth/login";
import { get as authCallback } from "./auth/callback";
import { get as session } from "./auth/session";
import { get as logout } from "./auth/logout";
import { get as oneWaySync } from "./sync";
import { post as twoWaySync } from "./sync";
import { getByWordId, updateLexeme } from "./lexemes";
import { get as getSettings, del as deleteSettings } from "./settings";
import { get as getWordBookEntry, del as deleteWordBookEntry } from "./word_book_entry";
const router = new Router();

router
  .get("/api/auth/logout", logout)
  .get("/api/auth/session", session)
  .get("/api/auth/login/:provider", login)
  .get("/api/auth/callback/:provider", authCallback)
  .get("/api/words/:id", getWordById)
  .get("/api/lexemes", getByWordId)
  .patch("/api/lexemes/:lexeme_id", updateLexeme)
  .get("/api/words", search)
  .get("/api/sync/:table", oneWaySync)
  .post("/api/sync/:table", twoWaySync)
  .get("/api/settings", getSettings)
  .delete("/api/settings", deleteSettings)
  .get("/api/word_book_entry", getWordBookEntry)
  .delete("/api/word_book_entry", deleteWordBookEntry)
  .get("/api/ping", () => {
    return new Response("pong");
  });

export default {
  fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
