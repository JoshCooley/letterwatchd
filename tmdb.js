import { TMDB_API_KEY } from "./config.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

export function mapMovie(m) {
  return {
    tmdbID: m.id,
    title: m.title,
    year: (m.release_date || "").slice(0, 4),
    poster: m.poster_path ? IMG + m.poster_path : "",
  };
}

export async function fetchPopular(page = 1) {
  const url = `${BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  return data.results.map(mapMovie);
}
