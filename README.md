# Director website

The public product website for Director.

**Website:** https://corax32.github.io/director-site/

This repository contains only the website and its deployment workflow. The Director application's source is maintained separately in a private repository. The interface preview on this website is illustrative and does not connect to the game.

## Editing

Edit the static files in `website/`. There are no dependencies or build step. Check JavaScript with `node --check website/app.js`.

Changes to `website/` on `main` deploy through GitHub Actions. Only `website/` is uploaded to GitHub Pages. In repository settings, the Pages source must be GitHub Actions.
