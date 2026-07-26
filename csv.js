import { parse, stringify } from "./vendor/csv.min.js";

export function parseCsv(text) {
  const rows = parse(text);
  const header = rows.shift() || [];
  return rows.map((cells) => {
    const obj = {};
    header.forEach((h, i) => (obj[h] = cells[i]));
    return obj;
  });
}

// format for Letterboxd's import, not this app's.
export function buildWatchedCsv(list) {
  const rows = [["tmdbID", "Title", "Year"]];
  for (const [id, film] of Object.entries(list)) {
    rows.push([id, film.title, film.year]);
  }
  return stringify(rows);
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
