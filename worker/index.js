const UPSTREAM = "https://api.themoviedb.org/3";

const ALLOWED_PATHS = new Set([
  "/movie/popular",
  "/movie/top_rated",
  "/movie/now_playing",
  "/trending/movie/week",
  "/discover/movie",
]);

const ALLOWED_PARAMS = ["page", "with_genres", "sort_by", "vote_count.gte"];

const BROWSER_SECONDS = 3600;
const EDGE_SECONDS = 21600;

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname.slice("/api".length);
    if (!ALLOWED_PATHS.has(path)) return json({ error: "not found" }, 404);

    const params = new URLSearchParams();
    for (const key of ALLOWED_PARAMS) {
      const value = url.searchParams.get(key);
      if (value !== null) params.set(key, value);
    }
    params.sort();

    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}/api${path}?${params}`, { method: "GET" });

    const hit = await cache.match(cacheKey);
    if (hit) {
      const res = new Response(hit.body, hit);
      res.headers.set("x-proxy-cache", "HIT");
      return res;
    }

    const upstream = new URL(UPSTREAM + path);
    for (const [key, value] of params) upstream.searchParams.set(key, value);
    upstream.searchParams.set("api_key", await env.TMDB_API_KEY.get());

    const res = await fetch(upstream, { headers: { accept: "application/json" } });
    if (!res.ok) return json({ error: "upstream error" }, res.status);

    const body = await res.arrayBuffer();
    const headers = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${BROWSER_SECONDS}, s-maxage=${EDGE_SECONDS}`,
      "x-content-type-options": "nosniff",
    };

    ctx.waitUntil(cache.put(cacheKey, new Response(body, { status: 200, headers })));

    return new Response(body, {
      status: 200,
      headers: { ...headers, "x-proxy-cache": "MISS" },
    });
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
