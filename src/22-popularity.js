/* ============================================================
   CURATED TOPIC POPULARITY — a fixed editorial ranking, NOT usage stats.
   Nothing here changes when people pick, favourite, pin or play a topic.

   Each built-in topic has a score from 0 to 100, judged on:
   · Broad appeal: would most groups of friends know and care about it?
   · Recognisable items: can everyone picture most of the choices?
   · Debate value: does it spark arguments ("Messi or Ronaldo?")?
   · Draft fit: enough strong choices for a fun auction, not one obvious winner.
   Rough bands: 90+ instant crowd-pleasers · 80s strong all-rounders ·
   70s great for the right group · 60s niche but fun · 50s specialist.
   Popular: sorted by score (ties by name). Inside a folder, the same order.
   To add a topic later: compare it with neighbours in its band and give it a
   score that places it where it belongs (never 100 by default).
   Topics without a score (your own or imported ones) come after ranked ones.
   ============================================================ */
const POPULARITY = {
  // Sports
  't-cf': 99, 't-goat': 96, 't-pl': 92, 't-nba': 93, 't-nbal': 88, 't-ucl': 89, 't-club': 86, 't-intl': 85, 't-wonder': 80,
  't-goals': 82, 't-moments': 81, 't-rivals': 78, 't-mgr': 72, 't-plclubs': 79, 't-stadia': 70, 't-kits': 68, 't-wfoot': 71,
  't-nbagreat': 74, 't-nbateams': 73, 't-f1': 83, 't-fight': 84, 't-wwe': 80, 't-nfl': 77, 't-nhl': 69, 't-ten': 72,
  't-oly': 75, 't-crk': 66, 't-golf': 60, 't-mlb': 62, 't-mlbl': 63, 't-rugby': 58,
  // Food & Drink
  't-ff': 97, 't-ffchains': 95, 't-snk': 92, 't-dess': 88, 't-pizza': 90, 't-chocbars': 89, 't-crisps': 86, 't-bfast': 84,
  't-drink': 83, 't-icecream': 85, 't-cereal': 82, 't-street': 81, 't-dish': 80, 't-japanese': 78, 't-italian': 79,
  't-mexican': 77, 't-korean': 74, 't-indian': 76, 't-chinese': 75, 't-mideast': 73, 't-saudi': 68, 't-turkish': 70,
  't-coffee': 74, 't-boba': 72, 't-sauces': 76, 't-bakery': 71, 't-noodles': 73, 't-fruit': 69, 't-cheese': 64,
  // Entertainment
  't-game': 98, 't-rap': 94, 't-heroes': 91, 't-singers': 90, 't-anime': 89, 't-animechars': 87, 't-franchise': 88,
  't-tvshows': 87, 't-actors': 86, 't-youtubers': 85, 't-toon': 86, 't-anim': 84, 't-villains': 83, 't-gamechars': 85,
  't-pokemon': 84, 't-sitcoms': 80, 't-actresses': 79, 't-disney': 81, 't-pixar': 80, 't-streamers': 78, 't-app': 82,
  't-bands': 77, 't-consoles': 79, 't-horror': 74, 't-scifi': 72, 't-streaming': 70,
  // Travel & Places
  't-trav': 87, 't-ctry': 86, 't-landmarks': 80, 't-themeparks': 78, 't-islands': 74, 't-beaches': 73, 't-capitals': 72,
  't-europe': 73, 't-asia': 70, 't-nacities': 71, 't-mecities': 69, 't-wonders': 72, 't-africa': 64, 't-states': 66,
  't-canada': 65, 't-saudicities': 63, 't-airports': 58, 't-mountains': 61, 't-natparks': 62, 't-ski': 57, 't-lakes': 56,
  't-deserts': 55, 't-rivers': 54,
  // Animals
  't-ani': 90, 't-pet': 84, 't-dinos': 85, 't-cute': 82, 't-cats': 80, 't-sharks': 79, 't-dogbreeds': 81, 't-safari': 76,
  't-catbreeds': 72, 't-snakes': 70, 't-deepsea': 71, 't-raptors': 68, 't-extinct': 69, 't-whales': 66, 't-reptiles': 64,
  't-arctic': 63, 't-aussie': 65, 't-primates': 62, 't-prehistmammals': 64, 't-parrots': 60, 't-insects': 58, 't-farm': 61,
  // Style & Rides
  't-shoe': 94, 't-car': 91, 't-supercars': 86, 't-hypercars': 84, 't-carbrands': 83, 't-luxbrands': 82, 't-jdm': 80,
  't-streetwear': 81, 't-watches': 76, 't-luxcars': 78, 't-bballshoes': 77, 't-fragrance': 74, 't-motorbikes': 70,
  't-classics': 71, 't-evs': 66, 't-suvs': 67, 't-pickups': 62, 't-hairstyles': 69, 't-bags': 65, 't-outerwear': 63, 't-sunglasses': 59,
  // Just for Fun
  't-pow': 96, 't-zomb': 90, 't-island': 87, 't-redflags': 91, 't-myth': 85, 't-house': 86, 't-outfit': 85, 't-backyard': 80, 't-job': 82, 't-greenflags': 83,
  't-worstpowers': 86, 't-powercombos': 85, 't-worldslive': 84, 't-worldsavoid': 80, 't-annoying': 81, 't-satisfying': 79,
  't-board': 78, 't-toys': 77, 't-emoji': 76, 't-spend1000': 79, 't-spend100': 77, 't-3am': 78, 't-business': 74,
  't-shouldexist': 75, 't-overrated': 76, 't-underrated': 72, 't-inv': 72, 't-gadget': 73, 't-dayimprovers': 71,
  't-road': 70, 't-holi': 69, 't-skills': 68, 't-splurge': 67, 't-waste': 66, 't-partybring': 65, 't-wknd': 66,
  't-smell': 64, 't-collect': 63, 't-hobby': 62, 't-school': 60,
};
const popScore = (t) => (t && Object.prototype.hasOwnProperty.call(POPULARITY, t.id) ? POPULARITY[t.id] : null);
// Curated order: ranked topics by score (then name), then unranked ones by name. Never uses usage data.
function byPopularity(a, b) {
  const pa = popScore(a), pb = popScore(b);
  if (pa != null && pb != null) return pb - pa || a.name.localeCompare(b.name);
  if (pa != null) return -1; if (pb != null) return 1;
  return a.name.localeCompare(b.name);
}
// Personal favourites and pins (stored per device in settings.topicPrefs = { fav: [ids], pin: [ids] }).
const prefsOf = (settings) => ({ fav: [], pin: [], ...((settings && settings.topicPrefs) || {}) });
// Order inside a folder: pinned first (in curated order), then the rest in curated order.
function folderOrder(topics, prefs) {
  const pin = new Set(prefs.pin || []);
  return [...topics].sort((a, b) => (pin.has(b.id) ? 1 : 0) - (pin.has(a.id) ? 1 : 0) || byPopularity(a, b));
}
// Favourites tab: favourites that are pinned (in their own folder) first, then the rest, each in curated order.
function favouritesOrder(topics, prefs) {
  const fav = new Set(prefs.fav || []);
  return folderOrder(topics.filter((t) => fav.has(t.id)), prefs);
}
function toggleIn(list, id) { const s = new Set(list || []); if (s.has(id)) s.delete(id); else s.add(id); return [...s]; }
