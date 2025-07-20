export default {
  fetch(request, env: Env) {
    const url = new URL(request.url);
    console.log(env);
    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
