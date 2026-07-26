# Letterwatchd

Swipe through films and mark the ones you've seen, then import them to Letterboxd.

Supports touch, mouse drags, and arrow keys. Right = watched, left = skip.

Runs entirely in the browser, no backend.

## Setup

1. Get a free TMDB v3 API key from https://www.themoviedb.org/settings/api.
2. Copy the config template and paste your key:
   ```
   cp config.example.js config.js
   ```
   Then set `TMDB_API_KEY` in `config.js`.
3. Serve the folder over HTTP (ES modules don't load from `file://`):
   ```
   python3 -m http.server 8000
   ```
   Open http://localhost:8000.

`config.js` is gitignored so your key stays out of the repo.

## Usage

1. **Import** (optional): upload your Letterboxd `watched.csv`, or the whole export
   `.zip`, to hide films you've already logged. Get it at
   https://letterboxd.com/user/exportdata/. Matching is by title + year.
2. **Swipe** the card, use the **Skip** / **Watch** buttons, or the
   **left / right arrow keys**. **Back** (or Backspace) steps to the previous film.
3. Review or remove entries in the **Watched** and **Skipped** lists (collapse
   either to tidy up). **Reset** clears everything saved.
4. **Export** downloads `letterwatchd-watched.csv` (`tmdbID,Title,Year`). Import it
   at https://letterboxd.com/import/ as watched films; the tmdbID makes matches
   exact.

Your progress is saved in the browser's localStorage.

## Credits

- Film data and images from [TMDB](https://www.themoviedb.org/) (not endorsed or
  certified by TMDB).
- Eye icon from [Font Awesome Free](https://fontawesome.com), CC BY 4.0.
- Bundled libraries under `vendor/`: [fflate](https://github.com/101arrowz/fflate)
  and [@vanillaes/csv](https://github.com/vanillaes/csv), both MIT.
