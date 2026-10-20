# Palantir website

The public product website for Palantir.

**Website:** https://corax32.github.io/palantir-z/

This repository contains only the website and its deployment workflow. The Palantir application's source is maintained separately in a private repository. The browser-only menu replica follows Palantir's Lua UI structure; its controls change the browser preview and do not connect to the game.

## Editing

Edit the static files in `website/`. There are no dependencies or build step. Check JavaScript with:

```sh
node --check website/app.js
node --check website/palantir-controls.js
node --check website/palantir-preview.js
```

Changes to `website/` on `main` deploy through GitHub Actions. Only `website/` is uploaded to GitHub Pages. In repository settings, the Pages source must be GitHub Actions.

## Fonts

The bundled Lexend fonts are licensed under the SIL Open Font License 1.1. See `website/assets/LEXEND-LICENSE.txt` for the copyright notice and license.
