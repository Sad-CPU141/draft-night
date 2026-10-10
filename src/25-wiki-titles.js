/* ============================================================
   WIKIPEDIA PAGE NAMES
   Topics listed here show real photos. An item's page is its own name
   unless mapped below; `null` means "no good photo, keep the art".
   Topics not listed (superpowers, emojis, apps…) stay as emoji on purpose.
   ============================================================ */
const PHOTO_TOPICS = {
  't-pl': { 'Tony Adams': 'Tony Adams (footballer)' },
  't-cf': {
    'Alisson': 'Alisson Becker', 'Rodri': 'Rodri (footballer, born 1996)', 'Pedri': 'Pedri',
    'Vitinha': 'Vitinha (footballer, born February 2000)', 'Bruno Fernandes': 'Bruno Fernandes (footballer, born 1994)',
  },
  't-nba': { 'Anthony Edwards': 'Anthony Edwards (basketball)', 'Anthony Davis': 'Anthony Davis (basketball)' },
  't-goat': { 'Ronaldo Nazário': 'Ronaldo (Brazilian footballer)', 'Xavi': 'Xavi', 'Cafu': 'Cafu' },
  't-nbal': { 'David Robinson': 'David Robinson (basketball)', 'Isiah Thomas': 'Isiah Thomas', 'Gary Payton': 'Gary Payton' },
  't-nhl': { 'Jack Hughes': 'Jack Hughes (ice hockey, born 2001)', 'Adam Fox': 'Adam Fox (ice hockey)', 'Alex Ovechkin': 'Alexander Ovechkin', 'Mitch Marner': 'Mitch Marner' },
  't-nfl': { 'Josh Allen': 'Josh Allen (quarterback)', 'Derrick Henry': 'Derrick Henry (American football)', 'T.J. Watt': 'T. J. Watt', 'Lawrence Taylor': 'Lawrence Taylor', 'Ray Lewis': 'Ray Lewis' },
  't-ten': { 'Andy Murray': 'Andy Murray', 'Naomi Osaka': 'Naomi Osaka' },
  't-f1': {
    'George Russell': 'George Russell (racing driver)', 'Carlos Sainz': 'Carlos Sainz Jr.', 'Alex Albon': 'Alexander Albon',
    'Kimi Antonelli': 'Andrea Kimi Antonelli', 'Michael Schumacher': 'Michael Schumacher',
  },
  't-fight': {
    'Floyd Mayweather': 'Floyd Mayweather Jr.', 'Prince Naseem Hamed': 'Naseem Hamed', 'Amir Khan': 'Amir Khan (boxer)',
    'Valentina Shevchenko': 'Valentina Shevchenko (fighter)', 'Alex Pereira': 'Alex Pereira', 'Jon Jones': 'Jon Jones',
  },
  't-crk': {
    'Steve Smith': 'Steve Smith (cricketer)', 'James Anderson': 'James Anderson (cricketer)', 'Rashid Khan': 'Rashid Khan (cricketer)',
    'Mohammad Rizwan': 'Mohammad Rizwan (cricketer)', 'Travis Head': 'Travis Head', 'Joe Root': 'Joe Root',
  },
  't-rap': {
    'Drake': 'Drake (musician)', 'Tupac': 'Tupac Shakur', 'Future': 'Future (rapper)', 'A$AP Rocky': 'ASAP Rocky',
    'Juice WRLD': 'Juice Wrld', 'Dave': 'Dave (rapper)', 'Nas': 'Nas', 'Metro Boomin': 'Metro Boomin',
  },
  't-ani': {
    'Grizzly Bear': 'Grizzly bear', 'Rhino': 'Rhinoceros', 'Hippo': 'Hippopotamus', 'Honey Badger': 'Honey badger', 'Komodo Dragon': 'Komodo dragon',
    'Great White Shark': 'Great white shark', 'Giant Squid': 'Giant squid', 'Blue Whale': 'Blue whale', 'Pufferfish': 'Tetraodontidae',
    'Bald Eagle': 'Bald eagle', 'Dolphin': 'Common bottlenose dolphin', 'Bull': 'Bull', 'Bat': 'Bat', 'Swan': 'Mute swan', 'Hornet': 'Hornet',
  },
  't-pet': {
    'Golden Retriever': 'Golden Retriever', 'German Shepherd': 'German Shepherd', 'Husky': 'Siberian Husky', 'Pomeranian': 'Pomeranian dog',
    'Persian Cat': 'Persian cat', 'Siamese Cat': 'Siamese cat', 'Sphynx Cat': 'Sphynx cat', 'Ragdoll Cat': 'Ragdoll', 'Budgie': 'Budgerigar',
    'Bearded Dragon': 'Pogona', 'Mini Pig': 'Miniature pig', 'Guinea Pig': 'Guinea pig', 'Parrot': 'Parrot', 'Turtle': 'Turtle', 'Snake': 'Snake',
  },
  't-trav': {
    'New York': 'New York City', 'Marrakech': 'Marrakesh', 'Sydney': 'Sydney', 'Banff': 'Banff National Park', 'Hawaii': 'Hawaii',
    'Swiss Alps': 'Swiss Alps', 'Bali': 'Bali', 'Maldives': 'Maldives',
  },
  't-ctry': { 'UAE': 'United Arab Emirates', 'USA': 'United States', 'Turkey': 'Turkey' },
  't-fruit': {
    'Green Apple': 'Granny Smith', 'Grapes': 'Grape', 'Orange': 'Orange (fruit)', 'Kiwi': 'Kiwifruit', 'Cherry': 'Cherry', 'Melon': 'Honeydew (melon)',
    'Dragon Fruit': 'Pitaya', 'Fig': 'Common fig', 'Dates': 'Date palm', 'Passion Fruit': 'Passiflora edulis', 'Apple': 'Apple', 'Plum': 'Plum',
  },
  't-dish': {
    'Pizza Margherita': 'Pizza Margherita', 'Tacos al Pastor': 'Al pastor', 'Butter Chicken': 'Butter chicken', 'Pad Thai': 'Pad thai', 'Pho': 'Phở',
    'Jollof Rice': 'Jollof rice', 'Korean BBQ': 'Korean barbecue', 'Dim Sum': 'Dim sum', 'Mac & Cheese': 'Macaroni and cheese', 'Samosas': 'Samosa',
    'Garlic Naan': 'Naan', 'Kunafa': 'Knafeh', 'Gulab Jamun': 'Gulab jamun', 'Churros': 'Churro', 'Crème Brûlée': 'Crème brûlée', 'Pastel de Nata': 'Pastel de nata',
  },
  't-bfast': {
    'Pancakes': 'Pancake', 'Waffles': 'Waffle', 'French Toast': 'French toast', 'Full English': 'Full breakfast', 'Bagel & Cream Cheese': 'Bagel',
    'Cereal': 'Breakfast cereal', 'Avocado Toast': 'Avocado toast', 'Breakfast Burrito': 'Breakfast burrito', 'Shakshuka': 'Shakshouka', 'Halwa Puri': 'Halwa poori',
    'Paratha & Chai': 'Paratha', 'Ful Medames': 'Ful medames', 'Manakish': 'Manakish', 'Hash Browns': 'Hash browns', 'Chicken & Waffles': 'Chicken and waffles',
    'Smoothie Bowl': null, 'Yogurt Parfait': 'Parfait', 'Beef Sausages': 'Sausage', 'Breakfast Sandwich': 'Breakfast sandwich', 'Crêpes': 'Crêpe',
    'Nasi Lemak': 'Nasi lemak', 'Masala Dosa': 'Masala dosa', 'Fruit Salad': 'Fruit salad', 'Eggs Benedict': 'Eggs Benedict',
  },
  't-dess': {
    'Brownie': 'Chocolate brownie', 'Chocolate Chip Cookie': 'Chocolate chip cookie', 'Ice Cream Sundae': 'Sundae', 'Donut': 'Doughnut', 'Apple Pie': 'Apple pie',
    'Cinnamon Roll': 'Cinnamon roll', 'Macarons': 'Macaron', 'Churros': 'Churro', 'Tres Leches': 'Tres leches cake', 'Kunafa': 'Knafeh', 'Gulab Jamun': 'Gulab jamun',
    'Nutella Crêpe': 'Crêpe', 'Banana Split': 'Banana split', 'Lava Cake': 'Molten chocolate cake', 'Red Velvet Cake': 'Red velvet cake', 'Key Lime Pie': 'Key lime pie',
    'Funnel Cake': 'Funnel cake', 'Bubble Waffle': 'Egg waffle', 'Sticky Toffee Pudding': 'Sticky toffee pudding', 'Butter Tart': 'Butter tart',
    'Nanaimo Bar': 'Nanaimo bar', 'Crème Caramel': 'Crème caramel',
  },
  't-pizza': {
    'Mushrooms': 'Edible mushroom', 'Onions': 'Onion', 'Green Peppers': 'Bell pepper', 'Black Olives': 'Olive', 'Extra Cheese': 'Mozzarella', 'Jalapeños': 'Jalapeño',
    'Tomatoes': 'Tomato', 'Chicken': 'Chicken as food', 'Ground Beef': 'Ground beef', 'Beef Sausage': 'Sausage', 'Corn': 'Sweet corn', 'Anchovies': 'Anchovies as food',
    'Turkey Bacon': 'Turkey bacon', 'Hot Honey': null, 'BBQ Sauce': 'Barbecue sauce', 'Ranch Drizzle': 'Ranch dressing', 'Banana Peppers': 'Banana pepper',
    'Sun-Dried Tomatoes': 'Sun-dried tomato', 'Artichokes': 'Artichoke', 'Red Onions': 'Red onion', 'Donair Meat': 'Donair', 'Butter Chicken': 'Butter chicken',
  },
  't-ff': {
    'Chicken Sandwich': null, 'Chick-fil-A Sandwich': null, 'Crunchwrap Supreme': null, 'Teen Burger': null, 'Zinger': null, 'Burrito Bowl': 'Burrito',
    'Double-Double': 'In-N-Out Burger', 'Italian B.M.T.': 'Submarine sandwich', 'Fries': 'French fries', 'Onion Rings': 'Onion ring', 'Cajun Fries': null,
    'Waffle Fries': 'Waffle fries', 'Hash Brown': 'Hash browns', 'Nacho Fries': null, 'Iced Capp': 'Iced coffee', 'Root Beer': 'Root beer', 'Baja Blast': null,
    'Double-Double Coffee': null, 'Frosted Lemonade': null, 'Frosty': null, 'Blizzard': null, 'Baked Apple Pie': 'Apple pie', 'Cinnabon Delights': null,
  },
  't-car': {
    'Porsche 911 GT3': 'Porsche 911 GT3', 'Ferrari LaFerrari': 'LaFerrari', 'VW Golf GTI': 'Volkswagen Golf GTI', 'Hyundai Elantra N': 'Hyundai Elantra',
    'Mercedes G-Wagon': 'Mercedes-Benz G-Class', 'Nissan Skyline GT-R R34': 'Nissan Skyline GT-R', "Ford Mustang '67": 'Ford Mustang (first generation)',
    "Chevrolet Camaro '69": 'Chevrolet Camaro (first generation)', 'Mercedes 300SL Gullwing': 'Mercedes-Benz 300 SL', 'Toyota Supra Mk4': 'Toyota Supra',
    'Toyota AE86': 'Toyota AE86',
  },
  't-myth': {
    'Phoenix': 'Phoenix (mythology)', 'Genie': 'Jinn', 'Cyclops': 'Cyclopes', 'Hydra': 'Lernaean Hydra', 'Troll': 'Troll', 'Thunderbird': 'Thunderbird (mythology)',
    'Sphinx': 'Sphinx', 'Elf': 'Elf', 'Golem': 'Golem', 'Fairy': 'Fairy', 'Ghost': 'Ghost', 'Zombie': 'Zombie', 'Dragon': 'Dragon',
  },
  't-inv': {
    'The Internet': 'Internet', 'The Wheel': 'Wheel', 'Light Bulb': 'Incandescent light bulb', 'Vaccines': 'Vaccine', 'Antibiotics': 'Antibiotic',
    'GPS': 'Global Positioning System', 'Flushing Toilet': 'Flush toilet', 'Microwave': 'Microwave oven', 'Video Games': 'Video game', 'Car': 'Car', 'Wi-Fi': 'Wi-Fi',
  },
  't-board': {
    'Monopoly': 'Monopoly (game)', 'Uno': 'Uno (card game)', 'Connect 4': 'Connect Four', 'Clue': 'Cluedo', 'Catan': 'Catan', 'Risk': 'Risk (game)',
    'Battleship': 'Battleship (game)', 'Snakes & Ladders': 'Snakes and ladders', 'Checkers': 'Draughts', 'Twister': 'Twister (game)', 'Operation': 'Operation (game)',
    'Sorry!': 'Sorry! (game)', 'Codenames': 'Codenames (board game)', 'Werewolf': 'Mafia (party game)', 'Taboo': 'Taboo (game)', 'Poker Night': 'Poker',
    'Go Fish': 'Go Fish', 'Spoons': 'Spoons (card game)', 'Dominoes': 'Dominoes', 'Carrom': 'Carrom',
  },
  't-toys': {
    'LEGO': 'Lego', 'Beyblades': 'Beyblade', 'Pokémon Cards': 'Pokémon Trading Card Game', 'Nerf Blasters': 'Nerf', 'Yo-Yo': 'Yo-yo', 'Bubble Wand': 'Soap bubble',
    'Water Gun': 'Water gun', 'Scooter': 'Kick scooter', 'Rollerblades': 'Inline skates', 'RC Car': 'Radio-controlled car', 'Fidget Spinner': 'Fidget spinner',
    'Teddy Bear': 'Teddy bear', 'Marbles': 'Marble (toy)', 'Action Figures': 'Action figure', 'Squishmallow': 'Squishmallows',
  },
  't-gadget': {
    'PlayStation 5': 'PlayStation 5', 'Xbox': 'Xbox Series X and Series S', 'MacBook': 'MacBook Pro', 'Gaming PC': 'Gaming computer', 'Drone': 'Quadcopter',
    'VR Headset': 'Virtual reality headset', 'Kindle': 'Amazon Kindle', 'Bluetooth Speaker': 'Wireless speaker', 'Noise-Cancelling Headphones': 'Headphones',
    'Mechanical Keyboard': 'Keyboard technology', 'Gaming Mouse': 'Computer mouse', 'Electric Scooter': 'Electric kick scooter', 'Robot Vacuum': 'Robotic vacuum cleaner',
    'Smart Glasses': 'Smartglasses', 'Power Bank': 'Battery charger', 'Hair Dryer': 'Hair dryer', '3D Printer': '3D printing', 'E-Bike': 'Electric bicycle',
    'Mini Projector': 'Video projector', 'Air Fryer': 'Air fryer', 'Instant Camera': 'Instant camera', 'Ring Light': 'Ring light',
  },
  't-holi': {
    'Ramadan Nights': 'Ramadan', 'Thanksgiving': 'Thanksgiving (Canada)', 'Lunar New Year': 'Chinese New Year', 'Your Birthday': 'Birthday', 'Summer Break': 'Summer vacation',
    'Last Day of School': null, 'Family Day': 'Family Day (Canada)', 'Black Friday': 'Black Friday (shopping)', 'Super Bowl Sunday': 'Super Bowl', 'World Cup Final': 'FIFA World Cup',
    'Wedding Season': 'Wedding', 'Snow Day': 'Snow day', 'Payday': null, 'Long Weekend': null, 'Graduation': 'Graduation',
  },
  't-job': {
    'Pro Footballer': 'Association football', 'Doctor': 'Physician', 'Pilot': 'Aircraft pilot', 'Software Engineer': 'Software engineering', 'Game Developer': 'Video game developer',
    'Marine Biologist': 'Marine biology', 'Entrepreneur': 'Entrepreneurship', 'Vet': 'Veterinarian', 'Fashion Designer': 'Fashion design', 'F1 Engineer': null,
    'Archaeologist': 'Archaeology', 'Stock Trader': 'Stock trader', 'Real Estate Agent': 'Real estate broker', 'Travel Blogger': null, 'Sports Commentator': 'Sports commentator',
    'Spy': 'Espionage', 'Zookeeper': 'Zookeeper', 'YouTuber': 'YouTuber',
  },
  't-hobby': {
    'Gaming': 'Video game', 'Football': 'Association football', 'Gym': 'Weight training', 'Coding': 'Computer programming', 'Sneaker Collecting': null,
    'Video Editing': 'Video editing', 'LEGO Building': 'Lego', 'Car Detailing': 'Auto detailing', 'Learning Languages': 'Language acquisition', 'Martial Arts': 'Martial arts',
    'Rock Climbing': 'Rock climbing',
  },
};
const SENTENCE_CASE = new Set(['t-inv', 't-hobby', 't-job']);
// Page name for an item, or null when it shouldn't show a Wikipedia photo.
function wikiTitleFor(item, topic) {
  if (!item || item.photosOff) return null;
  if (item.wiki) return item.wiki;
  if (!topic || !topic.photos) return null;
  const map = PHOTO_TOPICS[topic.id] || {};
  if (Object.prototype.hasOwnProperty.call(map, item.name)) return map[item.name];
  // Generic-thing topics use Wikipedia's sentence case ("Washing machine", not "Washing Machine").
  if (SENTENCE_CASE.has(topic.id)) return item.name.charAt(0) + item.name.slice(1).toLowerCase();
  return item.name;
}
