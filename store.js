const KEYS = { watched: "lw.watched", skip: "lw.skip" };

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

export function seenIds() {
  return new Set([
    ...Object.keys(load(KEYS.watched)),
    ...Object.keys(load(KEYS.skip)),
  ]);
}

export function record(action, film) {
  const key = KEYS[action];
  const obj = load(key);
  obj[film.tmdbID] = { title: film.title, year: film.year };
  save(key, obj);
}
