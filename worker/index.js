const UPSTREAM = "https://api.themoviedb.org/3";

const ALLOWED_PATHS = new Set([
  "/movie/popular",
  "/movie/top_rated",
  "/movie/now_playing",
  "/trending/movie/week",
  "/discover/movie",
]);

const ALLOWED_PARAMS = new Set(["page", "with_genres", "sort_by", "vote_count.gte"]);

const CACHE_SECONDS = 600;

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

    const url = new URL(request.url);
    const path = url.pathname.slice("/api".length);
    if (!ALLOWED_PATHS.has(path)) return json({ error: "not found" }, 404);

    const upstream = new URL(UPSTREAM + path);
    for (const [key, value] of url.searchParams) {
      if (ALLOWED_PARAMS.has(key)) upstream.searchParams.set(key, value);
    }
    upstream.searchParams.set("api_key", await env.TMDB_API_KEY.get());

    const res = await fetch(upstream, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    });

    if (!res.ok) return json({ error: "upstream error" }, res.status);

    return new Response(res.body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${CACHE_SECONDS}`,
        "x-content-type-options": "nosniff",
      },
    });
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
