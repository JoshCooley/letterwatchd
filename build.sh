#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail
cd "$(dirname "$0")"

dist="dist"
rm -rf "$dist"
mkdir -p "$dist/vendor"

files=(
  _headers
  index.html
  styles.css
  tmdb-logo.svg
  favicon.svg
  app.js
  tmdb.js
  csv.js
  film.js
  store.js
  swipe.js
  zip.js
)

for f in "${files[@]}"; do
  cp "$f" "$dist/"
done

cp vendor/* "$dist/vendor/"

echo "built $dist/"
