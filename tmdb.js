import { TMDB_API_KEY } from "./config.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

const LIST_PATHS = {
  popular: "/movie/popular",
  trending: "/trending/movie/week",
  top_rated: "/movie/top_rated",
  now_playing: "/movie/now_playing",
};

const GENRES = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, "TV Movie": 10770, Thriller: 53, War: 10752, Western: 37,
};

const SORTS = {
  Popularity: "popularity.desc",
  Rating: "vote_average.desc",
  Newest: "primary_release_date.desc",
};

export const GENRE_NAMES = Object.keys(GENRES);
export const SORT_NAMES = Object.keys(SORTS);

export function mapMovie(m) {
  return {
    tmdbID: m.id,
    title: m.title,
    year: (m.release_date || "").slice(0, 4),
    poster: m.poster_path ? IMG + m.poster_path : "",
  };
}

export async function fetchFilms(source, page = 1) {
  let url;
  if (source.list === "genre") {
    url = `${BASE}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${GENRES[source.genre]}&sort_by=${SORTS[source.sort]}`;
    if (source.sort === "Rating") url += "&vote_count.gte=200";
  } else {
    url = `${BASE}${LIST_PATHS[source.list]}?api_key=${TMDB_API_KEY}&page=${page}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  return data.results.map(mapMovie);
}
