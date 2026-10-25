/* ============================================================
   STARTER TOPICS
   ============================================================ */
function mkTopic(id, name, emoji, slots, layout, art, text, extra) {
  return { id, name, emoji, slots: parseSlots(slots), layout, art, ...(extra || {}),
    items: text.trim().split('\n').map((line, i) => { const [n, p, d, e] = line.split('|'); return { id: id + '-' + i, name: n.trim(), pos: (p || '').trim(), desc: (d || '').trim(), emoji: (e || '').trim(), photo: '' }; }) };
}
const FOLDERS = [['Sports', '⚽'], ['Food & Drink', '🍔'], ['Entertainment', '🎬'], ['Travel & Places', '✈️'], ['Animals', '🐾'], ['Style & Rides', '👟'], ['Just for Fun', '🎲'], ['My Topics', '📁']];
const STARTER_FOLDER = {
  't-pl': 'Sports', 't-cf': 'Sports', 't-nba': 'Sports', 't-goat': 'Sports', 't-nbal': 'Sports', 't-nhl': 'Sports', 't-nfl': 'Sports', 't-club': 'Sports', 't-ten': 'Sports', 't-f1': 'Sports', 't-fight': 'Sports', 't-crk': 'Sports',
  't-ff': 'Food & Drink', 't-snk': 'Food & Drink', 't-dish': 'Food & Drink', 't-drink': 'Food & Drink', 't-fruit': 'Food & Drink', 't-bfast': 'Food & Drink', 't-dess': 'Food & Drink', 't-pizza': 'Food & Drink',
  't-rap': 'Entertainment', 't-game': 'Entertainment', 't-toon': 'Entertainment', 't-anim': 'Entertainment', 't-app': 'Entertainment',
  't-trav': 'Travel & Places', 't-ctry': 'Travel & Places',
  't-ani': 'Animals', 't-pet': 'Animals',
  't-car': 'Style & Rides', 't-shoe': 'Style & Rides',
  't-pow': 'Just for Fun', 't-myth': 'Just for Fun', 't-job': 'Just for Fun', 't-zomb': 'Just for Fun',
  't-island': 'Just for Fun', 't-house': 'Just for Fun', 't-backyard': 'Just for Fun', 't-outfit': 'Style & Rides', 't-inv': 'Just for Fun', 't-board': 'Just for Fun', 't-toys': 'Just for Fun', 't-emoji': 'Just for Fun',
  't-hobby': 'Just for Fun', 't-road': 'Just for Fun', 't-smell': 'Just for Fun', 't-holi': 'Just for Fun', 't-gadget': 'Just for Fun', 't-wknd': 'Just for Fun', 't-school': 'Just for Fun',
};
const folderOf = (t) => (t && t.folder) || 'My Topics';
const folderEmoji = (f) => (FOLDERS.find((x) => x[0] === f) || [0, '📁'])[1];
function folderList(topics, includeDefaults) {
  const names = new Set(topics.map(folderOf));
  if (includeDefaults) FOLDERS.forEach((f) => names.add(f[0]));
  const order = FOLDERS.map((f) => f[0]);
  return [...names].sort((a, b) => { const ia = order.indexOf(a), ib = order.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); });
}
// Football numbers describe one moment: current players are shown as they are Now, legends at their Prime.
const STARTER_ERA = { 't-cf': 'now', 't-pl': 'prime', 't-goat': 'prime', 't-ucl': 'prime', 't-wonder': 'now', 't-wfoot': 'prime', 't-nba': 'now', 't-nbal': 'prime' };
// Fun-battle style for built-in topics (see 29-battles.js); copies and shared topics keep it.
const STARTER_BATTLE = {
  't-ani': 'fight', 't-cats': 'fight', 't-sharks': 'fight', 't-raptors': 'fight', 't-reptiles': 'fight', 't-snakes': 'fight', 't-dinos': 'fight',
  't-prehistmammals': 'fight', 't-myth': 'fight', 't-safari': 'fight', 't-arctic': 'fight', 't-primates': 'fight', 't-deepsea': 'fight',
  't-extinct': 'fight', 't-insects': 'fight', 't-aussie': 'fight', 't-whales': 'fight',
  't-pow': 'powers', 't-powercombos': 'powers', 't-worstpowers': 'weird',
  't-zomb': 'survival', 't-island': 'survival',
  't-cute': 'cute', 't-pet': 'cute', 't-dogbreeds': 'cute', 't-catbreeds': 'cute',
  't-nba': 'basketball', 't-nbal': 'basketball', 't-fight': 'combat',
};
function starterTopics() {
  const v3 = [...sportsTopicsV3(), ...foodTopicsV3(), ...entTopicsV3(), ...travelTopicsV3(), ...animalTopicsV3(), ...styleTopicsV3(), ...funTopicsV3()];
  return [...baseTopics(), ...evenMoreTopics(), ...funTopics()].map((t) => ({ ...t, folder: STARTER_FOLDER[t.id] || 'My Topics', photos: Object.prototype.hasOwnProperty.call(PHOTO_TOPICS, t.id) }))
    .concat(v3.map((t) => ({ ...t, builtin: true }))).map(withExtras).map((t) => (STARTER_SPORT[t.id] ? { ...t, sport: STARTER_SPORT[t.id] } : t)).map((t) => (STARTER_ERA[t.id] ? { ...t, era: STARTER_ERA[t.id] } : t)).map((t) => (STARTER_BATTLE[t.id] ? { ...t, battle: STARTER_BATTLE[t.id] } : t));
}
/* ---------- extra items for big groups (up to 16 players) ----------
   23-extra-*.js files add items to built-in topics without touching the originals.
   Line format: Name | position | short description | emoji | Wikipedia page (optional).
   Extra items get stable ids "<topic>-e<n>" and are skipped if the name already exists. */
const EXTRAS_V = 2;
function extraItemsFor(id) {
  const src = (typeof EXTRA_ITEMS !== 'undefined' && EXTRA_ITEMS[id]) || '';
  return src.trim() ? src.trim().split('\n').map((line, i) => { const [n, p, d, e, w] = line.split('|').map((x) => (x || '').trim()); const it = { id: id + '-e' + i, name: n, pos: p, desc: d, emoji: e, photo: '' }; if (w) it.wiki = w; return it; }) : [];
}
function withExtras(t) {
  const extra = extraItemsFor(t.id); if (!extra.length) return t;
  const have = new Set(t.items.map((i) => i.name.toLowerCase()));
  // Expanded topics that look up photos in sentence case ("Snow leopard") keep doing so for extras.
  const sentence = t.v3 && t.photos && t.items.filter((i) => i.wiki && i.wiki !== i.name && i.wiki.toLowerCase() === i.name.toLowerCase()).length > t.items.length / 3;
  if (sentence) extra.forEach((i) => { if (!i.wiki) i.wiki = i.name.charAt(0) + i.name.slice(1).toLowerCase(); });
  return { ...t, items: [...t.items, ...extra.filter((i) => !have.has(i.name.toLowerCase()) && have.add(i.name.toLowerCase()))], extrasV: EXTRAS_V };
}
// How many players a topic can fully fill (every team gets every slot), position-aware.
function maxPlayersFor(t) {
  if (!t || !t.slots || !t.slots.length) return 0;
  const by = {}; let flexSlots = 0;
  t.slots.forEach((s) => { if (isFlex(s)) flexSlots++; else by[norm(s)] = (by[norm(s)] || 0) + 1; });
  const counts = {}; let free = 0;
  t.items.forEach((it) => { const p = norm(it.pos); if (p && by[p]) counts[p] = (counts[p] || 0) + 1; else free++; });
  let n = Math.floor(t.items.length / t.slots.length);
  // When every item has a position, each position must also have enough items of its own.
  if (!free) Object.keys(by).forEach((p) => { n = Math.min(n, Math.floor(((counts[p] || 0)) / by[p])); });
  return n;
}
// Built-in topics have ids from this library; anything else is the user's own (created or imported).
const isBuiltIn = (t) => !!t && (Object.prototype.hasOwnProperty.call(STARTER_FOLDER, t.id) || !!t.v3 || !!t.builtin);

