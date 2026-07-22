import { fetchPopular } from "./tmdb.js";

const card = document.getElementById("card");
const btnSkip = document.getElementById("btn-skip");
const btnWatched = document.getElementById("btn-watched");

let current = null;

btnSkip.addEventListener("click", () => console.info("skip", current));
btnWatched.addEventListener("click", () => console.info("watched", current));

function render(film) {
  current = film;
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

async function start() {
  try {
    const films = await fetchPopular(1);
    render(films[0]);
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

start();
