const KEYS = { watched: "lw.watched", skip: "lw.skip", exclude: "lw.exclude" };

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (e) {
    return {};
  }
}

function save(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

export function getList(action) {
  return load(KEYS[action]);
}

export function seenIds() {
  return new Set([
    ...Object.keys(load(KEYS.watched)),
    ...Object.keys(load(KEYS.skip)),
  ]);
}

export function isWatched(tmdbID) {
  return String(tmdbID) in load(KEYS.watched);
}

export function record(action, film) {
  const key = KEYS[action];
  const obj = load(key);
  obj[film.tmdbID] = { title: film.title, year: film.year };
  save(key, obj);
}

export function unrecord(action, film) {
  const key = KEYS[action];
  const obj = load(key);
  delete obj[film.tmdbID];
  save(key, obj);
}

// Films already logged on Letterboxd (imported watched.csv), keyed by
// title+year. Shown in the lists and hidden from the deck, but not exported.
export function addExclusions(map) {
  const obj = load(KEYS.exclude);
  Object.assign(obj, map);
  save(KEYS.exclude, obj);
}

export function getExclusions() {
  return load(KEYS.exclude);
}

export function excludedKeys() {
  return new Set(Object.keys(load(KEYS.exclude)));
}

export function removeExclusion(key) {
  const obj = load(KEYS.exclude);
  delete obj[key];
  save(KEYS.exclude, obj);
}

export function clear() {
  localStorage.removeItem(KEYS.watched);
  localStorage.removeItem(KEYS.skip);
  localStorage.removeItem(KEYS.exclude);
}

export function isListsHidden() {
  return localStorage.getItem("lw.listsHidden") === "1";
}

export function setListsHidden(hidden) {
  localStorage.setItem("lw.listsHidden", hidden ? "1" : "0");
}
