# Draft Night

A pass-and-play **$20 auction draft** party game, inspired by the Sidemen "$20 Draft" videos.
One phone, one auctioneer, everyone shouting bids. Build the best team for the money, then vote on the winner.

**Play:** https://sad-cpu141.github.io/draft-night/

## Game modes
- **Solo:** you against 1–7 bots (3 by default) on Easy, Medium or Hard. Each bot has a personality that really changes how it bids — Big Spender, Bargain Hunter, Position Strategist or Chaos — plus a funny name and optional trash talk. Items sell when the bid clock runs out; bots vote at the end and never for themselves.
- **Local:** one phone, one auctioneer, everyone shouting bids (pass the phone to vote).
- **Online:** coming in a later update.
- **Teams:** 2v2, 3v3, 4v4 or up to 4 teams of 1–4 players, in Local or Solo. Each team shares one budget, one roster and its Chaos Cards; everyone votes, never for their own team.

## Twists (all switchable in House rules)
- **Chaos Cards** (2 per team by default): Steal, Swap, Freeze, Double Bid, Veto. Exact rules are at the top of `src/28-twists.js`.
- **Mystery items** (1 in 8 by default): auctioned face down, fit any open slot, revealed when sold.
- **Rarity** (70% Common / 25% Rare / 5% Legendary by default): looks only, fixed for the whole draft.
- **Nomination mode**: teams take turns choosing the next item.
- **Trade window** (3 minutes by default): 1-for-1 trades with optional money; the other team must accept.

## Sound
- **Auctioneer voice** (browser speech, no downloads): calls items, bids, bidding wars, “going once… twice…”, SOLD, mystery and Legendary reveals, trades and the winner. Speed (slow/normal/fast/hype), voice choice and volume. It only follows the game; it never decides anything.
- **Sound effects** (generated in the browser, so they're original): gavel, crowd cheer, buzzer, drumroll, bid blips, card sparkle, trade chime, fanfare.
- **Background music**: an original generated loop, OFF by default, ducks under the voice.
- **Master mute**: the 🔊 button on every game screen, and in Settings.

## Sharing & stats
- **Share a topic**: a link that carries the whole topic (after the `#`, so nothing is uploaded), a long share code, or a `.dntopic.json` file for big topics. The short `DN-XXXXXX` code is a fingerprint to check copies match — a static site can't look topics up by a short code without a server.
- **Players & stats**: profiles built from finished drafts on this device (games, wins, team wins, win rate, money spent, favourite picks, best bargain, biggest overpay, best win, awards). Bargains/overpays compare a price with that item's average sale price across your saved drafts (needs 2+ sales).
- **Awards** each game, with a reason: Best Bargain, Biggest Overpay, Big Spender, Penny Pincher, Most Robbed, Chaos Agent, Trade Master, Mystery Master, Legend Hunter, Unluckiest Manager. **Hall of Shame** (can be hidden).
- **Pictures**: winner card, full results, or awards & standings, as PNG to download or share.

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
- `src/28-twists.js` holds the rules for cards, mystery items, rarity, teams, nomination and trades, as plain functions.
- `src/29-audio.js` is the voice, sound effects and music; `src/29-stats.js` is sharing, stats and awards.
- `src/27-bots.js` is the bot brain: pure functions that read the draft and return a bid, a delay or a vote.
- `src/25-wiki-titles.js` holds the exact Wikipedia page names and which topics show photos.
- `sw.js` is versioned on every build, so phones pick up new versions automatically.

## Credits
Photos are loaded from Wikipedia / Wikimedia Commons (free-licensed lead images only). Each photo links to its article, where the author and licence are listed. React and html2canvas are included under their MIT licences in `vendor/`.
