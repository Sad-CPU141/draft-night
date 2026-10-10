# Draft Night

A pass-and-play **$20 auction draft** party game, inspired by the Sidemen "$20 Draft" videos.
One phone, one auctioneer, everyone shouting bids. Build the best team for the money, then vote on the winner.

**Play:** https://sad-cpu141.github.io/draft-night/

## Game modes
- **Solo:** you against 1–7 bots (3 by default) on Easy, Medium or Hard. Each bot has a personality that really changes how it bids — Big Spender, Bargain Hunter, Position Strategist or Chaos — plus a funny name and optional trash talk. Items sell when the bid clock runs out; bots vote at the end and never for themselves.
- **Local:** one phone, one auctioneer, everyone shouting bids (pass the phone to vote).
- **Online:** coming in a later update.

## Features
- 48 starter topics in 7 folders (Sports, Food & Drink, Entertainment, Travel & Places, Animals, Style & Rides, Just for Fun), plus your own topics.
- Real photos from Wikipedia for people, places, food, animals and more, with jerseys or emoji as a fallback. Upload your own photo or paste an image link for any item.
- Bid timer, "must fill your team" rule, undo, free picks in snake order, secret voting, vote tally and an all-time wins leaderboard.
- Save results as a PNG (download or share), backup and restore to a file, and install to the home screen.
- Works offline after the first visit (photos need internet).

## Install on a phone
- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** open the site in Chrome → ⋮ menu → **Install app**.

## Your data
Everything is stored on your device (IndexedDB). Nothing is uploaded. Use **Backup & app settings → Export backup** to move topics, photos and drafts to another phone, then **Import backup** there.

## Development
The site is plain static files, so GitHub Pages serves it straight from the `main` branch.

```
npm install      # Babel (build) and jsdom (tests)
npm run build    # compiles src/ into app.js, styles.css, index.html, sw.js
npm test         # rules, photo lookups, full click-through, backup, persistence
```

- Edit files in `src/`, then run the build. Don't edit `app.js` directly.
- `src/27-bots.js` is the bot brain: pure functions that read the draft and return a bid, a delay or a vote.
- `src/25-wiki-titles.js` holds the exact Wikipedia page names and which topics show photos.
- `sw.js` is versioned on every build, so phones pick up new versions automatically.

## Credits
Photos are loaded from Wikipedia / Wikimedia Commons (free-licensed lead images only). Each photo links to its article, where the author and licence are listed. React and html2canvas are included under their MIT licences in `vendor/`.
