import { fetchFilms, GENRE_NAMES, SORT_NAMES } from "./tmdb.js";
import { record, unrecord, isWatched, seenIds, clear, getList, addExclusions, excludedKeys, getExclusions, removeExclusion, isCollapsed, setCollapsed, getSource, setSource } from "./store.js";
import { buildWatchedCsv, downloadCsv, parseCsv } from "./csv.js";
import { titleYearKey, normalizeTitle } from "./film.js";
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
const listSelect = document.getElementById("list");
const genreSelect = document.getElementById("genre");
const sortSelect = document.getElementById("sort");

const PRELOAD_AHEAD = 3;

let films = [];
let index = 0;
let pagesFetched = 0;
let source = getSource();
let generation = 0;
let loading = false;

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

for (const g of GENRE_NAMES) genreSelect.append(new Option(g, g));
for (const s of SORT_NAMES) sortSelect.append(new Option(s, s));
listSelect.value = source.list;
genreSelect.value = source.genre;
sortSelect.value = source.sort;
// a stored source the selects reject (stale build, hand-edited) falls back to the default option.
if (!listSelect.value) listSelect.selectedIndex = 0;
if (!genreSelect.value) genreSelect.selectedIndex = 0;
if (!sortSelect.value) sortSelect.selectedIndex = 0;
source = readSource();
// Continue if storage is blocked (e.g. private mode)
try {
  setSource(source);
} catch (e) {
  if (!(e instanceof DOMException)) throw e;
}
updateSourceControls();
listSelect.addEventListener("change", changeSource);
genreSelect.addEventListener("change", changeSource);
sortSelect.addEventListener("change", changeSource);

const swipe = enableSwipe(card, { peek: nextCard, onLeft: () => act("skip"), onRight: () => act("watched"), canSwipe: () => !!films[index] });

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const el = document.activeElement;
  if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
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
  const gen = generation;
  while (index >= films.length) {
    if (loading) return;
    loading = true;
    const page = pagesFetched + 1;
    let next;
    try {
      next = await fetchFilms(source, page);
    } finally {
      // a stale fetch must not clear the current generation's flag.
      if (gen === generation) loading = false;
    }
    if (gen !== generation) return;
    pagesFetched = page; // advance only on success, so a failed fetch retries the page.
    if (!next.length) break;
    // read fresh each page so a new import still applies.
    const seen = seenIds();
    const excluded = excludedKeys();
    const have = new Set(films.map((f) => String(f.tmdbID)));
    films.push(...next.filter((f) => !have.has(String(f.tmdbID)) && !seen.has(String(f.tmdbID)) && !excluded.has(titleYearKey(f.title, f.year))));
  }
  render(films[index]);
  films.slice(index + 1, index + 1 + PRELOAD_AHEAD).forEach(preload);
}

function updateSourceControls() {
  const byGenre = source.list === "genre";
  genreSelect.hidden = !byGenre;
  sortSelect.hidden = !byGenre;
}

function readSource() {
  return { list: listSelect.value, genre: genreSelect.value, sort: sortSelect.value };
}

function changeSource() {
  source = readSource();
  setSource(source);
  updateSourceControls();
  films = [];
  index = 0;
  pagesFetched = 0;
  generation += 1;
  loading = false;
  refresh();
}

async function refresh() {
  const gen = generation;
  try {
    await show();
  } catch (e) {
    if (gen !== generation) return;
    card.querySelector(".content").textContent = "Failed to load: " + e.message;
  }
}

function apply(action, film) {
  const watched = isWatched(film.tmdbID);
  if (action === "skip") {
    // skip leaves an already-watched film watched; unwatch via the Watch button. by design.
    if (!watched) record("skip", film);
  } else if (watched) {
    unrecord("watched", film);
  } else {
    record("watched", film);
    unrecord("skip", film);
  }
}

// labels the per-action console log below. intentional.
function result(action, film) {
  if (action === "skip") return "skipped";
  return isWatched(film.tmdbID) ? "watched" : "unwatched";
}

function act(action) {
  const film = films[index];
  if (!film) return;
  try {
    apply(action, film);
  } catch (e) {
    if (!(e instanceof DOMException)) throw e;
    showToast("Couldn't save (storage may be full).");
    return;
  }
  console.info(result(action, film), film);
  renderLists();
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
      if (!normalizeTitle(r.Name)) continue;
      map[titleYearKey(r.Name, r.Year)] = { title: r.Name, year: r.Year };
    }
    const count = Object.keys(map).length;
    if (!count) throw new Error("no films found (expected a Letterboxd watched.csv)");
    addExclusions(map);
    const excluded = excludedKeys();
    // keep the current and previous films; drop later ones the import now hides.
    films = films.filter((f, i) => i <= index || !excluded.has(titleYearKey(f.title, f.year)));
    refresh();
    renderLists();
    showToast(`Imported ${count} film${count === 1 ? "" : "s"} to hide.`);
  } catch (e) {
    showToast("Import failed: " + e.message);
  }
}

// full rebuild each call; simple over incremental, cheap at realistic list sizes. intentional.
function renderLists() {
  listsEl.innerHTML = "";
  const watched = getList("watched");
  const watchedKeys = new Set(Object.values(watched).map((f) => titleYearKey(f.title, f.year)));
  const watchedEntries = Object.entries(watched).map(([id, film]) => {
    const key = titleYearKey(film.title, film.year);
    // a same title+year import shares this key, so we can't tell them apart. accepted.
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
      // removes from storage; the film comes back to the deck only after a page refresh.
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
  // deck stays as-is; a page refresh rebuilds it.
  render(films[index]);
  renderLists();
}

function back() {
  if (index === 0) return;
  index -= 1;
  refresh();
}

renderLists();
refresh();