function funTopics() {
  return [
    mkTopic('t-island', 'Desert Island Items', '🏝️', 'Item 1, Item 2, Item 3', 'list', 'emoji', `
Knife||Cut anything|🔪
Lighter||Instant fire|🔥
Fishing Rod||Dinner sorted|🎣
Tent||Shelter|⛺
Water Filter||Drink anything|💧
Solar Charger||Power forever|🔋
Satellite Phone||Call for rescue|📡
Hammock||Island vibes|🌴
Machete||Clear the jungle|🗡️
Rope||Build a raft|🪢
Sunscreen||No burns|🧴
Sun Hat||Shade|👒
Football||Stay sane|⚽
Guitar||Campfire songs|🎸
Box of Books||Something to read|📚
Sack of Rice||Food for months|🍚
Coffee||Morning fuel|☕
Snorkel Set||Explore the reef|🤿
Kayak||Explore the coast|🛶
Speaker||Music|🔊
Hot Sauce||Flavour|🌶️
Pillow||Sleep well|🛌
First Aid Kit||Patch up|🩹
Your Best Friend||Company|🧑‍🤝‍🧑
Your Pet||Loyal companion|🐕
Flare Gun||Signal a ship|🎆
Inflatable Boat||Escape plan|🚤
Mosquito Net||No bites|🦟
Endless Snacks||Never hungry|🍫
Mirror||Signal and selfies|🪞`),
    mkTopic('t-house', 'Dream House', '🏡', 'Feature 1, Feature 2, Feature 3, Feature 4, Feature 5, Feature 6', 'list', 'scene', `
Private Beach||Sand and sea at the end of the garden|🏖️
Infinity Pool||Overlooking the sea|🏊
Waterslide||Straight into the pool|🛝
Hot Tub||Bubbles by the pool|🛁
Fire Pit||Late nights outside|🔥
Outdoor Kitchen||Grill, sink and stools|🍖
Helipad||With your own helicopter|🚁
Rooftop Terrace||Deck and umbrellas on the roof|🌇
Guest House||For visiting friends|🏠
10-Car Garage||Room for the collection|🚗
Supercar||Parked in the driveway|🏎️
Luxury SUV||The everyday ride|🚙
Security Gate||Private entrance|🚧
Fountain||In the middle of the driveway|⛲
Treehouse||Up in the big tree|🌳
Hedge Maze||Get lost in the garden|🌿
Tennis Court||Full-size, with a net|🎾
Basketball Court||Two hoops, full court|🏀
Football Pitch||Goals and floodlights|⚽
Mini Golf||Nine holes and a pond|⛳
Home Cinema||Big screen, red seats|🎬
Home Gym||Treadmill and weights|🏋️
Gaming Room||Every console, neon lights|🎮
Music Studio||Piano and speakers|🎹`, { scene: 'house' }),
    mkTopic('t-backyard', 'Dream Backyard', '🌳', 'Feature 1, Feature 2, Feature 3, Feature 4, Feature 5, Feature 6', 'list', 'scene', `
Swimming Pool||A curvy pool with steps|🏊
Hot Tub||Bubbles all year round|🛁
Pool Loungers||Towels and an umbrella|🏖️
Hammock||Between two trees|😴
BBQ Grill||Burgers on the deck|🍖
Outdoor Dining Table||Seats for eight|🍽️
Patio Sofa||Cushions and a coffee table|🛋️
Pergola||Wooden roof with vines|🌿
Outdoor Bar||Stools and drinks|🍹
String Lights||Glowing over the lawn|💡
Fire Pit||Chairs round the fire|🔥
Outdoor Cinema||Big screen and beanbags|🎬
Trampoline||Bounce all day|🤸
Basketball Hoop||Half court on the patio|🏀
Football Goal||Penalties after dinner|⚽
Table Tennis||Bats and a ball included|🏓
Playground||Swings, slide and sandpit|🛝
Vegetable Garden||Grow your own|🥕
Koi Pond||Lily pads and koi|🐟
Fruit Trees||Oranges, apples, lemons|🍊
Flower Beds||Colour along the fence|🌸
Sauna||Wooden barrel sauna|🧖`, { scene: 'backyard' }),
    mkTopic('t-outfit', 'Build an Outfit', '🧥', 'Hat, Top, Jacket, Bottoms, Shoes, Accessory', 'list', 'scene', `
Baseball Cap|Hat|Classic curved brim|🧢
Beanie|Hat|Knitted, with a bobble|🧶
Bucket Hat|Hat|Brim all the way round|👒
Fedora|Hat|Sharp and classic|🎩
Cowboy Hat|Hat|Yeehaw|🤠
Plain T-Shirt|Top|Crisp white tee|👕
Graphic T-Shirt|Top|Black tee with a star|⭐
Hoodie|Top|Hood and drawstrings|🧥
Sweater|Top|Knitted with stripes|🧶
Button-Up Shirt|Top|Light blue, collar and buttons|👔
Denim Jacket|Jacket|Blue with stitching|🧥
Bomber Jacket|Jacket|Olive with ribbed cuffs|🧥
Leather Jacket|Jacket|Black with silver zips|🧥
Puffer Jacket|Jacket|Big, warm and orange|🧥
Varsity Jacket|Jacket|Red with cream sleeves|🧥
Jeans|Bottoms|Classic blue|👖
Cargo Pants|Bottoms|Pockets on the legs|👖
Sweatpants|Bottoms|Grey and comfy|👖
Shorts|Bottoms|Chino shorts|🩳
Tailored Trousers|Bottoms|Charcoal, sharp crease|👖
Sneakers|Shoes|Clean white trainers|👟
High-Top Sneakers|Shoes|Red, up past the ankle|👟
Boots|Shoes|Brown leather|🥾
Loafers|Shoes|Smart slip-ons|👞
Sandals|Shoes|Summer straps|🩴
Sunglasses|Accessory|Dark lenses|🕶️
Necklace|Accessory|Gold chain and pendant|📿
Watch|Accessory|Gold face|⌚
Crossbody Bag|Accessory|Leather, across the chest|👜
Scarf|Accessory|Red and green check|🧣`, { scene: 'outfit' }),
    mkTopic('t-inv', 'Greatest Inventions', '💡', 'Invention 1, Invention 2, Invention 3, Invention 4', 'list', 'emoji', `
The Internet||Connects everyone|🌐
Smartphone||Everything in your pocket|📱
Electricity||Powers the world|⚡
The Wheel||Where it started|🛞
Airplane||Fly anywhere|✈️
Car||Go anywhere|🚗
Light Bulb||Night becomes day|💡
Printing Press||Books for everyone|📰
Vaccines||Saved millions|💉
Antibiotics||Cure infections|💊
Refrigerator||Food stays fresh|🧊
Air Conditioning||Survive summer|❄️
Television||Entertainment|📺
Computer||Changed everything|💻
Telephone||Talk across the world|☎️
Camera||Capture moments|📷
GPS||Never get lost|🛰️
Flushing Toilet||Underrated hero|🚽
Glasses||See clearly|👓
Clock||Know the time|🕰️
Microwave||Food in 2 minutes|♨️
Washing Machine||No more hand washing|🧺
Bicycle||Pedal power|🚲
Video Games||Endless fun|🎮
Wi-Fi||Internet without wires|📶
Headphones||Music anywhere|🎧
Zipper||Clothes revolution|🤐
Sliced Bread||The best thing since|🍞
Paper||Write it down|📄
Compass||Find your way|🧭`),
    mkTopic('t-board', 'Board & Card Games', '🎲', 'Game 1, Game 2, Game 3, Game 4', 'list', 'emoji', `
Monopoly||Friendship ender|🎩
Uno||Draw four|🃏
Chess||Strategy|♟️
Scrabble||Word nerds|🔤
Jenga||Don't knock it over|🧱
Connect 4||Four in a row|🔴
Clue||Whodunnit|🔍
Catan||Wood for sheep|🐑
Risk||World domination|🗺️
Battleship||You sank my battleship|🚢
Snakes & Ladders||Pure luck|🐍
Ludo||Family classic|🎲
Carrom||Flick the striker|🎯
Dominoes||Match the ends|⚫
Checkers||King me|🔵
Twister||Left hand red|🌀
Pictionary||Draw it|✏️
Guess Who?||Does your person wear glasses?|🧑
Operation||Steady hands|🩺
Sorry!||Not really sorry|😬
Exploding Kittens||Don't draw the bomb|💣
Codenames||One-word clues|🕵️
Werewolf||Who's lying?|🐺
Taboo||Can't say those words|🤫
Trivial Pursuit||Know-it-all|🧠
Poker Night||Bluffing (for snacks)|♠️
Go Fish||Got any sevens?|🐟
Spoons||Grab one fast|🥄
Scattergories||Categories|📝
Backgammon||Ancient classic|🎰`),
    mkTopic('t-toys', 'Childhood Toys', '🧸', 'Toy 1, Toy 2, Toy 3, Toy 4', 'list', 'emoji', `
LEGO||Step on one|🧱
Beyblades||Let it rip|🌀
Pokémon Cards||Gotta catch 'em all|⚡
Nerf Blasters||Foam wars|🎯
Hot Wheels||Tiny cars|🏎️
Tamagotchi||Keep it alive|🥚
Game Boy||Handheld classic|🎮
Yo-Yo||Walk the dog|🪀
Rubik's Cube||Never solved it|🟥
Slinky||Walks down stairs|🌈
Bakugan||Pop open|🔮
Furby||Creepy at night|🦉
Play-Doh||Smells iconic|🎨
Etch A Sketch||Shake to erase|✏️
Tech Deck||Finger skateboard|🛹
Kinder Surprise||Toy inside|🍫
Bubble Wand||Bubbles|🫧
Water Gun||Summer wars|💦
Scooter||Ankle destroyer|🛴
Rollerblades||Roll out|🛼
RC Car||Remote control|🚙
Silly Bandz||Wrist full|🔵
Fidget Spinner||2017 craze|💫
Nintendo DS||Two screens|🕹️
Teddy Bear||Best friend|🧸
Kite||Windy days|🪁
Marbles||Classic|⚪
Action Figures||Epic battles|🦸
Trampoline||Backyard flips|🤸
Squishmallow||Soft|🫶`),
    mkTopic('t-emoji', 'Emojis', '😂', 'Emoji 1, Emoji 2, Emoji 3, Emoji 4, Emoji 5', 'list', 'emoji', `
Crying Laughing||Classic laugh|😂
Skull||Dead from laughing|💀
Fire||That's hot|🔥
Red Heart||Love|❤️
Thumbs Up||Sounds good|👍
Eyes||Watching this|👀
Goat||Greatest of all time|🐐
Sobbing||Overwhelmed|😭
Clown||You played yourself|🤡
Hundred||Keep it 100|💯
Praying Hands||Please / thank you|🙏
Smirk||Up to something|😏
Sunglasses||Too cool|😎
Thinking||Hmm|🤔
Eye Roll||Sure, buddy|🙄
Salute||Respect|🫡
Melting||So embarrassed|🫠
Nerd||Um, actually|🤓
Moai||Stone face|🗿
Cap||That's a lie|🧢
Rocket||To the moon|🚀
Sparkles||Fancy|✨
Hand Over Mouth||Oops|🤭
Upside-Down||Sarcasm|🙃
Mind Blown||No way|🤯
Party Face||Celebrate|🥳
Pleading||Puppy eyes|🥺
Shrug||Who knows|🤷
Facepalm||Why|🤦
Ghost||Ghosted|👻`),
    mkTopic('t-hobby', 'Hobbies', '🎨', 'Hobby 1, Hobby 2, Hobby 3', 'list', 'emoji', `
Gaming||Controller in hand|🎮
Football||Sunday league|⚽
Basketball||Pickup games|🏀
Gym||Gains|🏋️
Cooking||Chef mode|🍳
Photography||Capture it|📸
Drawing||Sketchbook|✏️
Reading||Bookworm|📚
Fishing||Patience|🎣
Hiking||Trails|🥾
Coding||Build apps|💻
Guitar||Strum|🎸
Chess||Checkmate|♟️
Swimming||Laps|🏊
Cycling||Long rides|🚴
Skateboarding||Kickflips|🛹
Gardening||Green thumb|🌱
Baking||Fresh out the oven|🧁
Video Editing||Content creator|🎬
Sneaker Collecting||Cop or drop|👟
Camping||Under the stars|⛺
Running||Marathon goals|🏃
Boxing||Jab, cross|🥊
Martial Arts||Black belt|🥋
Calligraphy||Beautiful writing|🖋️
Knitting||Cozy crafts|🧶
Rock Climbing||Reach the top|🧗
LEGO Building||Master builder|🧱
Car Detailing||Shiny|🚗
Learning Languages||Polyglot|🗣️`),
    mkTopic('t-road', 'Road Trip Essentials', '🚗', 'Item 1, Item 2, Item 3, Item 4', 'list', 'emoji', `
Aux Cord||Whoever has it runs the trip|🎵
Phone Charger||Never die|🔌
Gas Station Snacks||The real reason we stop|🍫
Tim Hortons Run||Double-double for the road|☕
Road Trip Playlist||Bangers only|🎶
Sunglasses||Sun in your eyes|🕶️
Neck Pillow||Nap time|😴
Cooler of Drinks||Ice cold|🧊
Chips||Crunch|🥔
Gummies||Sugar rush|🍬
Beef Jerky||Protein|🥩
Google Maps||Don't get lost|🗺️
Spare Tire||Just in case|🛞
Blanket||Back seat naps|🧣
Car Games||I spy|🎲
Podcast||Long stretches|🎙️
Roof Box||More luggage|🧳
Polaroid Camera||Memories|📸
Bluetooth Speaker||Rest stop vibes|🔊
Power Bank||Backup battery|🔋
Wet Wipes||Sticky hands|🧻
Sunflower Seeds||Spit the shells|🌻
Water Bottles||Stay hydrated|💧
Hand Sanitizer||Gas station bathrooms|🧴
Gum||Fresh breath|🫧
Fruit||Healthy-ish|🍎
Sandwiches||Packed lunch|🥪
Hoodie||AC wars|🧥
Emergency Kit||Safety first|🩹
Dashcam||Evidence|📹`),
    mkTopic('t-smell', 'Best Smells', '👃', 'Smell 1, Smell 2, Smell 3', 'list', 'emoji', `
Fresh Bread||Straight from the oven|🍞
Rain||After a storm|🌧️
Fresh Laundry||Clean clothes|🧺
Coffee||Morning brew|☕
New Car||Showroom fresh|🚗
Cut Grass||Summer|🌱
Popcorn||Movie theatre|🍿
Bakery||Pastries|🥐
Oud||Rich and woody|🪵
Vanilla||Sweet|🍦
Campfire||Smoky|🔥
Ocean Breeze||Salty air|🌊
Pine Trees||Forest|🌲
Lavender||Calm|💜
Cookies Baking||Warm and sweet|🍪
BBQ||Grill going|🍖
New Book||Fresh pages|📖
Cinnamon||Spiced|🥧
Oranges||Citrus peel|🍊
Roses||Floral|🌹
Chocolate||Rich|🍫
Baby Powder||Soft|👶
Mint||Fresh|🌿
Coconut||Beach|🥥
Gasoline||Controversial|⛽
Play-Doh||Childhood|🎨
Bakhoor||Incense|💨
Fresh Paint||New room|🖌️
Garlic Frying||Dinner's coming|🧄
New Sneakers||Opening the box|👟`),
    mkTopic('t-holi', 'Holidays & Celebrations', '🎉', 'Day 1, Day 2, Day 3, Day 4', 'list', 'emoji', `
Eid al-Fitr||End of Ramadan|🌙
Eid al-Adha||Festival of sacrifice|🐑
Ramadan Nights||Iftar with family|🏮
Christmas||December 25|🎄
New Year's Eve||Countdown|🎆
Halloween||Costumes and candy|🎃
Thanksgiving||Turkey dinner|🦃
Canada Day||July 1|🇨🇦
Diwali||Festival of lights|🪔
Lunar New Year||Red envelopes|🧧
Your Birthday||Your day|🎂
Valentine's Day||Love|💘
Easter||Chocolate eggs|🐣
Summer Break||Freedom|☀️
Last Day of School||Free at last|🎒
Family Day||Ontario long weekend|👨‍👩‍👧
Victoria Day||Fireworks|🎇
Boxing Day||Sales|🛍️
Black Friday||Deals|🏷️
Super Bowl Sunday||Game and wings|🏈
World Cup Final||Once every four years|⚽
Graduation||Cap and gown|🎓
Wedding Season||Dancing|💍
Snow Day||No school|❄️
Payday||Money in|💸
Hanukkah||Festival of lights|🕎
Nowruz||Persian New Year|🌸
Holi||Festival of colours|🌈
Mother's Day||Treat mom|💐
Long Weekend||Three days off|🏖️`),
    mkTopic('t-gadget', 'Tech Gadgets', '📱', 'Gadget 1, Gadget 2, Gadget 3, Gadget 4', 'list', 'emoji', `
iPhone||Smartphone|📱
AirPods||Wireless earbuds|🎧
PlayStation 5||Console|🎮
Nintendo Switch||Handheld console|🕹️
Xbox||Console|🟩
MacBook||Laptop|💻
Gaming PC||RGB everything|🖥️
iPad||Tablet|🖊️
Apple Watch||Smartwatch|⌚
Drone||Aerial shots|🚁
GoPro||Action camera|📹
VR Headset||Virtual reality|🥽
Smart TV||Big screen|📺
Kindle||E-reader|📖
Bluetooth Speaker||Portable music|🔊
Noise-Cancelling Headphones||Silence|🎶
Mechanical Keyboard||Clicky|⌨️
Gaming Mouse||Precision|🖱️
Ring Light||Content setup|💡
Electric Scooter||Commute|🛴
Robot Vacuum||Cleans for you|🤖
Instant Camera||Print photos|📸
Smart Glasses||Camera in your frames|🕶️
Power Bank||Backup battery|🔋
Air Fryer||Crispy everything|🍟
Hair Dryer||Fancy airflow|💨
Steam Deck||PC games anywhere|👾
3D Printer||Print anything|🧊
E-Bike||Pedal assist|🚲
Mini Projector||Movie anywhere|📽️`),
    mkTopic('t-wknd', 'Weekend Plans', '🗓️', 'Plan 1, Plan 2, Plan 3', 'list', 'emoji', `
Sleep In||No alarm|😴
Brunch||Late breakfast|🥞
Movie Night||Popcorn ready|🍿
Mall Trip||Shopping|🛍️
Gym Session||Leg day|🏋️
Pickup Basketball||Run it back|🏀
Football with the Boys||Five-a-side|⚽
All-Night Gaming||One more game|🎮
Road Trip||Hit the highway|🚗
Beach Day||Sun and sand|🏖️
Bowling||Strikes|🎳
Go-Karting||Racing|🏎️
Escape Room||Beat the clock|🔐
Arcade||Tokens|🕹️
Trampoline Park||Flips|🤸
Hiking||Trails|🥾
Bonfire||S'mores|🔥
BBQ||Backyard grill|🍖
Family Dinner||Everyone together|🍽️
Ice Skating||Outdoor rink|⛸️
Skiing||Hit the slopes|⛷️
Concert||Live music|🎤
Theme Park||Roller coasters|🎢
Museum||Culture|🏛️
Late-Night Food Run||2 a.m. shawarma|🌯
Board Game Night||Competitive|🎲
Paintball||Splat|🎯
Volunteering||Give back|🤝
Picnic||Park day|🧺
Laser Tag||Glow in the dark|🔦`),
    mkTopic('t-school', 'School Subjects', '🎒', 'Class 1, Class 2, Class 3, Class 4', 'list', 'emoji', `
Math||Numbers|➗
English||Essays|📖
Science||Experiments|🔬
Physics||Forces|⚛️
Chemistry||Explosions (hopefully)|🧪
Biology||Life|🧬
History||The past|🏛️
Geography||Maps|🌍
Gym||Dodgeball|⚽
Art||Create|🎨
Music||Recorder era|🎵
Computer Science||Code|💻
French||Bonjour|🥖
Business||Money moves|💼
Economics||Supply and demand|📊
Accounting||Debits and credits|🧾
Psychology||The mind|🧠
Drama||Act it out|🎭
Law||Rules|⚖️
Philosophy||Big questions|🤔
Statistics||Probability|📈
Marketing||Sell it|📣
Lunch||Best period|🥪
Recess||Freedom|🛝
Spare Period||Nap time|😴
Field Trip||Bus ride|🚌
Shop Class||Build stuff|🔨
Health||Nutrition|🍎
Media Studies||Analyze ads|📺
Astronomy||Stars|🔭`),
  ];
}

