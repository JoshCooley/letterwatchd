import { fetchPopular } from "./tmdb.js";
import { record, unrecord, isWatched, seenIds, clear, getList } from "./store.js";

const card = document.getElementById("card");
const btnBack = document.getElementById("btn-back");
const btnSkip = document.getElementById("btn-skip");
const btnWatched = document.getElementById("btn-watched");
const btnReset = document.getElementById("btn-reset");
const btnLists = document.getElementById("btn-lists");
const listsEl = document.getElementById("lists");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let pagesFetched = 0;

btnBack.addEventListener("click", back);
btnSkip.addEventListener("click", () => act("skip"));
btnWatched.addEventListener("click", () => act("watched"));
btnReset.addEventListener("click", reset);
btnLists.addEventListener("click", toggleLists);

function render(film) {
  const watched = film && isWatched(film.tmdbID);
  btnWatched.textContent = watched ? "Mark Unwatched" : "Mark Watched";
  if (!film) {
    card.textContent = "No films.";
    return;
  }
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
    const seen = seenIds();
    films.push(...next.filter((f) => !seen.has(String(f.tmdbID))));
  }
  render(films[index]);
  films.slice(index + 1, index + 1 + PRELOAD_AHEAD).forEach(preload);
}

async function refresh() {
  try {
    await show();
  } catch (e) {
    card.textContent = "Failed to load: " + e.message;
  }
}

function apply(action, film) {
  const watched = isWatched(film.tmdbID);
  if (action === "skip") {
    if (!watched) record("skip", film);
  } else if (watched) {
    unrecord("watched", film);
  } else {
    record("watched", film);
    unrecord("skip", film);
  }
}

function result(action, film) {
  if (action === "skip") return "skipped";
  return isWatched(film.tmdbID) ? "watched" : "unwatched";
}

function act(action) {
  const film = films[index];
  if (film) {
    apply(action, film);
    console.info(result(action, film), film);
    refreshLists();
  }
  index += 1;
  refresh();
}

function toggleLists() {
  listsEl.hidden = !listsEl.hidden;
  if (!listsEl.hidden) renderLists();
}

function refreshLists() {
  if (!listsEl.hidden) renderLists();
}

function renderLists() {
  listsEl.innerHTML = "";
  for (const action of ["watched", "skip"]) {
    const heading = document.createElement("h2");
    heading.textContent = action === "watched" ? "Watched" : "Skipped";
    const ul = document.createElement("ul");
    for (const [id, film] of Object.entries(getList(action))) {
      const li = document.createElement("li");
      li.textContent = `${film.title} (${film.year}) `;
      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        unrecord(action, { tmdbID: id });
        renderLists();
        render(films[index]);
      });
      li.append(remove);
      ul.append(li);
    }
    listsEl.append(heading, ul);
  }
}

function reset() {
  if (!confirm("Reset all saved skips and watched films?")) return;
  clear();
  render(films[index]);
  refreshLists();
}

function back() {
  if (index === 0) return;
  index -= 1;
  refresh();
}

refresh();
