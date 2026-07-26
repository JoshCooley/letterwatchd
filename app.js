import { fetchPopular } from "./tmdb.js";
import { record, unrecord, isWatched, seenIds, clear, getList, addExclusions, excludedKeys, getExclusions, removeExclusion, isListsHidden, setListsHidden } from "./store.js";
import { buildWatchedCsv, downloadCsv, parseCsv } from "./csv.js";
import { titleYearKey } from "./film.js";
import { extractFromZip } from "./zip.js";
import { enableSwipe } from "./swipe.js";

const card = document.getElementById("card");
const nextCard = document.getElementById("next");
const btnBack = document.getElementById("btn-back");
const btnSkip = document.getElementById("btn-skip");
const btnWatched = document.getElementById("btn-watched");
const btnReset = document.getElementById("btn-reset");
const btnLists = document.getElementById("btn-lists");
const btnExport = document.getElementById("btn-export");
const btnImport = document.getElementById("btn-import");
const importInput = document.getElementById("import-input");
const listsEl = document.getElementById("lists");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let pagesFetched = 0;

btnBack.addEventListener("click", back);
btnSkip.addEventListener("click", () => swipe.left());
btnWatched.addEventListener("click", () => swipe.right());
btnReset.addEventListener("click", reset);
btnLists.addEventListener("click", toggleLists);
btnExport.addEventListener("click", exportCsv);
btnImport.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  const file = importInput.files[0];
  if (file) importFile(file);
  importInput.value = "";
});

const swipe = enableSwipe(card, { peek: nextCard, onLeft: () => act("skip"), onRight: () => act("watched") });

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") swipe.right();
  else if (e.key === "ArrowLeft") swipe.left();
  else if (e.key === "Backspace") { e.preventDefault(); back(); }
});

function paint(el, film) {
  const content = el.querySelector(".content");
  content.innerHTML = "";
  if (!film) return;
  const img = document.createElement("img");
  img.src = film.poster;
  img.alt = film.title;
  const label = document.createElement("div");
  label.textContent = `${film.title} (${film.year})`;
  content.append(img, label);
}

function render(film) {
  btnWatched.querySelector(".label").textContent = film && isWatched(film.tmdbID) ? "Unwatch" : "Watch";
  if (film) paint(card, film);
  else card.querySelector(".content").textContent = "No films.";
  paint(nextCard, films[index + 1]);
  nextCard.style.transition = "none";
  nextCard.style.opacity = "0";
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
    const excluded = excludedKeys();
    films.push(...next.filter((f) => !seen.has(String(f.tmdbID)) && !excluded.has(titleYearKey(f.title, f.year))));
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

function exportCsv() {
  downloadCsv("letterwatchd-watched.csv", buildWatchedCsv(getList("watched")));
}

async function importFile(file) {
  const text = file.name.toLowerCase().endsWith(".zip")
    ? extractFromZip(await file.arrayBuffer(), "watched.csv")
    : await file.text();
  const map = {};
  for (const r of parseCsv(text)) {
    const key = titleYearKey(r.Name, r.Year);
    if (key !== "|") map[key] = { title: r.Name, year: r.Year };
  }
  addExclusions(map);
  const excluded = excludedKeys();
  films = films.filter((f, i) => i <= index || !excluded.has(titleYearKey(f.title, f.year)));
  refresh();
  refreshLists();
}

function toggleLists() {
  listsEl.hidden = !listsEl.hidden;
  setListsHidden(listsEl.hidden);
  btnLists.textContent = listsEl.hidden ? "Show Lists" : "Hide Lists";
  if (!listsEl.hidden) renderLists();
}

function applyListsVisibility() {
  listsEl.hidden = isListsHidden();
  btnLists.textContent = listsEl.hidden ? "Show Lists" : "Hide Lists";
}

function refreshLists() {
  if (!listsEl.hidden) renderLists();
}

function renderLists() {
  listsEl.innerHTML = "";
  renderSection("Watched", [
    ...listEntries(getList("watched"), (id) => unrecord("watched", { tmdbID: id })),
    ...listEntries(getExclusions(), (key) => removeExclusion(key)),
  ]);
  renderSection("Skipped", listEntries(getList("skip"), (id) => unrecord("skip", { tmdbID: id })));
}

function listEntries(map, remove) {
  return Object.entries(map).map(([id, film]) => ({ film, remove: () => remove(id) }));
}

function renderSection(title, items) {
  const heading = document.createElement("h2");
  heading.textContent = `${title} (${items.length})`;
  if (!items.length) heading.classList.add("empty");
  const ul = document.createElement("ul");
  for (const { film, remove } of items) {
    const li = document.createElement("li");
    li.textContent = `${film.title} (${film.year}) `;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      remove();
      renderLists();
      render(films[index]);
    });
    li.append(btn);
    ul.append(li);
  }
  listsEl.append(heading, ul);
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

applyListsVisibility();
renderLists();
refresh();