function evenMoreTopics() {
  return [
    mkTopic('t-ten', 'Tennis Players', '🎾', 'Men, Men, Women, Women', 'list', 'emoji', `
Novak Djokovic|Men|24 Grand Slams|🇷🇸
Rafael Nadal|Men|14× French Open|🇪🇸
Roger Federer|Men|20 Grand Slams|🇨🇭
Carlos Alcaraz|Men|Spain|🇪🇸
Jannik Sinner|Men|Italy|🇮🇹
Andy Murray|Men|2× Wimbledon|🇬🇧
Pete Sampras|Men|7× Wimbledon|🇺🇸
Andre Agassi|Men|Career Grand Slam|🇺🇸
Daniil Medvedev|Men|2021 US Open|🇷🇺
Alexander Zverev|Men|Olympic gold|🇩🇪
Taylor Fritz|Men|USA|🇺🇸
Félix Auger-Aliassime|Men|Canada|🇨🇦
Stan Wawrinka|Men|3 Grand Slams|🇨🇭
Nick Kyrgios|Men|Showman|🇦🇺
Ben Shelton|Men|Big serve|🇺🇸
Serena Williams|Women|23 Grand Slams|🇺🇸
Venus Williams|Women|5× Wimbledon|🇺🇸
Steffi Graf|Women|1988 Golden Slam|🇩🇪
Iga Świątek|Women|Poland|🇵🇱
Aryna Sabalenka|Women|Power hitter|🇧🇾
Coco Gauff|Women|2023 US Open|🇺🇸
Maria Sharapova|Women|5 Grand Slams|🇷🇺
Naomi Osaka|Women|4 Grand Slams|🇯🇵
Bianca Andreescu|Women|2019 US Open|🇨🇦
Leylah Fernandez|Women|Canada|🇨🇦
Martina Navratilova|Women|9× Wimbledon|🇺🇸
Elena Rybakina|Women|2022 Wimbledon|🇰🇿
Ons Jabeur|Women|Tunisia|🇹🇳
Emma Raducanu|Women|2021 US Open|🇬🇧
Madison Keys|Women|2025 Australian Open|🇺🇸`),
    mkTopic('t-f1', 'F1 Drivers', '🏁', 'Current, Current, Legend', 'list', 'emoji', `
Max Verstappen|Current|Netherlands|🇳🇱
Lewis Hamilton|Current|7× world champion|🇬🇧
Charles Leclerc|Current|Monaco|🇲🇨
Lando Norris|Current|Britain|🇬🇧
Oscar Piastri|Current|Australia|🇦🇺
George Russell|Current|Britain|🇬🇧
Fernando Alonso|Current|2× world champion|🇪🇸
Carlos Sainz|Current|Spain|🇪🇸
Lance Stroll|Current|Canada|🇨🇦
Pierre Gasly|Current|France|🇫🇷
Esteban Ocon|Current|France|🇫🇷
Kimi Antonelli|Current|Italy|🇮🇹
Oliver Bearman|Current|Britain|🇬🇧
Alex Albon|Current|Thailand|🇹🇭
Yuki Tsunoda|Current|Japan|🇯🇵
Nico Hülkenberg|Current|Germany|🇩🇪
Michael Schumacher|Legend|7× world champion|🇩🇪
Ayrton Senna|Legend|3× world champion|🇧🇷
Alain Prost|Legend|4× world champion|🇫🇷
Niki Lauda|Legend|3× world champion|🇦🇹
Sebastian Vettel|Legend|4× world champion|🇩🇪
Kimi Räikkönen|Legend|2007 world champion|🇫🇮
Jenson Button|Legend|2009 world champion|🇬🇧
Nigel Mansell|Legend|1992 world champion|🇬🇧
Mika Häkkinen|Legend|2× world champion|🇫🇮
Juan Manuel Fangio|Legend|5× world champion|🇦🇷
Jackie Stewart|Legend|3× world champion|🇬🇧
Nico Rosberg|Legend|2016 world champion|🇩🇪
Jacques Villeneuve|Legend|1997 world champion|🇨🇦
Gilles Villeneuve|Legend|Ferrari legend|🇨🇦`),
    mkTopic('t-fight', 'Boxing & UFC Fighters', '🥊', 'Boxing, Boxing, UFC, UFC', 'list', 'emoji', `
Muhammad Ali|Boxing|The Greatest|🇺🇸
Mike Tyson|Boxing|Iron Mike|🇺🇸
Floyd Mayweather|Boxing|50-0|🇺🇸
Manny Pacquiao|Boxing|8-division champion|🇵🇭
Canelo Álvarez|Boxing|Mexico|🇲🇽
Tyson Fury|Boxing|The Gypsy King|🇬🇧
Anthony Joshua|Boxing|2× heavyweight champ|🇬🇧
Oleksandr Usyk|Boxing|Undisputed|🇺🇦
Naoya Inoue|Boxing|The Monster|🇯🇵
Terence Crawford|Boxing|Undisputed|🇺🇸
Sugar Ray Leonard|Boxing|Legend|🇺🇸
Lennox Lewis|Boxing|Heavyweight king|🇬🇧
Prince Naseem Hamed|Boxing|The Prince|🇬🇧
Gervonta Davis|Boxing|Tank|🇺🇸
Amir Khan|Boxing|Olympic silver|🇬🇧
Khabib Nurmagomedov|UFC|29-0|🇷🇺
Conor McGregor|UFC|The Notorious|🇮🇪
Jon Jones|UFC|Bones|🇺🇸
Georges St-Pierre|UFC|GSP · Canada|🇨🇦
Anderson Silva|UFC|The Spider|🇧🇷
Islam Makhachev|UFC|Lightweight king|🇷🇺
Israel Adesanya|UFC|The Last Stylebender|🇳🇬
Alex Pereira|UFC|Poatan|🇧🇷
Francis Ngannou|UFC|The Predator|🇨🇲
Khamzat Chimaev|UFC|Borz|🇦🇪
Ilia Topuria|UFC|El Matador|🇪🇸
Daniel Cormier|UFC|DC|🇺🇸
Ronda Rousey|UFC|Rowdy|🇺🇸
Amanda Nunes|UFC|The Lioness|🇧🇷
Valentina Shevchenko|UFC|Bullet|🇰🇬`),
    mkTopic('t-crk', 'Cricket Players', '🏏', 'BAT, BAT, WK, BOWL, BOWL, AR', 'list', 'kit', `
Virat Kohli|BAT|India · King Kohli
Rohit Sharma|BAT|India · Hitman
Babar Azam|BAT|Pakistan
Joe Root|BAT|England
Steve Smith|BAT|Australia
Kane Williamson|BAT|New Zealand
Sachin Tendulkar|BAT|India · Master Blaster
Brian Lara|BAT|West Indies · 400*
Shubman Gill|BAT|India
Travis Head|BAT|Australia
MS Dhoni|WK|India · Captain Cool
Rishabh Pant|WK|India
Jos Buttler|WK|England
Quinton de Kock|WK|South Africa
Adam Gilchrist|WK|Australia
Mohammad Rizwan|WK|Pakistan
Jasprit Bumrah|BOWL|India
Shaheen Afridi|BOWL|Pakistan
Pat Cummins|BOWL|Australia
Mitchell Starc|BOWL|Australia
James Anderson|BOWL|England · 700 Test wickets
Rashid Khan|BOWL|Afghanistan
Shane Warne|BOWL|Australia · spin king
Muttiah Muralitharan|BOWL|Sri Lanka · 800 Test wickets
Wasim Akram|BOWL|Pakistan · Sultan of Swing
Kagiso Rabada|BOWL|South Africa
Ben Stokes|AR|England
Shakib Al Hasan|AR|Bangladesh
Hardik Pandya|AR|India
Jacques Kallis|AR|South Africa
Ravindra Jadeja|AR|India
Glenn Maxwell|AR|Australia · Big Show`),
    mkTopic('t-fruit', 'Fruits', '🍓', 'Fruit 1, Fruit 2, Fruit 3, Fruit 4', 'list', 'emoji', `
Mango||King of fruits|🥭
Strawberry||Summer classic|🍓
Watermelon||Hydration|🍉
Pineapple||Tropical|🍍
Banana||Potassium|🍌
Apple||Red and crunchy|🍎
Green Apple||Sour crunch|🍏
Grapes||Bite-size|🍇
Orange||Vitamin C|🍊
Kiwi||Fuzzy outside|🥝
Peach||Juicy|🍑
Cherry||Pit included|🍒
Blueberry||Superfood|🫐
Coconut||Tropical|🥥
Lemon||Sour|🍋
Pear||Underrated|🍐
Avocado||Technically a fruit|🥑
Melon||Honeydew|🍈
Tomato||Technically a fruit|🍅
Pomegranate||Ruby seeds|❤️
Dragon Fruit||Pink and spotty|🐉
Lychee||Sweet and floral|🤍
Papaya||Tropical|🧡
Guava||Tropical|💚
Fig||Sweet|💜
Dates||Iftar essential|🌴
Passion Fruit||Tangy|💛
Raspberry||Tart|🩷
Blackberry||Dark berry|🖤
Plum||Juicy|🟣`),
    mkTopic('t-bfast', 'Breakfast', '🥞', 'Plate 1, Plate 2, Plate 3', 'list', 'emoji', `
Pancakes||Maple syrup|🥞
Waffles||Crispy squares|🧇
French Toast||Cinnamon|🍞
Eggs Benedict||Hollandaise|🍳
Full English||Fry-up|🍳
Bagel & Cream Cheese||Classic|🥯
Croissant||Buttery|🥐
Cereal||Milk first or cereal first|🥣
Oatmeal||Healthy start|🥣
Avocado Toast||Brunch|🥑
Breakfast Burrito||Wrapped up|🌯
Shakshuka||Eggs in tomato sauce|🍳
Halwa Puri||Weekend special|🫓
Paratha & Chai||Desi classic|🫓
Ful Medames||Fava beans|🫘
Manakish||Za'atar flatbread|🫓
Hash Browns||Crispy potato|🥔
Chicken & Waffles||Sweet and savoury|🍗
Smoothie Bowl||Fruit and granola|🫐
Yogurt Parfait||Layers|🍨
Beef Sausages||Sizzling|🌭
Egg McMuffin||Drive-thru|🍔
Breakfast Sandwich||On the go|🥪
Crêpes||Nutella|🥞
Nasi Lemak||Malaysia|🍚
Congee||Rice porridge|🍚
Masala Dosa||South India|🫓
Chilaquiles||Mexico|🌮
Granola||Crunchy|🥣
Fruit Salad||Fresh|🍉`),
    mkTopic('t-dess', 'Desserts', '🍰', 'Dessert 1, Dessert 2, Dessert 3, Dessert 4', 'list', 'emoji', `
Cheesecake||New York style|🍰
Brownie||Fudgy|🍫
Chocolate Chip Cookie||Warm|🍪
Ice Cream Sundae||Whipped cream|🍨
Gelato||Italian|🍦
Donut||Glazed|🍩
Cupcake||Frosting|🧁
Apple Pie||With ice cream|🥧
Cinnamon Roll||Gooey|🌀
Macarons||French|🌸
Churros||Dip in chocolate|🥖
Tres Leches||Three milks|🍰
Kunafa||Cheese and syrup|🧀
Baklava||Pistachio|🍯
Gulab Jamun||Syrupy|🍡
Rasmalai||Creamy|🥛
Mochi||Chewy|🍡
Nutella Crêpe||Folded|🥞
Banana Split||Three scoops|🍌
Lava Cake||Molten centre|🌋
Red Velvet Cake||Cream cheese frosting|🎂
Pavlova||Meringue|☁️
Key Lime Pie||Tangy|🥧
Funnel Cake||Fair food|🎡
Milkshake||Thick|🥤
Bubble Waffle||Hong Kong street food|🧇
Sticky Toffee Pudding||British classic|🍮
Butter Tart||Canadian classic|🥧
Nanaimo Bar||Canadian classic|🍫
Crème Caramel||Wobbly|🍮`),
    mkTopic('t-pizza', 'Pizza Toppings', '🍕', 'Topping 1, Topping 2, Topping 3', 'list', 'emoji', `
Pepperoni||The classic|🍕
Mushrooms||Earthy|🍄
Onions||Sweet when baked|🧅
Green Peppers||Crunchy|🫑
Black Olives||Salty|🫒
Pineapple||Controversial|🍍
Extra Cheese||Always|🧀
Jalapeños||Spicy|🌶️
Spinach||Green|🥬
Tomatoes||Fresh|🍅
Chicken||Grilled|🍗
Ground Beef||Hearty|🥩
Beef Sausage||Italian style|🌭
Garlic||Roasted|🧄
Basil||Fresh leaves|🌿
Corn||Sweet|🌽
Anchovies||Love or hate|🐟
Turkey Bacon||Crispy|🥓
Feta||Greek style|🧀
Hot Honey||Sweet heat|🍯
BBQ Sauce||Smoky|🥫
Ranch Drizzle||Creamy|🥛
Banana Peppers||Tangy|🌶️
Sun-Dried Tomatoes||Intense|🍅
Artichokes||Fancy|🌱
Shrimp||Seafood|🍤
Red Onions||Sharp|🧅
Paneer||Tikka style|🧀
Donair Meat||East Coast style|🥙
Butter Chicken||Fusion|🍛`),
    mkTopic('t-anim', 'Animated Movies', '🍿', 'Movie 1, Movie 2, Movie 3, Movie 4', 'list', 'emoji', `
Toy Story||1995|🤠
Shrek||2001|🧅
Finding Nemo||2003|🐠
The Lion King||1994|🦁
Up||2009|🎈
Frozen||2013|❄️
Into the Spider-Verse||2018|🕷️
Coco||2017|🎸
Inside Out||2015|😄
Ratatouille||2007|🐀
WALL-E||2008|🤖
Monsters, Inc.||2001|👁️
The Incredibles||2004|🦸
Kung Fu Panda||2008|🐼
Despicable Me||2010|🍌
How to Train Your Dragon||2010|🐉
Moana||2016|🌊
Zootopia||2016|🦊
Cars||2006|🏎️
Spirited Away||2001|🏮
Your Name||2016|☄️
Aladdin||1992|🧞
Madagascar||2005|🦓
Ice Age||2002|🦣
Megamind||2010|🧠
The Lego Movie||2014|🧱
Encanto||2021|🦋
Puss in Boots: The Last Wish||2022|🐱
Big Hero 6||2014|🩹
Tangled||2010|💇`),
    mkTopic('t-ctry', 'Countries', '🌍', 'Europe, Asia, Africa, Americas, FLEX', 'list', 'emoji', `
Italy|Europe|Capital: Rome|🇮🇹
Spain|Europe|Capital: Madrid|🇪🇸
France|Europe|Capital: Paris|🇫🇷
United Kingdom|Europe|Capital: London|🇬🇧
Germany|Europe|Capital: Berlin|🇩🇪
Turkey|Europe|Capital: Ankara|🇹🇷
Portugal|Europe|Capital: Lisbon|🇵🇹
Greece|Europe|Capital: Athens|🇬🇷
Netherlands|Europe|Capital: Amsterdam|🇳🇱
Switzerland|Europe|Capital: Bern|🇨🇭
Japan|Asia|Capital: Tokyo|🇯🇵
South Korea|Asia|Capital: Seoul|🇰🇷
Saudi Arabia|Asia|Capital: Riyadh|🇸🇦
UAE|Asia|Capital: Abu Dhabi|🇦🇪
Pakistan|Asia|Capital: Islamabad|🇵🇰
India|Asia|Capital: New Delhi|🇮🇳
Indonesia|Asia|Capital: Jakarta|🇮🇩
Malaysia|Asia|Capital: Kuala Lumpur|🇲🇾
Thailand|Asia|Capital: Bangkok|🇹🇭
China|Asia|Capital: Beijing|🇨🇳
Morocco|Africa|Capital: Rabat|🇲🇦
Egypt|Africa|Capital: Cairo|🇪🇬
Nigeria|Africa|Capital: Abuja|🇳🇬
South Africa|Africa|Capital: Pretoria|🇿🇦
Kenya|Africa|Capital: Nairobi|🇰🇪
Ghana|Africa|Capital: Accra|🇬🇭
Canada|Americas|Capital: Ottawa|🇨🇦
USA|Americas|Capital: Washington, D.C.|🇺🇸
Mexico|Americas|Capital: Mexico City|🇲🇽
Brazil|Americas|Capital: Brasília|🇧🇷
Argentina|Americas|Capital: Buenos Aires|🇦🇷
Jamaica|Americas|Capital: Kingston|🇯🇲`),
    mkTopic('t-pet', 'Pets', '🐶', 'Dog, Cat, Other, FLEX', 'list', 'emoji', `
Golden Retriever|Dog|Best friend|🐕
German Shepherd|Dog|Loyal guard|🐕‍🦺
Husky|Dog|Dramatic|🐺
French Bulldog|Dog|Snorts a lot|🐶
Pomeranian|Dog|Tiny fluffball|🐶
Persian Cat|Cat|Fluffy royalty|🐈
Siamese Cat|Cat|Chatty|🐈
Maine Coon|Cat|Giant cat|🐈
Sphynx Cat|Cat|No fur|🐱
Ragdoll Cat|Cat|Goes floppy|🐈
Rabbit|Other|Hops|🐇
Hamster|Other|Wheel runner|🐹
Guinea Pig|Other|Squeaks|🐹
Parrot|Other|Talks back|🦜
Budgie|Other|Small and chirpy|🐦
Goldfish|Other|Low maintenance|🐠
Turtle|Other|Lives forever|🐢
Bearded Dragon|Other|Chill lizard|🦎
Snake|Other|Not for everyone|🐍
Ferret|Other|Chaos noodle|🦦
Hedgehog|Other|Spiky|🦔
Horse|Other|Needs a field|🐎
Mini Pig|Other|Smart|🐖
Goat|Other|Eats everything|🐐
Chicken|Other|Free eggs|🐔
Duck|Other|Quack|🦆
Axolotl|Other|Smiling salamander|🩷
Tarantula|Other|Eight legs|🕷️
Chinchilla|Other|Softest fur|🐭
Capybara|Other|Friends with everyone|🦫`),
    mkTopic('t-job', 'Dream Jobs', '💼', 'Job 1, Job 2, Job 3', 'list', 'emoji', `
Astronaut||Space|🚀
Pro Footballer||Sport|⚽
Doctor||Medicine|🩺
Pilot||Travel|✈️
Software Engineer||Tech|💻
YouTuber||Content|📹
Chef||Food|🧑‍🍳
Firefighter||Hero|🚒
Lawyer||Law|⚖️
Architect||Design|📐
Game Developer||Tech|🎮
Actor||Film|🎬
Musician||Music|🎸
Marine Biologist||Science|🐠
Detective||Mystery|🕵️
Teacher||Education|🍎
Entrepreneur||Business|💼
Photographer||Art|📸
Vet||Animals|🐾
Fashion Designer||Style|👗
F1 Engineer||Motorsport|🏎️
Archaeologist||History|🏺
Stock Trader||Finance|📈
Scientist||Research|🔬
Dentist||Medicine|🦷
Real Estate Agent||Property|🏠
Travel Blogger||Travel|🧳
Sports Commentator||Media|🎙️
Spy||Top secret|🕶️
Zookeeper||Animals|🦒`),
    mkTopic('t-zomb', 'Zombie Apocalypse Kit', '🧟', 'Weapon, Tool, Supply, Supply, FLEX', 'list', 'emoji', `
Baseball Bat|Weapon|Classic|⚾
Crowbar|Weapon|Opens doors too|🪛
Katana|Weapon|Sharp|⚔️
Frying Pan|Weapon|Cook and fight|🍳
Bow & Arrow|Weapon|Silent|🏹
Chainsaw|Weapon|Loud|🪚
Hockey Stick|Weapon|Canadian option|🏒
Pickaxe|Weapon|Heavy|⛏️
Flashlight|Tool|See in the dark|🔦
Rope|Tool|Climb and tie|🪢
Map|Tool|Know where to go|🗺️
Compass|Tool|Find north|🧭
Radio|Tool|Find survivors|📻
Lighter|Tool|Make fire|🔥
Toolbox|Tool|Fix anything|🧰
Binoculars|Tool|Spot them first|🔭
Pocket Knife|Tool|Multi-tool|🔪
Canned Food|Supply|Lasts years|🥫
Water Bottles|Supply|Stay alive|💧
First Aid Kit|Supply|Patch up|🩹
Batteries|Supply|Power|🔋
Energy Bars|Supply|Quick food|🍫
Sleeping Bag|Supply|Rest|🛌
Duct Tape|Supply|Fixes everything|🩶
Dog|FLEX|Loyal lookout|🐕
Bicycle|FLEX|Silent travel|🚲
Motorbike|FLEX|Fast escape|🏍️
Shopping Cart|FLEX|Carry loot|🛒
Walkie-Talkies|FLEX|Stay in touch|📡
Night-Vision Goggles|FLEX|See everything|🥽`),
  ];
}

