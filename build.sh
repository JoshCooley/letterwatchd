#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail
cd "$(dirname "$0")"

dist="dist"
rm --recursive --force "$dist"
mkdir --parents "$dist/vendor"

files=(
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

if [ -f config.js ]; then
  cp config.js "$dist/"
else
  echo "warning: config.js not found; copy config.example.js to config.js and add your TMDB key"
fi

echo "built $dist/"
