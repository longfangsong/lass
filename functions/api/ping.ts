import { EventContext } from "@cloudflare/workers-types/experimental";

export function onRequest(_context: EventContext<unknown, string, unknown>) {
  return new Response("pong");
}