function baseTopics() {
  return [
    mkTopic('t-pl', 'Premier League Legends (5-a-side)', '🏆', 'GK, DEF, MID, FWD, FLEX', 'pitch', 'kit', `
Peter Schmeichel|GK|Man Utd · 1991–99
Petr Čech|GK|Chelsea · 2004–15
Edwin van der Sar|GK|Man Utd · 2005–11
David Seaman|GK|Arsenal · 1990–2003
Shay Given|GK|Newcastle · 1997–2009
John Terry|DEF|Chelsea · 1998–2017
Rio Ferdinand|DEF|Man Utd · 2002–14
Nemanja Vidić|DEF|Man Utd · 2006–14
Vincent Kompany|DEF|Man City · 2008–19
Tony Adams|DEF|Arsenal captain
Ashley Cole|DEF|Arsenal & Chelsea
Sol Campbell|DEF|Spurs & Arsenal
Jamie Carragher|DEF|Liverpool one-club man
Steven Gerrard|MID|Liverpool · 1998–2015
Frank Lampard|MID|Chelsea · 2001–14
Paul Scholes|MID|Man Utd · 1993–2013
Patrick Vieira|MID|Arsenal · 1996–2005
Roy Keane|MID|Man Utd · 1993–2005
Cesc Fàbregas|MID|Arsenal & Chelsea
David Beckham|MID|Man Utd · 1992–2003
Ryan Giggs|MID|Man Utd · 13 league titles
Yaya Touré|MID|Man City · 2010–18
David Silva|MID|Man City · 2010–20
Thierry Henry|FWD|Arsenal · 4× Golden Boot
Alan Shearer|FWD|Newcastle · record 260 PL goals
Wayne Rooney|FWD|Man Utd · 2004–17
Didier Drogba|FWD|Chelsea · 2004–12
Cristiano Ronaldo|FWD|Man Utd · 2003–09
Sergio Agüero|FWD|Man City · 2011–21
Dennis Bergkamp|FWD|Arsenal · 1995–2006
Eric Cantona|FWD|Man Utd · 1992–97`),
    mkTopic('t-cf', 'Current Footballers', '⚽', 'GK, DEF, DEF, MID, MID, FWD', 'pitch', 'kit', `
Alisson|GK|Brazil
Gianluigi Donnarumma|GK|Italy
Thibaut Courtois|GK|Belgium
Mike Maignan|GK|France
Emiliano Martínez|GK|Argentina
Virgil van Dijk|DEF|Netherlands
William Saliba|DEF|France
Rúben Dias|DEF|Portugal
Achraf Hakimi|DEF|Morocco
Trent Alexander-Arnold|DEF|England
Alessandro Bastoni|DEF|Italy
Joško Gvardiol|DEF|Croatia
Antonio Rüdiger|DEF|Germany
Jude Bellingham|MID|England
Rodri|MID|Spain · 2024 Ballon d'Or
Pedri|MID|Spain
Declan Rice|MID|England
Federico Valverde|MID|Uruguay
Florian Wirtz|MID|Germany
Jamal Musiala|MID|Germany
Bruno Fernandes|MID|Portugal
Vitinha|MID|Portugal
Kylian Mbappé|FWD|France
Erling Haaland|FWD|Norway
Mohamed Salah|FWD|Egypt
Vinícius Júnior|FWD|Brazil
Lamine Yamal|FWD|Spain
Harry Kane|FWD|England
Bukayo Saka|FWD|England
Ousmane Dembélé|FWD|France · 2025 Ballon d'Or`),
    mkTopic('t-nba', 'NBA Players', '🏀', 'G, G, F, F, C', 'list', 'kit', `
Stephen Curry|G|USA · 2× MVP
Luka Dončić|G|Slovenia · 2024 scoring champ
Shai Gilgeous-Alexander|G|Canada · 2025 MVP
Jalen Brunson|G|USA · All-Star guard
Anthony Edwards|G|USA · All-Star guard
Tyrese Haliburton|G|USA · All-Star guard
Ja Morant|G|USA · 2022 Most Improved
Damian Lillard|G|USA · Dame Time
Kyrie Irving|G|USA · 2016 champion
Donovan Mitchell|G|USA · All-Star guard
Devin Booker|G|USA · 70-point game
LeBron James|F|USA · 4× champion
Kevin Durant|F|USA · 2× Finals MVP
Giannis Antetokounmpo|F|Greece · 2× MVP
Jayson Tatum|F|USA · 2024 champion
Kawhi Leonard|F|USA · 2× Finals MVP
Jimmy Butler|F|USA · Playoff Jimmy
Paolo Banchero|F|USA · 2023 Rookie of the Year
Zion Williamson|F|USA · 2019 No. 1 pick
Jaylen Brown|F|USA · 2024 Finals MVP
Paul George|F|USA · All-NBA wing
Nikola Jokić|C|Serbia · 3× MVP
Joel Embiid|C|Cameroon · 2023 MVP
Victor Wembanyama|C|France · 2024 Rookie of the Year
Anthony Davis|C|USA · 2020 champion
Bam Adebayo|C|USA · Olympic gold
Domantas Sabonis|C|Lithuania · rebounding machine
Karl-Anthony Towns|C|Dominican Rep. · stretch big
Chet Holmgren|C|USA · 2025 champion
Rudy Gobert|C|France · 4× Defensive POY`, { kitShape: 'tank' }),
    mkTopic('t-ff', 'Fast Food Items', '🍔', 'Main, Main, Side, Drink, Dessert', 'list', 'emoji', `
Big Mac|Main|McDonald's|🍔
Whopper|Main|Burger King|🍔
Baconator|Main|Wendy's|🥓
Crunchwrap Supreme|Main|Taco Bell|🌯
Chicken Sandwich|Main|Popeyes|🍗
Chick-fil-A Sandwich|Main|Chick-fil-A|🐔
Double-Double|Main|In-N-Out|🍔
Teen Burger|Main|A&W|🍔
Burrito Bowl|Main|Chipotle|🥗
Zinger|Main|KFC|🌶️
Italian B.M.T.|Main|Subway|🥖
Fries|Side|McDonald's|🍟
Poutine|Side|New York Fries|🧀
Onion Rings|Side|Burger King|🧅
Chicken McNuggets|Side|McDonald's|🍗
Cajun Fries|Side|Popeyes|🌶️
Waffle Fries|Side|Chick-fil-A|🧇
Hash Brown|Side|McDonald's|🥔
Nacho Fries|Side|Taco Bell|🧀
Iced Capp|Drink|Tim Hortons|🧋
Root Beer|Drink|A&W|🥤
Baja Blast|Drink|Taco Bell|🫧
Double-Double Coffee|Drink|Tim Hortons|☕
Frosted Lemonade|Drink|Chick-fil-A|🍋
McFlurry|Dessert|McDonald's|🍦
Frosty|Dessert|Wendy's|🍨
Timbits|Dessert|Tim Hortons|🍩
Blizzard|Dessert|Dairy Queen|🍦
Baked Apple Pie|Dessert|McDonald's|🥧
Cinnabon Delights|Dessert|Taco Bell|🥐`, { scene: 'tray' }),
    ...moreTopics(),
  ];
}

