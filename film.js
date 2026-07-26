// Ignore case/punctuation so e.g. an en-dash matches a hyphen.
export function normalizeTitle(title) {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function titleYearKey(title, year) {
  return `${normalizeTitle(title)}|${String(year ?? "").trim().slice(0, 4)}`;
}
