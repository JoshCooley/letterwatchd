function field(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildWatchedCsv(list) {
  const rows = [["tmdbID", "Title", "Year"]];
  for (const [id, film] of Object.entries(list)) {
    rows.push([id, film.title, film.year]);
  }
  return rows.map((r) => r.map(field).join(",")).join("\n");
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
