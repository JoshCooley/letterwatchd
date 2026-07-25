// Ignore case/punctuation so e.g. an en-dash matches a hyphen.
export function normalizeTitle(title) {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function titleYearKey(title, year) {
  return `${normalizeTitle(title)}|${String(year ?? "").trim().slice(0, 4)}`;
}
