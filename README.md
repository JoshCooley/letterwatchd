# Letterwatchd

Swipe through films and mark the ones you've seen, then import them to Letterboxd.

Supports touch, mouse drags, and arrow keys. Right = watched, left = skip.

Runs entirely in the browser, no backend.

## Architecture

* Static site: Cloudflare Worker with static assets, auto-deployed on push to `main`
* API: TMDB proxied via a separate Worker on a `/api/*` route
  - Key stored in Cloudflare Secrets Store
  - Worker allowlists the five endpoints the app uses
* Deploy: Terraform for the proxy Worker and its route

## Setup

1. Get a free TMDB v3 API key from https://www.themoviedb.org/settings/api.
2. Create a Secrets Store and put the key in it:
   ```
   npx wrangler secrets-store store create letterwatchd --remote
   npx wrangler secrets-store secret create <STORE_ID> \
     --name tmdb-api-key --scopes workers --remote
   ```
3. Deploy:
   ```
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   # fill in account_id, secrets_store_id
   export CLOUDFLARE_API_TOKEN=...
   terraform -chdir=terraform init
   terraform -chdir=terraform apply
   ```

The API token needs `Workers Scripts:Edit`, `Workers Routes:Edit`, and
`Secrets Store:Edit`. Edit rather than Read on the last one, because binding a
secret to a Worker counts as a write against the secret.

## Usage

1. **Import** (optional): upload your Letterboxd `watched.csv`, or the whole export
   `.zip`, to hide films you've already logged. Get it at
   https://letterboxd.com/user/exportdata/. Matching is by title + year.
2. Pick a **source** at the top: Popular (the default), Trending, Top Rated,
   Now Playing, or **By Genre** (which adds genre and sort menus).
3. **Swipe** the card, use the **Skip** / **Watch** buttons, or the
   **left / right arrow keys**. **Back** (or Backspace) steps to the previous film.
4. Review or remove entries in the **Watched** and **Skipped** lists (collapse
   either to tidy up). **Reset** clears everything saved.
5. **Export** downloads `letterwatchd-watched.csv` (`tmdbID,Title,Year`). Import it
   at https://letterboxd.com/import/ as watched films; the tmdbID makes matches
   exact.

Your progress is saved in the browser's localStorage.

## Credits

- Film data and images from [TMDB](https://www.themoviedb.org/) (not endorsed or
  certified by TMDB).
- Eye icon from [Font Awesome Free](https://fontawesome.com), CC BY 4.0.
- Bundled libraries under `vendor/`: [fflate](https://github.com/101arrowz/fflate)
  and [@vanillaes/csv](https://github.com/vanillaes/csv), both MIT.
