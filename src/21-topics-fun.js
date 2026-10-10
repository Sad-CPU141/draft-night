function funTopicsV3() {
  const F = 'Just for Fun';
  const list = (id, name, emoji, slots, text) => mkT(id, name, emoji, F, slots, '', text);
  return [
    list('t-redflags', 'Biggest Red Flags', '🚩', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Rude to waiters|||🚩
Never says sorry|||🙅
Always on their phone|||📱
Only talks about themselves|||🗣️
Lies about small things|||🤥
Ghosts people|||👻
Never pays you back|||💸
Jealous of your friends|||😒
Hates all animals|||🐾
Chews with mouth open|||😬
Spoils films on purpose|||🎬
Always late|||⏰
Reads your messages|||👀
Bad-mouths every ex|||💬
Cheats at board games|||🎲
Never texts back|||📵
Can't take a joke|||😤
Rude to their parents|||👪
Rage-quits every game|||🎮
Talks during films|||🍿
Never tries new food|||🥦
Leaves dishes for days|||🍽️
Takes credit for your work|||🏆
Copies your homework, then gets a better mark|||📝
Says "no offence" before being offensive|||😶`),
    list('t-greenflags', 'Green Flags', '💚', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Remembers small details|||🧠
Kind to waiters|||🍽️
Good with kids and animals|||🐶
Laughs at your jokes|||😂
Says sorry and means it|||🙏
Keeps promises|||🤝
Texts back|||💬
Makes plans|||📅
Supports your goals|||🚀
Cooks for you|||🍳
Great listener|||👂
Respects boundaries|||🚧
Gets on with your friends|||🧑‍🤝‍🧑
Honest even when it's hard|||💯
Shares food|||🍕
Has their own hobbies|||🎨
Calls their mum|||📞
Always on time|||⏱️
Admits when they're wrong|||🙋
Hypes you up|||📣
Keeps their room clean|||🧹
Good playlist|||🎧
Patient driver|||🚗
Generous with their time|||⌛
Celebrates your wins|||🎉`),
    list('t-skills', 'Skills Everyone Should Learn', '🧰', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Cooking|||🍳
Swimming|||🏊
First aid and CPR|||⛑️
Driving|||🚗
Budgeting|||💰
Changing a tyre|||🛞
Basic coding|||💻
Public speaking|||🎤
Touch typing|||⌨️
A second language|||🗣️
Negotiating|||🤝
Time management|||⏰
Basic car maintenance|||🔧
Ironing|||👔
Sewing a button|||🪡
Self-defence|||🥋
Reading a map|||🗺️
Writing a CV|||📄
Cleaning properly|||🧽
Saving and investing|||📈
Starting a fire safely|||🔥
Gardening|||🌱
Photography|||📷
Cooking for a group|||🍲
Fixing things yourself|||🔨`),
    list('t-splurge', 'Things Worth Splurging On', '💳', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A good mattress|||🛏️
Good shoes|||👟
Your phone|||📱
Headphones|||🎧
A winter coat|||🧥
An office chair|||🪑
Travel|||✈️
Concert tickets|||🎫
Gaming setup|||🎮
Dental care|||🦷
Gym membership|||🏋️
Kitchen knives|||🔪
Laptop|||💻
A good haircut|||💈
A watch|||⌚
A reliable car|||🚗
Suitcase|||🧳
Fragrance|||🧴
Coffee machine|||☕
Bedsheets|||🛌
Glasses|||👓
Tyres|||🛞
Experiences with friends|||🧑‍🤝‍🧑
Courses and education|||🎓
Running shoes|||🏃`),
    list('t-waste', 'Biggest Wastes of Money', '🗑️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Extended warranties|||📜
Lottery tickets|||🎟️
Unused gym membership|||🏋️
Bottled water at home|||💧
Hotel minibar|||🍫
Airport food|||✈️
Impulse buys|||🛒
Late fees|||⏰
Subscriptions you forgot about|||🔁
Fast-fashion hauls|||👗
NFTs|||🖼️
Loot boxes|||🎁
Fancy gift wrap|||🎀
Cinema snacks|||🍿
Delivery fees|||🛵
New phone every year|||📱
Resale ticket mark-ups|||🎫
Skins you never use|||🎮
Car add-ons nobody needs|||🚗
Designer phone cases|||📱
Bank fees|||🏦
Diet teas and fads|||🍵
Novelty gadgets|||🔌
Paying for apps you never open|||📲`),
    list('t-partybring', 'Things to Bring to a Party', '🎉', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Speaker|||🔊
Snacks|||🍿
Pizza|||🍕
Drinks|||🥤
Ice|||🧊
Cups|||🥤
Board game|||🎲
Uno cards|||🃏
Phone charger|||🔌
A great playlist|||🎶
Games console|||🎮
Dessert|||🍰
Chips and dip|||🥣
Glow sticks|||✨
Balloons|||🎈
Cake|||🎂
Extra chairs|||🪑
Fairy lights|||💡
Karaoke mic|||🎤
Instant camera|||📸
A football|||⚽
Napkins|||🧻
Your best friend|||🧑‍🤝‍🧑
Good energy|||⚡`),
    list('t-business', 'Dream Businesses', '🏪', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Coffee shop|||☕
Bakery|||🥐
Gaming café|||🎮
Sneaker store|||👟
Food truck|||🚚
Car dealership|||🚗
Clothing brand|||👕
Restaurant|||🍽️
Gym|||🏋️
Barbershop|||💈
Tech startup|||💻
YouTube channel|||▶️
Bookshop|||📚
Hotel|||🏨
Travel agency|||✈️
Ice cream parlour|||🍦
Car wash|||🧽
Phone repair shop|||📱
Record label|||🎵
Esports team|||🏆
Football club|||⚽
Bubble tea shop|||🧋
Real estate company|||🏠
Mobile app|||📲
Theme park|||🎢
Dessert café|||🍰
Car detailing studio|||✨`),
    list('t-worldslive', 'Fictional Worlds to Live In', '🌈', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Hogwarts|Harry Potter||🧙
The Shire|The Lord of the Rings||🏡
Wakanda|Black Panther||🐆
Pandora|Avatar||🌿
Narnia|The Chronicles of Narnia||🦁
Naboo|Star Wars||🌌
The Pokémon World|Pokémon||⚡
Hyrule|The Legend of Zelda||🗡️
Mushroom Kingdom|Super Mario||🍄
Bikini Bottom|SpongeBob||🍍
Springfield|The Simpsons||🍩
Asgard|Marvel||⚡
Willy Wonka's Chocolate Factory|Charlie and the Chocolate Factory||🍫
Neverland|Peter Pan||🧚
Arendelle|Frozen||❄️
Animal Crossing Island|Animal Crossing||🏝️
A Minecraft World|Minecraft||⛏️
Zootopia|Zootopia||🦊
Monstropolis|Monsters, Inc.||👁️
The Four Nations|Avatar: The Last Airbender||🌊
Hidden Leaf Village|Naruto||🍥
The Grand Line|One Piece||🏴‍☠️
Pelican Town|Stardew Valley||🌾
Themyscira|Wonder Woman||🏛️
Atlantis|Aquaman||🔱`),
    list('t-worldsavoid', 'Fictional Worlds to Avoid', '☠️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Gotham City|Batman||🦇
Panem|The Hunger Games||🏹
The Upside Down|Stranger Things||🙃
Westeros|Game of Thrones||🐉
Mordor|The Lord of the Rings||🌋
Raccoon City|Resident Evil||🧟
Isla Nublar|Jurassic Park||🦖
The Matrix|The Matrix||💊
Silent Hill|Silent Hill||🌫️
Rapture|BioShock||🌊
The Wasteland|Fallout||☢️
Night City|Cyberpunk 2077||🌃
The Purge|The Purge||🔪
The Fury Road|Mad Max||🚗
The Squid Game Island|Squid Game||🦑
The Walking Dead World|The Walking Dead||🧟
Jumanji|Jumanji||🎲
Azkaban|Harry Potter||⛓️
Arrakis|Dune||🏜️
Lordran|Dark Souls||🔥
Los Santos|GTA V||🚓
The Hunger Games Arena|The Hunger Games||🔥
Hellfire Club Hawkins|Stranger Things||🎲`),
    list('t-annoying', 'Most Annoying Things', '😤', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Slow walkers|||🐢
Loud chewing|||😬
Phone at 1%|||🪫
Stubbing your toe|||🦶
Lag in online games|||📶
Spoilers|||🙉
Buffering|||⏳
Popcorn in your teeth|||🍿
Wet socks|||🧦
Tangled earphones|||🎧
Someone reading your screen|||👀
Autocorrect fails|||🔤
Mosquito at night|||🦟
Reply-all emails|||📧
Pop-up ads|||🪧
Losing the remote|||📺
Unskippable ads|||⏭️
Group chat spam|||💬
Sand in your shoes|||🏖️
Brain freeze|||🧊
Paper cuts|||📄
Forgetting why you walked in|||🚪
Traffic|||🚗
Hold music|||☎️
A song stuck in your head|||🎶`),
    list('t-satisfying', 'Most Satisfying Things', '😌', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Peeling the film off a new screen|||📱
Popping bubble wrap|||🫧
First sip of cold water|||💧
Perfect parallel park|||🅿️
A clean room|||🧹
Fresh sheets|||🛏️
Ticking off a to-do list|||✅
A fresh haircut|||💈
Pressure washing|||🚿
Kinetic sand|||⏳
The last puzzle piece|||🧩
A perfectly ripe avocado|||🥑
Unboxing new tech|||📦
Game-winning shot|||🏀
Rain on the window|||🌧️
Fresh snow, no footprints|||❄️
Phone at 100%|||🔋
Warm laundry from the dryer|||🧺
Perfect toast|||🍞
Opening a new jar|||🫙
Cleaning the lint filter|||🌀
Mechanical keyboard clicks|||⌨️
Ice cracking in a drink|||🧊
Everything fitting in one trip|||🛍️
A perfect free kick|||⚽`),
    list('t-dayimprovers', 'Things That Make Your Day', '☀️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Sunshine|||☀️
Good coffee|||☕
A compliment|||💬
Payday|||💵
Your song on the radio|||📻
Finding money in old jeans|||👖
A nap|||😴
Free food|||🍕
Your team winning|||⚽
A text from a friend|||📱
A dog saying hi|||🐕
No traffic|||🛣️
Shower after the gym|||🚿
Snow day|||❄️
A good laugh|||😂
Finishing early|||🏃
Your order arriving|||📦
Clean sheets|||🛏️
Beating your high score|||🕹️
Hot chocolate|||☕
Long weekend|||📅
A sunset|||🌇
Good hair day|||💇
Getting the last slice|||🍰
A surprise from family|||🎁`),
    list('t-spend100', 'Best Ways to Spend $100', '💵', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A nice dinner|||🍽️
Concert ticket|||🎫
A new video game|||🎮
Sneakers|||👟
A gift for someone|||🎁
A day trip|||🚗
Go-karting|||🏎️
Escape room|||🔐
Books|||📚
Gym gear|||🏋️
Groceries for two weeks|||🛒
Theme park ticket|||🎢
A class or workshop|||🎓
Save it|||🐷
Donate it|||💝
Haircut and skincare|||💈
Board games|||🎲
A massage|||💆
New clothes|||👕
Plants|||🪴
Kitchen gear|||🍳
Film night with friends|||🍿
Trampoline park|||🤸
Paintball|||🔫
Bowling night|||🎳`),
    list('t-spend1000', 'Best Ways to Spend $1,000', '💰', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A weekend trip|||✈️
Gaming PC upgrade|||🖥️
A new phone|||📱
A designer piece|||👜
Front-row concert tickets|||🎤
Invest it|||📈
A laptop|||💻
A bike|||🚲
A course or certification|||🎓
A watch|||⌚
New furniture|||🛋️
Family dinner out|||🍽️
Emergency fund|||🛟
A camera|||📷
Festival tickets|||🎪
A road trip|||🚗
Skydiving|||🪂
Start a side business|||💼
Sneaker collection|||👟
A big TV|||📺
Personal trainer|||🏋️
Give to charity|||💝
Driving lessons|||🚙
Hotel staycation|||🏨
Umrah or a family trip|||🕋`),
    list('t-3am', 'Things to Do at 3 AM', '🌙', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Raid the fridge|||🧀
Gaming|||🎮
Deep conversations|||💭
Stargazing|||✨
YouTube rabbit hole|||▶️
Late-night drive|||🚗
Order fast food|||🍔
Read a book|||📖
Doomscroll|||📱
Start a new series|||📺
Plan your whole life|||🗒️
Clean your room|||🧹
Work out|||💪
Make instant noodles|||🍜
Spam the group chat|||💬
Listen to music|||🎧
Wikipedia deep dive|||🌐
Night prayer|||🤲
Actually sleep|||😴
Write something|||✍️
Draw|||🎨
Make a playlist|||🎶
Bake cookies|||🍪
Rearrange the furniture|||🛋️
Watch the sunrise later|||🌅`),
    list('t-worstpowers', 'Worst Superpowers', '🙃', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Talk to fish (they're boring)|||🐟
Invisible only when nobody's looking|||🫥
Super speed, but backwards|||⏪
Teleport one metre|||📏
Read pigeons' minds|||🐦
Turn into a chair|||🪑
Super strength in your little toe|||🦶
X-ray vision through socks only|||🧦
Fly 2 cm off the ground|||🪶
Control the weather in one room|||⛅
Predict the past|||🔮
Glow in the dark|||💡
Hair changes colour at random|||🌈
Super hearing you can't switch off|||👂
Shoot spaghetti from your hands|||🍝
Summon one random sock|||🧦
Endless hiccups|||😮
Breathe underwater, in bathtubs only|||🛁
Talk to plants that ignore you|||🌱
Freeze time, but you freeze too|||⏸️
Invisible to cats only|||🐈
Make toast slightly warmer|||🍞
Always know the time (to the second)|||⏱️
Change the TV channel with your mind (only to the news)|||📺`),
    list('t-powercombos', 'Best Superpower Combos', '💥', 'Combo 1, Combo 2, Combo 3', `
Flight + Super Strength|||🦸
Teleportation + Invisibility|||🫥
Time Travel + Healing|||⏳
Mind Reading + Shapeshifting|||🧠
Super Speed + Intangibility|||⚡
Telekinesis + Flight|||🪄
Immortality + Healing Others|||❤️‍🩹
Weather Control + Flight|||🌩️
Invisibility + Super Hearing|||👂
Elemental Powers + Teleportation|||🔥
Animal Talk + Shapeshifting|||🐺
Duplication + Super Intelligence|||👥
Time Freeze + Super Speed|||⏸️
Laser Eyes + Flight|||👀
Regeneration + Super Strength|||💪
Portals + Mind Control|||🌀
Ice Powers + Water Breathing|||❄️
Telepathy + Teleportation|||📡
Luck Manipulation + Charisma|||🍀
Gravity Control + Flight|||🌍
Technopathy + Invisibility|||💻
Size Changing + Super Strength|||🐜`),
    list('t-shouldexist', 'Things That Should Exist', '💡', 'Pick 1, Pick 2, Pick 3, Pick 4', `
A phone battery that lasts a week|||🔋
Teleporters|||🌀
Healthy food that tastes like junk food|||🍔
Self-cleaning rooms|||🧹
A pause button for life|||⏸️
A snooze button for Mondays|||⏰
One charger for everything|||🔌
Real hoverboards|||🛹
An umbrella that never flips|||☂️
Lag-free internet everywhere|||📶
Zero-calorie pizza|||🍕
Laundry that folds itself|||👕
Socks that never go missing|||🧦
A button that skips traffic|||🚗
Clothes that never wrinkle|||👔
Instant hair-drying|||💨
A fridge that restocks itself|||🧊
Silent mosquitoes|||🦟
Download skills straight to your brain|||🧠
A remote that can't get lost|||📺
Rain that only falls at night|||🌧️
A save point for real life|||💾
Time-travelling post|||📮
Shoes that never get dirty|||👟`),
    list('t-collect', 'Things to Collect', '🗃️', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Sneakers|||👟
Pokémon cards|||🃏
Football shirts|||👕
Vinyl records|||💿
Coins|||🪙
Stamps|||📮
Lego sets|||🧱
Funko Pops|||🧸
Watches|||⌚
Comic books|||📚
Retro video games|||🕹️
Action figures|||🦸
Fridge magnets|||🧲
Hot Wheels|||🏎️
Signed memorabilia|||✍️
Plushies|||🧸
Keychains|||🔑
Rocks and crystals|||💎
Film posters|||🎞️
Mugs|||☕
Stickers|||🏷️
Books|||📖
Art prints|||🖼️
Snow globes|||🔮
Trading pins|||📍`),
    list('t-overrated', 'Most Overrated Things', '🙄', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Brunch|||🥞
$7 coffee|||☕
New Year's Eve|||🎆
Black Friday deals|||🏷️
Influencer restaurants|||📸
Avocado toast|||🥑
Valentine's Day|||💘
Camping|||⛺
Fancy water|||💧
Pumpkin spice everything|||🎃
Queueing for a launch|||🧍
Selfie sticks|||🤳
Ice baths|||🧊
Rooftop bars|||🏙️
Gender reveal parties|||🎈
Giant logos on clothes|||👕
Sleeping 12 hours|||😴
Cruise ship buffets|||🛳️
Super-long films|||🎬
Hype sneakers you never wear|||👟
Airport lounges|||✈️
Smart fridges|||🧊
Escape rooms|||🔐
Cold showers|||🚿`),
    list('t-underrated', 'Most Underrated Things', '🌟', 'Pick 1, Pick 2, Pick 3, Pick 4', `
Naps|||😴
Libraries|||📚
Public parks|||🌳
Walking|||🚶
Water|||💧
Leftovers|||🍱
Sunrises|||🌅
A really good pen|||🖊️
Board games|||🎲
Slow cookers|||🍲
Thank-you notes|||💌
Long phone calls|||📞
Local restaurants|||🍽️
Frozen grapes|||🍇
Sitting in silence|||🤫
Going to bed early|||🛏️
Rainy days|||🌧️
Grandparents' stories|||👴
Public transit|||🚌
Stretching|||🧘
Tea|||🍵
Fresh bread|||🍞
Old songs|||📻
Clean shoes|||👟
Saying no|||🙅`),
  ];
}