function moreTopics() {
  return [
    mkTopic('t-goat', 'Football GOATs', '🐐', 'GK, DEF, DEF, MID, MID, FWD', 'pitch', 'kit', `
Lev Yashin|GK|Soviet Union · 1963 Ballon d'Or
Gianluigi Buffon|GK|Italy · 2006 World Cup
Manuel Neuer|GK|Germany · 2014 World Cup
Iker Casillas|GK|Spain · 2010 World Cup
Oliver Kahn|GK|Germany · 2002 Golden Ball
Paolo Maldini|DEF|Italy · 5× European champion
Franz Beckenbauer|DEF|Germany · Der Kaiser
Sergio Ramos|DEF|Spain · 4× Champions League
Cafu|DEF|Brazil · 2× World Cup
Roberto Carlos|DEF|Brazil · that free kick
Fabio Cannavaro|DEF|Italy · 2006 Ballon d'Or
Carles Puyol|DEF|Spain · 2010 World Cup
Philipp Lahm|DEF|Germany · 2014 World Cup captain
Zinedine Zidane|MID|France · 1998 World Cup
Johan Cruyff|MID|Netherlands · 3× Ballon d'Or
Andrés Iniesta|MID|Spain · 2010 World Cup winner
Xavi|MID|Spain · tiki-taka
Luka Modrić|MID|Croatia · 2018 Ballon d'Or
Andrea Pirlo|MID|Italy · the Architect
Kaká|MID|Brazil · 2007 Ballon d'Or
Ronaldinho|MID|Brazil · 2005 Ballon d'Or
Diego Maradona|MID|Argentina · 1986 World Cup
Lothar Matthäus|MID|Germany · 1990 World Cup
Lionel Messi|FWD|Argentina · 8× Ballon d'Or
Cristiano Ronaldo|FWD|Portugal · 5× Ballon d'Or
Pelé|FWD|Brazil · 3× World Cup
Ronaldo Nazário|FWD|Brazil · R9
Zlatan Ibrahimović|FWD|Sweden · 500+ goals
Robert Lewandowski|FWD|Poland · goal machine
Marco van Basten|FWD|Netherlands · 3× Ballon d'Or
Karim Benzema|FWD|France · 2022 Ballon d'Or`),
    mkTopic('t-nbal', 'NBA Legends', '🏅', 'G, G, F, F, C', 'list', 'kit', `
Michael Jordan|G|USA · 6× champion
Kobe Bryant|G|USA · 5× champion
Magic Johnson|G|USA · 5× champion
Allen Iverson|G|USA · 2001 MVP
Dwyane Wade|G|USA · 3× champion
Steve Nash|G|Canada · 2× MVP
Jerry West|G|USA · the Logo
Isiah Thomas|G|USA · 2× champion
Jason Kidd|G|USA · triple-double king
Gary Payton|G|USA · 1996 Defensive POY
Vince Carter|G|USA · Vinsanity
Larry Bird|F|USA · 3× MVP
Tim Duncan|F|US Virgin Islands · 5× champion
Kevin Garnett|F|USA · 2004 MVP
Dirk Nowitzki|F|Germany · 2011 Finals MVP
Charles Barkley|F|USA · 1993 MVP
Scottie Pippen|F|USA · 6× champion
Julius Erving|F|USA · Dr. J
Karl Malone|F|USA · 2× MVP
Dennis Rodman|F|USA · rebounding king
Shaquille O'Neal|C|USA · 4× champion
Kareem Abdul-Jabbar|C|USA · 6× MVP
Hakeem Olajuwon|C|Nigeria · 2× Finals MVP
Wilt Chamberlain|C|USA · 100-point game
Bill Russell|C|USA · 11× champion
Patrick Ewing|C|USA · Hall of Famer
David Robinson|C|USA · 1995 MVP
Moses Malone|C|USA · 3× MVP
Dikembe Mutombo|C|DR Congo · 4× Defensive POY
Yao Ming|C|China · Hall of Famer`, { kitShape: 'tank' }),
    mkTopic('t-nhl', 'NHL Players', '🏒', 'G, D, D, F, F, F', 'list', 'kit', `
Connor Hellebuyck|G|USA · 2025 Hart Trophy
Igor Shesterkin|G|Russia · Vezina winner
Andrei Vasilevskiy|G|Russia · 2× Stanley Cup
Juuse Saros|G|Finland
Jake Oettinger|G|USA
Cale Makar|D|Canada · Norris winner
Quinn Hughes|D|USA · Norris winner
Adam Fox|D|USA · Norris winner
Victor Hedman|D|Sweden · 2× Stanley Cup
Roman Josi|D|Switzerland · Norris winner
Miro Heiskanen|D|Finland
Rasmus Dahlin|D|Sweden · 2018 No. 1 pick
Zach Werenski|D|USA
Evan Bouchard|D|Canada
Connor McDavid|F|Canada · Hart Trophy winner
Nathan MacKinnon|F|Canada · 2024 Hart Trophy
Auston Matthews|F|USA · 2022 Hart Trophy
Leon Draisaitl|F|Germany · 2020 Hart Trophy
Nikita Kucherov|F|Russia · 2× Stanley Cup
David Pastrňák|F|Czechia · sniper
Sidney Crosby|F|Canada · 3× Stanley Cup
Alex Ovechkin|F|Russia · all-time goals leader
Mitch Marner|F|Canada · playmaker
William Nylander|F|Sweden
Matthew Tkachuk|F|USA · 2× Stanley Cup
Jack Hughes|F|USA · 2019 No. 1 pick
Kirill Kaprizov|F|Russia
Macklin Celebrini|F|Canada · 2024 No. 1 pick
Connor Bedard|F|Canada · 2024 Calder Trophy
Jack Eichel|F|USA · 2023 Stanley Cup`),
    mkTopic('t-nfl', 'NFL Stars', '🏈', 'QB, RB, WR, WR, TE, DEF', 'list', 'kit', `
Patrick Mahomes|QB|3× Super Bowl champ
Josh Allen|QB|2024 MVP
Lamar Jackson|QB|2× MVP
Joe Burrow|QB|Franchise QB
Jalen Hurts|QB|Super Bowl LIX MVP
Tom Brady|QB|7× Super Bowl champ
Peyton Manning|QB|5× MVP
Saquon Barkley|RB|2,000-yard season
Derrick Henry|RB|King Henry
Christian McCaffrey|RB|2023 Offensive POY
Bijan Robinson|RB|Dual threat
Jahmyr Gibbs|RB|Home-run speed
Justin Jefferson|WR|Route-running wizard
Ja'Marr Chase|WR|Triple crown receiver
CeeDee Lamb|WR|Star receiver
Tyreek Hill|WR|The Cheetah
Jerry Rice|WR|All-time receiving leader
Randy Moss|WR|Deep-ball legend
Puka Nacua|WR|Rookie record breaker
Amon-Ra St. Brown|WR|Catch machine
Travis Kelce|TE|3× Super Bowl champ
George Kittle|TE|All-Pro tight end
Rob Gronkowski|TE|4× Super Bowl champ
Brock Bowers|TE|Rookie record holder
Aaron Donald|DEF|3× Defensive POY
T.J. Watt|DEF|2021 Defensive POY
Myles Garrett|DEF|2023 Defensive POY
Micah Parsons|DEF|Pass rusher
Lawrence Taylor|DEF|1986 MVP
Ray Lewis|DEF|2× Super Bowl champ`),
    mkTopic('t-club', 'Football Clubs', '🏟️', 'ENG, ESP, ITA, GER, FLEX', 'list', 'kit', `
Man City|ENG|England
Arsenal|ENG|England
Liverpool|ENG|England
Man Utd|ENG|England
Chelsea|ENG|England
Tottenham|ENG|England
Newcastle|ENG|England
Aston Villa|ENG|England
Real Madrid|ESP|Spain
Barcelona|ESP|Spain
Atlético Madrid|ESP|Spain
Sevilla|ESP|Spain
Real Sociedad|ESP|Spain
Inter|ITA|Italy
AC Milan|ITA|Italy
Juventus|ITA|Italy
Napoli|ITA|Italy
Roma|ITA|Italy
Bayern Munich|GER|Germany
Dortmund|GER|Germany
Bayer Leverkusen|GER|Germany
RB Leipzig|GER|Germany
PSG|FLEX|France
Ajax|FLEX|Netherlands
Benfica|FLEX|Portugal
Porto|FLEX|Portugal
Celtic|FLEX|Scotland
Al Nassr|FLEX|Saudi Arabia
Inter Miami|FLEX|USA
Galatasaray|FLEX|Turkey
Boca Juniors|FLEX|Argentina`, { kitLabel: 'initials' }),
    mkTopic('t-rap', 'Rappers', '🎤', 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'list', 'emoji', `
Drake||Toronto|🦉
Kendrick Lamar||Compton|👑
J. Cole||Fayetteville|🌳
Travis Scott||Houston|🌵
Eminem||Detroit|🎤
Kanye West||Chicago|🐻
Jay-Z||Brooklyn|💎
Lil Wayne||New Orleans|🎺
Nicki Minaj||Queens|💖
Tupac||West Coast legend|🌹
The Notorious B.I.G.||Brooklyn legend|👑
Nas||Queensbridge|📜
Snoop Dogg||Long Beach|🐶
50 Cent||Queens|💵
Future||Atlanta|🚀
Lil Baby||Atlanta|👶
21 Savage||Atlanta|🔪
Tyler, the Creator||Los Angeles|🌸
A$AP Rocky||Harlem|🕶️
Cardi B||The Bronx|💅
Megan Thee Stallion||Houston|🐎
Post Malone||Dallas|🎸
Juice WRLD||Chicago|🌍
Pop Smoke||Brooklyn|💨
Central Cee||London|🇬🇧
Stormzy||London|⚡
Dave||London|🎹
Playboi Carti||Atlanta|🧛
Dr. Dre||Compton|🎧
Metro Boomin||Producer|🎛️`),
    mkTopic('t-ani', 'Animal Fight Squad', '🦁', 'Land, Land, Sea, Air, FLEX', 'list', 'emoji', `
Lion|Land|King of the jungle|🦁
Tiger|Land|Biggest cat alive|🐅
Grizzly Bear|Land|Half a tonne of muscle|🐻
Gorilla|Land|Silverback strength|🦍
Elephant|Land|Biggest land animal|🐘
Rhino|Land|Armoured tank|🦏
Hippo|Land|Scarier than it looks|🦛
Wolf|Land|Hunts in packs|🐺
Honey Badger|Land|Fears nothing|🦡
Komodo Dragon|Land|Venomous bite|🦎
Crocodile|Land|Death roll|🐊
Kangaroo|Land|Kickboxer|🦘
Bull|Land|Pure charge|🐂
Cheetah|Land|Fastest on land|🐆
Great White Shark|Sea|Apex predator|🦈
Orca|Sea|Hunts sharks|🐋
Giant Squid|Sea|Deep-sea monster|🦑
Octopus|Sea|Eight arms, big brain|🐙
Blue Whale|Sea|Largest animal ever|🐳
Swordfish|Sea|Built-in blade|🐟
Pufferfish|Sea|Poisonous|🐡
Dolphin|Sea|Smartest in the sea|🐬
Bald Eagle|Air|Talons of steel|🦅
Owl|Air|Silent hunter|🦉
Bat|Air|Echolocation|🦇
Swan|Air|Surprisingly violent|🦢
Parrot|Air|Trash talker|🦜
Flamingo|Air|Stands on one leg|🦩
Mosquito|Air|Deadliest animal|🦟
Hornet|Air|Painful sting|🐝`),
    mkTopic('t-pow', 'Superpowers', '⚡', 'Power 1, Power 2, Power 3', 'list', 'emoji', `
Flight||Go anywhere by air|🕊️
Invisibility||Nobody sees you|👻
Teleportation||Instant travel|🌀
Time Travel||Past and future|⏳
Super Strength||Lift a bus|💪
Mind Reading||Hear every thought|🧠
Super Speed||Faster than sound|⚡
Healing||Fix any wound|💚
Immortality||Live forever|♾️
Shapeshifting||Become anyone|🦎
Telekinesis||Move things with your mind|🪄
Freeze Time||Pause the world|⏸️
X-Ray Vision||See through walls|👁️
Control Weather||Storms on demand|⛈️
Fire Powers||Throw fireballs|🔥
Ice Powers||Freeze anything|❄️
Talk to Animals||Every species|🐾
Speak Every Language||Fluent in all of them|🗣️
Super Intelligence||Smartest person alive|🤓
Mind Control||Bend anyone's will|🎭
Clone Yourself||Be in two places|👯
Elasticity||Stretch like rubber|🤸
Breathe Underwater||Live in the ocean|🫧
Night Vision||See in the dark|🌙
Super Luck||Always win|🍀
Force Field||Nothing can hurt you|🛡️
Laser Eyes||Pew pew|🔴
Infinite Money||Never broke again|💸
Never Need Sleep||24 hours a day|😴
Photographic Memory||Remember everything|📸`),
    mkTopic('t-trav', 'Travel Destinations', '✈️', 'City, City, Beach, Nature, FLEX', 'list', 'emoji', `
Tokyo|City|Japan|🇯🇵
Paris|City|France|🇫🇷
New York|City|USA|🇺🇸
Dubai|City|UAE|🇦🇪
London|City|UK|🇬🇧
Istanbul|City|Turkey|🇹🇷
Rome|City|Italy|🇮🇹
Barcelona|City|Spain|🇪🇸
Seoul|City|South Korea|🇰🇷
Bangkok|City|Thailand|🇹🇭
Marrakech|City|Morocco|🇲🇦
Cairo|City|Egypt|🇪🇬
Amsterdam|City|Netherlands|🇳🇱
Lisbon|City|Portugal|🇵🇹
Kyoto|City|Japan|⛩️
Singapore|City|Singapore|🇸🇬
Sydney|City|Australia|🇦🇺
Bali|Beach|Indonesia|🇮🇩
Maldives|Beach|Maldives|🇲🇻
Santorini|Beach|Greece|🇬🇷
Rio de Janeiro|Beach|Brazil|🇧🇷
Cancún|Beach|Mexico|🇲🇽
Bora Bora|Beach|French Polynesia|🏝️
Zanzibar|Beach|Tanzania|🇹🇿
Hawaii|Beach|USA|🌺
Banff|Nature|Canada|🇨🇦
Iceland|Nature|Northern lights|🇮🇸
Cape Town|Nature|South Africa|🇿🇦
Swiss Alps|Nature|Switzerland|🇨🇭
Machu Picchu|Nature|Peru|🇵🇪
Grand Canyon|Nature|USA|🏜️`),
    mkTopic('t-snk', 'Snacks & Candy', '🍫', 'Salty, Sweet, Sweet, FLEX', 'list', 'emoji', `
Doritos|Salty|Nacho cheese|🔺
Lay's Classic|Salty|Potato chips|🥔
Pringles|Salty|Once you pop|🥫
Cheetos|Salty|Cheesy|🧀
Hot Cheetos|Salty|Flamin' hot|🔥
Takis|Salty|Rolled and spicy|🌶️
Ruffles|Salty|Ridged chips|🥔
Miss Vickie's|Salty|Kettle cooked|🥔
Pretzels|Salty|Twisted|🥨
Popcorn|Salty|Movie night|🍿
Kit Kat|Sweet|Have a break|🍫
Reese's|Sweet|Peanut butter cups|🥜
Snickers|Sweet|Nougat and caramel|🍫
Kinder Bueno|Sweet|Hazelnut wafer|🍫
Twix|Sweet|Left or right|🍫
Oreos|Sweet|Twist, lick, dunk|🍪
Ferrero Rocher|Sweet|Fancy|🌰
Aero|Sweet|Bubbly chocolate|🫧
Coffee Crisp|Sweet|Canadian classic|☕
Caramilk|Sweet|Caramel secret|🍫
Mars Bar|Sweet|Caramel and nougat|🪐
Smarties|Sweet|Candy-coated|🍬
M&M's|Sweet|Melts in your mouth|🔴
Skittles|Sweet|Taste the rainbow|🌈
Sour Patch Kids|Sweet|Sour then sweet|🍬
Haribo Goldbears|Sweet|Gummy bears|🐻
Swedish Berries|Sweet|Chewy|🍓
Fuzzy Peach|Sweet|Sour sugar coat|🍑
Nerds Gummy Clusters|Sweet|Crunchy and gummy|🍭
Twizzlers|Sweet|Licorice twists|🍒`),
    mkTopic('t-dish', 'World Dishes', '🍛', 'Main, Main, Side, Dessert', 'list', 'emoji', `
Biryani|Main|South Asia|🍛
Sushi|Main|Japan|🍣
Pizza Margherita|Main|Italy|🍕
Ramen|Main|Japan|🍜
Tacos al Pastor|Main|Mexico|🌮
Butter Chicken|Main|India|🍗
Shawarma|Main|Middle East|🥙
Pad Thai|Main|Thailand|🍤
Pho|Main|Vietnam|🍜
Paella|Main|Spain|🥘
Jollof Rice|Main|West Africa|🍚
Korean BBQ|Main|South Korea|🥩
Kabsa|Main|Saudi Arabia|🍖
Nihari|Main|Pakistan|🍲
Dim Sum|Main|China|🥟
Mac & Cheese|Main|USA|🧀
Falafel|Side|Middle East|🧆
Poutine|Side|Canada|🍟
Samosas|Side|South Asia|🥟
Hummus|Side|Levant|🫓
Garlic Naan|Side|India|🫓
Kimchi|Side|South Korea|🥬
Baklava|Dessert|Turkey|🍯
Kunafa|Dessert|Levant|🧀
Gulab Jamun|Dessert|South Asia|🍡
Tiramisu|Dessert|Italy|🍰
Churros|Dessert|Spain|🥖
Mochi|Dessert|Japan|🍡
Crème Brûlée|Dessert|France|🍮
Pastel de Nata|Dessert|Portugal|🥧`),
    mkTopic('t-game', 'Video Games', '🎮', 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'list', 'emoji', `
Minecraft||2011 · sandbox|⛏️
GTA V||2013 · open world|🚗
EA Sports FC||Football|⚽
Fortnite||Battle royale|🪂
Call of Duty: Black Ops||Shooter|🎖️
Red Dead Redemption 2||2018 · western|🤠
Zelda: Breath of the Wild||2017 · adventure|🗡️
Mario Kart 8||Racing|🏎️
Elden Ring||2022 · soulslike|🐉
God of War||2018 · action|🪓
The Last of Us||2013 · story|🍄
Rocket League||Car football|🚀
Among Us||Social deduction|👨‍🚀
Pokémon Red & Blue||1996 · classic|🎒
Wii Sports||2006 · party|🎳
Tetris||1984 · puzzle|🧱
Halo 3||2007 · shooter|🪖
Spider-Man (PS4)||2018 · superhero|🕷️
NBA 2K||Basketball|🏀
Clash Royale||Mobile|👑
Overwatch||Hero shooter|🎯
League of Legends||MOBA|🏰
Valorant||Tactical shooter|💥
Apex Legends||Battle royale|🦾
Super Smash Bros. Ultimate||Fighting|🥊
Animal Crossing||Cozy|🍃
Skyrim||2011 · RPG|🛡️
Roblox||Everything|🟥
The Witcher 3||2015 · RPG|🐺
Hollow Knight||2017 · indie|🪲`),
    mkTopic('t-car', 'Cars', '🏎️', 'Supercar, Daily, SUV, Classic, FLEX', 'list', 'emoji', `
Lamborghini Aventador|Supercar|V12 monster|🏎️
Bugatti Chiron|Supercar|1,500 hp|🏎️
McLaren P1|Supercar|Hybrid hypercar|🏎️
Porsche 911 GT3|Supercar|Track weapon|🏎️
Koenigsegg Jesko|Supercar|Swedish rocket|🚀
Ferrari LaFerrari|Supercar|Prancing horse|🐎
Ford GT|Supercar|Le Mans legend|🏁
Toyota Corolla|Daily|Never breaks|🚗
Honda Civic|Daily|Everyone's first car|🚗
Tesla Model 3|Daily|Electric|🔋
BMW M3|Daily|Sports sedan|🚗
VW Golf GTI|Daily|Hot hatch|🚗
Hyundai Elantra N|Daily|Budget fun|🚗
Range Rover|SUV|Luxury off-roader|🚙
Mercedes G-Wagon|SUV|The box|🚙
Lamborghini Urus|SUV|Super SUV|🚙
Jeep Wrangler|SUV|Doors off|🚙
Tesla Model X|SUV|Falcon doors|🦅
Toyota Land Cruiser|SUV|Goes anywhere|🚙
Rolls-Royce Cullinan|SUV|Pure luxury|👑
Rivian R1T|SUV|Electric truck|🛻
Ferrari F40|Classic|1987 icon|🏎️
Nissan Skyline GT-R R34|Classic|JDM legend|🚘
Mazda RX-7|Classic|Rotary engine|🚘
Toyota AE86|Classic|Drift king|🚘
Ford Mustang '67|Classic|Muscle car|🐎
Chevrolet Camaro '69|Classic|Muscle car|🚘
Mercedes 300SL Gullwing|Classic|1954 beauty|🕊️
Lamborghini Countach|Classic|Poster car|🚘
Toyota Supra Mk4|Classic|2JZ power|🚘`),
    mkTopic('t-shoe', 'Sneakers', '👟', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
Air Jordan 1||Nike · 1985|👟
Air Force 1||Nike · 1982|👟
Nike Dunk Low||Nike|👟
Adidas Samba||Adidas|👟
New Balance 550||New Balance|👟
Air Max 90||Nike|👟
Air Max 97||Nike · silver bullet|👟
Air Jordan 4||Nike|👟
Air Jordan 11||Nike · patent leather|👟
Air Jordan 5||Nike|👟
Air Jordan 3||Nike|👟
Converse Chuck 70||Converse|👟
Vans Old Skool||Vans|👟
Adidas Superstar||Adidas · shell toe|👟
Adidas Gazelle||Adidas|👟
New Balance 990||New Balance|👟
Asics Gel-Kayano 14||Asics|👟
Nike Blazer||Nike|👟
Salomon XT-6||Salomon|🏔️
Nike Vomero 5||Nike|👟
On Cloud||On|☁️
Puma Suede||Puma|👟
Reebok Club C||Reebok|👟
Nike Cortez||Nike|👟
Crocs||Crocs · love them or hate them|🐊
Timberland 6-Inch Boot||Timberland|🥾
Birkenstock Boston||Birkenstock|🩴
UGG Boots||UGG|🥾
Nike Air Max Plus||Nike · TN|👟
Adidas Ultraboost||Adidas|👟`),
    mkTopic('t-drink', 'Drinks', '🧋', 'Hot, Cold, Fizzy, FLEX', 'list', 'emoji', `
Double-Double|Hot|Tim Hortons|☕
Chai Latte|Hot|Spiced tea|🍵
Matcha Latte|Hot|Green tea|🍵
Hot Chocolate|Hot|Winter classic|☕
Karak Chai|Hot|Strong and sweet|🫖
Turkish Coffee|Hot|Thick and strong|☕
Spanish Latte|Hot|Condensed milk|☕
Bubble Tea|Cold|Tapioca pearls|🧋
Mango Lassi|Cold|Yogurt and mango|🥭
Strawberry Smoothie|Cold|Blended fruit|🍓
Iced Coffee|Cold|Over ice|🧊
Arizona Iced Tea|Cold|99 cents|🥫
Orange Juice|Cold|Fresh squeezed|🍊
Mint Lemonade|Cold|Lemon and mint|🍋
Chocolate Milk|Cold|After school|🥛
Coconut Water|Cold|Straight from the coconut|🥥
Ice Water|Cold|Simple|💧
Iced Capp|Cold|Tim Hortons|🧋
Coca-Cola|Fizzy|The original|🥤
Pepsi|Fizzy|The rival|🥤
Sprite|Fizzy|Lemon-lime|🍋
Dr Pepper|Fizzy|23 flavours|🥤
Root Beer|Fizzy|A&W|🥤
Canada Dry|Fizzy|Ginger ale|🫚
Fanta Orange|Fizzy|Orange soda|🍊
Mountain Dew|Fizzy|Neon green|💚
Red Bull|Fizzy|Energy drink|🐂
Celsius|Fizzy|Energy drink|⚡
Vimto|Fizzy|Ramadan classic|🍇
Crush Cream Soda|Fizzy|Pink and sweet|🩷`),
    mkTopic('t-app', 'Phone Apps', '📱', 'App 1, App 2, App 3, App 4, App 5', 'list', 'emoji', `
Instagram||Photos and reels|📸
TikTok||Short videos|🎵
Snapchat||Streaks|👻
YouTube||Videos|▶️
WhatsApp||Group chats|💬
Spotify||Music|🎧
Netflix||Shows and movies|🍿
X||Posts|✖️
Reddit||Forums|👽
Discord||Voice chat|🎮
Google Maps||Directions|🗺️
Uber Eats||Food delivery|🛵
DoorDash||Food delivery|🥡
Amazon||Shopping|📦
Twitch||Live streams|🟣
Pinterest||Ideas|📌
Duolingo||Language streaks|🦉
Shazam||Name that song|🎶
FaceTime||Video calls|📹
Apple Music||Music|🎼
Notes||Everything else|📝
Calculator||Quick maths|🧮
Clash of Clans||Strategy game|⚔️
BeReal||Daily photo|📷
Threads||Posts|🧵
Uber||Rides|🚕
Airbnb||Places to stay|🏠
Wealthsimple||Investing|📈
Tim Hortons||Coffee orders|☕
Google Translate||Any language|🌐`),
    mkTopic('t-myth', 'Mythical Creatures', '🐉', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
Dragon||Breathes fire|🐉
Phoenix||Rises from ashes|🔥
Unicorn||Magic horn|🦄
Griffin||Lion and eagle|🦅
Kraken||Sea monster|🦑
Vampire||Never dies|🧛
Werewolf||Full moon|🐺
Mermaid||Half fish|🧜
Genie||Three wishes|🧞
Yeti||Himalayan snowman|❄️
Bigfoot||Forest giant|🦶
Loch Ness Monster||Scotland's secret|🦕
Cyclops||One eye|👁️
Minotaur||Bull-headed|🐂
Medusa||Stone gaze|🐍
Centaur||Half horse|🏹
Pegasus||Winged horse|🐎
Hydra||Grows new heads|🐲
Zombie||Undead|🧟
Ghost||Haunts houses|👻
Fairy||Tiny magic|🧚
Troll||Under the bridge|🧌
Basilisk||Deadly stare|🦎
Cerberus||Three-headed dog|🐕
Chupacabra||Goat sucker|🐐
Thunderbird||Storm bringer|⚡
Leviathan||Ocean titan|🐋
Golem||Stone giant|🗿
Sphinx||Riddles|🦁
Elf||Bow and arrow|🧝`),
    mkTopic('t-toon', 'Childhood Cartoons', '📺', 'Pick 1, Pick 2, Pick 3, Pick 4', 'list', 'emoji', `
SpongeBob SquarePants||Nickelodeon · 1999|🧽
Avatar: The Last Airbender||Nickelodeon · 2005|🌪️
Phineas and Ferb||Disney · 2007|🔺
Ben 10||Cartoon Network · 2005|⌚
Teen Titans||Cartoon Network · 2003|🦸
The Fairly OddParents||Nickelodeon · 2001|🪄
Kim Possible||Disney · 2002|📟
Ed, Edd n Eddy||Cartoon Network · 1999|🍬
Courage the Cowardly Dog||Cartoon Network · 1999|🐕
Dexter's Laboratory||Cartoon Network · 1996|🧪
The Powerpuff Girls||Cartoon Network · 1998|💥
Johnny Bravo||Cartoon Network · 1997|🕶️
Scooby-Doo||Classic|🐶
Tom and Jerry||Classic|🐭
Looney Tunes||Classic|🥕
Pokémon||Anime · 1997|⚡
Dragon Ball Z||Anime · 1989|🐉
Naruto||Anime · 2002|🍥
Yu-Gi-Oh!||Anime · 2000|🃏
The Amazing World of Gumball||Cartoon Network · 2011|🐱
Adventure Time||Cartoon Network · 2010|🗡️
Regular Show||Cartoon Network · 2010|🦝
Codename: Kids Next Door||Cartoon Network · 2002|🌳
Total Drama Island||Teletoon · 2007|🏕️
6teen||Teletoon · 2004|🛍️
Arthur||PBS · 1996|📚
Recess||Disney · 1997|🏫
Hey Arnold!||Nickelodeon · 1996|🏈
Rugrats||Nickelodeon · 1991|🍼
Jimmy Neutron||Nickelodeon · 2002|🧠`),
  ];
}

