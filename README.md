# 🍄 Spore Keeper

A cozy pixel idle game. Deep in the Everglow Forest, the Mother Mushroom has fallen
asleep and the light is fading. Play as **Mycel**, her last glowing spore, and gather
**Lumen Spores** to rekindle the grove — with the help of sleepy mushroom **Puffs**.

## Play

Open `index.html` through any static web server (or the deployed GitHub Pages URL).

- **Tap the grove** to gather spores; Mycel hops to where you tap
- **Buy Puffs** to gather spores automatically, even while you're away (offline progress, 8h cap)
- **10 upgrades** from Glowing Gloves to Mother's Blessing — reach the end in a few days of casual play
- Progress autosaves to your browser; use **Export/Import Save** to move between devices

## Project layout

Plain HTML/CSS/JS — no build step, no dependencies.

- `js/config.js` — every tuning number: upgrades, costs, story text
- `js/state.js` — game state, derived stats, save/load/offline progress
- `js/game.js` — main loop (time-delta based, works in throttled tabs)
- `js/ui.js` — DOM: counters, upgrade buttons, whispers, modals
- `js/grove.js` — canvas scene: Mycel, Puffs, fireflies, brightness stages
- `assets/mycel.png` — optional: drop in a character sprite to replace the built-in pixel art

## Deploy

Push to GitHub, enable Pages (main branch, root). Done.
