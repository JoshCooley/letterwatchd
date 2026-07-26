import { fetchPopular } from "./tmdb.js";
import { record, unrecord, isWatched, seenIds, clear, getList, addExclusions, excludedKeys, getExclusions, removeExclusion, isCollapsed, setCollapsed } from "./store.js";
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
const btnExport = document.getElementById("btn-export");
const btnImport = document.getElementById("btn-import");
const importInput = document.getElementById("import-input");
const listsEl = document.getElementById("lists");
const toast = document.getElementById("toast");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let pagesFetched = 0;

btnBack.addEventListener("click", back);
btnSkip.addEventListener("click", () => swipe.left());
btnWatched.addEventListener("click", () => swipe.right());
btnReset.addEventListener("click", reset);
btnExport.addEventListener("click", exportCsv);
btnImport.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  const file = importInput.files[0];
  if (file) importFile(file);
  importInput.value = "";
});

const swipe = enableSwipe(card, { peek: nextCard, onLeft: () => act("skip"), onRight: () => act("watched") });

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const el = document.activeElement;
  if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
  if (e.key === "ArrowRight") swipe.right();
  else if (e.key === "ArrowLeft") swipe.left();
  else if (e.key === "Backspace") { e.preventDefault(); back(); }
});

function paint(el, film) {
  const content = el.querySelector(".content");
  content.innerHTML = "";
  if (!film) return;
  if (film.poster) {
    const img = document.createElement("img");
    img.src = film.poster;
    img.alt = film.title;
    content.append(img);
  }
  const label = document.createElement("div");
  label.textContent = `${film.title} (${film.year})`;
  content.append(label);
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
    const have = new Set(films.map((f) => String(f.tmdbID)));
    films.push(...next.filter((f) => !have.has(String(f.tmdbID)) && !seen.has(String(f.tmdbID)) && !excluded.has(titleYearKey(f.title, f.year))));
  }
  render(films[index]);
  films.slice(index + 1, index + 1 + PRELOAD_AHEAD).forEach(preload);
}

async function refresh() {
  try {
    await show();
  } catch (e) {
    card.querySelector(".content").textContent = "Failed to load: " + e.message;
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
  if (!film) return;
  apply(action, film);
  console.info(result(action, film), film);
  refreshLists();
  index += 1;
  refresh();
}

function exportCsv() {
  downloadCsv("letterwatchd-watched.csv", buildWatchedCsv(getList("watched")));
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 4000);
}

async function importFile(file) {
  try {
    const text = file.name.toLowerCase().endsWith(".zip")
      ? extractFromZip(await file.arrayBuffer(), "watched.csv")
      : await file.text();
    const map = {};
    for (const r of parseCsv(text)) {
      const key = titleYearKey(r.Name, r.Year);
      if (key !== "|") map[key] = { title: r.Name, year: r.Year };
    }
    const count = Object.keys(map).length;
    if (!count) throw new Error("no films found (expected a Letterboxd watched.csv)");
    addExclusions(map);
    const excluded = excludedKeys();
    films = films.filter((f, i) => i <= index || !excluded.has(titleYearKey(f.title, f.year)));
    refresh();
    refreshLists();
    showToast(`Imported ${count} film${count === 1 ? "" : "s"} to hide.`);
  } catch (e) {
    showToast("Import failed: " + e.message);
  }
}

function refreshLists() {
  renderLists();
}

function renderLists() {
  listsEl.innerHTML = "";
  const watched = getList("watched");
  const watchedKeys = new Set(Object.values(watched).map((f) => titleYearKey(f.title, f.year)));
  const watchedEntries = Object.entries(watched).map(([id, film]) => {
    const key = titleYearKey(film.title, film.year);
    return { film, remove: () => { unrecord("watched", { tmdbID: id }); removeExclusion(key); } };
  });
  const exclusionEntries = Object.entries(getExclusions())
    .filter(([key]) => !watchedKeys.has(key))
    .map(([key, film]) => ({ film, remove: () => removeExclusion(key) }));
  renderSection("watched", "Watched", [...watchedEntries, ...exclusionEntries]);
  renderSection("skip", "Skipped", listEntries(getList("skip"), (id) => unrecord("skip", { tmdbID: id })));
}

function listEntries(map, remove) {
  return Object.entries(map).map(([id, film]) => ({ film, remove: () => remove(id) }));
}

function renderSection(key, title, items) {
  const header = document.createElement("div");
  header.className = "list-header";
  const heading = document.createElement("h2");
  heading.textContent = `${title} (${items.length})`;
  if (!items.length) heading.classList.add("empty");
  header.append(heading);

  const collapsed = isCollapsed(key);
  const ul = document.createElement("ul");
  ul.hidden = collapsed;
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

  if (items.length) {
    const toggle = document.createElement("button");
    toggle.className = "collapse-toggle";
    toggle.textContent = collapsed ? "expand" : "collapse";
    toggle.addEventListener("click", () => {
      setCollapsed(key, !collapsed);
      renderLists();
    });
    header.append(toggle);
  }

  listsEl.append(header, ul);
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

renderLists();
refresh();
