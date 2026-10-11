# Omnitek website

Static site for Omnitek (solar, security, communications, IT), Harare.

## Layout

- `src/pages/` one file per page; front-matter comment at the top sets title, description and the current nav item
- `src/partials/` shared nav, footer, CTA band and icon sprite
- `tools/build.py` assembles pages into `public/`
- `public/` the deployed site (Render publishes this folder); `styles.css`, `main.js` and `assets/` live here

## Editing

Edit files in `src/`, then run:

```
python tools/build.py
```

Commit both `src/` and `public/`. Pushing to `main` redeploys on Render.

## Before launch

The photos in `public/assets/img/` are iStock preview comps and carry watermarks. License them and overwrite the files with the same names.

Fonts are self-hosted under SIL OFL (licences in `public/assets/fonts/`).
