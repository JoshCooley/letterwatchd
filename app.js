import { fetchPopular } from "./tmdb.js";

const card = document.getElementById("card");
const btnSkip = document.getElementById("btn-skip");
const btnWatched = document.getElementById("btn-watched");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let page = 0;

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

async function showNext() {
  if (index >= films.length) {
    page += 1;
    films = await fetchPopular(page);
    index = 0;
  }
  render(films[index]);
  films.slice(index + 1, index + 1 + PRELOAD_AHEAD).forEach(preload);
}

async function act(action) {
  const film = films[index];
  if (film) console.info(action, film);
  index += 1;
  try {
    await showNext();
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

async function start() {
  try {
    await showNext();
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

start();
