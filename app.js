import { fetchPopular } from "./tmdb.js";
import { record } from "./store.js";

const card = document.getElementById("card");
const btnBack = document.getElementById("btn-back");
const btnSkip = document.getElementById("btn-skip");
const btnWatched = document.getElementById("btn-watched");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let pagesFetched = 0;

btnBack.addEventListener("click", back);
btnSkip.addEventListener("click", () => act("skip"));
btnWatched.addEventListener("click", () => act("watched"));

function render(film) {
  if (!film) { card.textContent = "No films."; return; }
  card.innerHTML = "";
  const img = document.createElement("img");
  img.src = film.poster;
  img.alt = film.title;
  img.width = 150;
  const label = document.createElement("div");
  label.textContent = `${film.title} (${film.year})`;
  card.append(img, label);
}

function preload(film) {
  if (film && film.poster) new Image().src = film.poster;
}

async function show() {
  while (index >= films.length) {
    pagesFetched += 1;
    const next = await fetchPopular(pagesFetched);
    if (!next.length) break;
    films.push(...next);
  }
  render(films[index]);
  films.slice(index + 1, index + 1 + PRELOAD_AHEAD).forEach(preload);
}

async function act(action) {
  const film = films[index];
  if (film) {
    console.info(action, film);
    record(action, film);
  }
  index += 1;
  try {
    await show();
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

function back() {
  if (index === 0) return;
  index -= 1;
  render(films[index]);
}

async function start() {
  try {
    await show();
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

start();
