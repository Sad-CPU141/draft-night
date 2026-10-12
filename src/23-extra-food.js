/* Extra items for big groups — Food & Drink. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_FOOD = {
  't-snk': `
Funyuns|Salty|Onion rings, sort of|🧅
Sun Chips|Salty|Wavy multigrain|🌾
Cheez-It|Salty|Square cheese crackers|🧀
Goldfish|Salty|Smiling crackers|🐟
Bugles|Salty|Corn cones|🌽
Fritos|Salty|Corn chips|🌽
Kettle Chips|Salty|Extra crunchy|🥔
Tostitos|Salty|With salsa|🌮
Salted Peanuts|Salty|Ballpark classic|🥜
Beef Jerky|Salty|Chewy and salty|🥩
Combos|Salty|Pretzel with cheese inside|🥨
Chex Mix|Salty|A bit of everything|🥣
Pita Chips|Salty|Toasted pita|🫓
Seaweed Snacks|Salty|Crispy nori|🌿
Wasabi Peas|Salty|Spicy crunch|🟢
Corn Nuts|Salty|Crunchy corn|🌽
Milky Way|Sweet|Nougat and caramel|🍫
Butterfinger|Sweet|Crispy peanut butter|🍫
Toblerone|Sweet|Triangle chocolate|🔺
Hershey's Kisses|Sweet|Little drops|🍫
Rolo|Sweet|Caramel cups|🍫
Kinder Surprise|Sweet|Chocolate egg with a toy|🥚
Maltesers|Sweet|Malt balls|🍫
Smarties Cookies|Sweet|Cookie with Smarties|🍪
Jolly Ranchers|Sweet|Hard candy|🍬
Starburst|Sweet|Fruit chews|🍬
Airheads|Sweet|Taffy strips|🍬
Warheads|Sweet|Extreme sour|😖
Gummy Worms|Sweet|Sour worms|🪱
Nerds|Sweet|Tiny crunchy candy|🍬
Laffy Taffy|Sweet|Stretchy taffy|🍬
Swedish Fish|Sweet|Red fish gummies|🐟
Mike and Ike|Sweet|Fruit chews|🍬
Jelly Belly|Sweet|Gourmet jelly beans|🫘
Rice Krispies Treats|Sweet|Marshmallow squares|🍘
Pop-Tarts|Sweet|Frosted pastry|🍓
Chips Ahoy!|Sweet|Chocolate chip cookies|🍪
Nutella & Go|Sweet|Breadsticks and Nutella|🥖
Cadbury Mini Eggs|Sweet|Easter favourite|🥚
Peeps|Sweet|Marshmallow chicks|🐥
Cotton Candy|Sweet|Spun sugar|☁️
Lollipop|Sweet|On a stick|🍭`,

  't-dish': `
Beef Wellington|Main|Pastry-wrapped beef|🥩
Peking Duck|Main|Crispy duck pancakes|🦆
Bibimbap|Main|Mixed rice bowl|🍚
Lasagne|Main|Layers of pasta|🍝
Spaghetti Carbonara|Main|Egg, cheese and pepper|🍝
Mansaf|Main|Lamb with jameed sauce|🍖
Moussaka|Main|Aubergine bake|🍆
Goulash|Main|Hungarian stew|🍲
Fish and Chips|Main|British classic|🐟
Jerk Chicken|Main|Jamaican spice|🍗
Feijoada|Main|Brazilian bean stew|🍲
Bobotie|Main|South African bake|🥘
Doro Wat|Main|Ethiopian chicken stew|🍗
Laksa|Main|Spicy noodle soup|🍜
Nasi Goreng|Main|Indonesian fried rice|🍳
Rendang|Main|Slow-cooked beef|🥩
Chicken Adobo|Main|Filipino classic|🍗
Ceviche|Main|Citrus-cured fish|🐟
Tagine|Main|Moroccan stew|🍲
Couscous|Main|North African staple|🥘
Bulgogi|Main|Korean marinated beef|🥩
Tonkatsu|Main|Breaded pork cutlet|🍱
Pierogi|Side|Polish dumplings|🥟
Edamame|Side|Salted soybeans|🫛
Tabbouleh|Side|Parsley salad|🥗
Spring Rolls|Side|Crispy rolls|🥢
Gyoza|Side|Pan-fried dumplings|🥟
Patatas Bravas|Side|Spicy potatoes|🥔
Elote|Side|Mexican street corn|🌽
Garlic Bread|Side|Buttery and garlicky|🥖
Arancini|Side|Fried risotto balls|🍙
Fattoush|Side|Crispy pita salad|🥗
Tostones|Side|Fried plantains|🍌
Mashed Potatoes|Side|Creamy and buttery|🥔
Gelato|Dessert|Italian ice cream|🍨
Cheesecake|Dessert|New York style|🍰
Macarons|Dessert|French almond cookies|🍪
Brigadeiro|Dessert|Brazilian chocolate balls|🍫
Halva|Dessert|Sesame sweet|🍬
Basbousa|Dessert|Semolina cake|🍰
Mango Sticky Rice|Dessert|Thai favourite|🥭
Black Forest Cake|Dessert|Chocolate and cherry|🍒
Pavlova|Dessert|Meringue and fruit|🍓
Kulfi|Dessert|Indian ice cream|🍦`,

  't-drink': `
Cappuccino|Hot|Foamy coffee|☕
Latte|Hot|Milky coffee|☕
Green Tea|Hot|Light and fresh|🍵
English Breakfast Tea|Hot|With milk|🫖
Mint Tea|Hot|Moroccan style|🌿
Hot Apple Cider|Hot|Autumn favourite|🍎
Masala Chai|Hot|Spiced tea|🫖
Saudi Coffee|Hot|With dates|☕
Sahlab|Hot|Warm milk pudding drink|🥛
Golden Milk|Hot|Turmeric latte|🥛
Espresso|Hot|Short and strong|☕
Mocha|Hot|Coffee and chocolate|☕
Iced Tea|Cold|Sweet tea|🧊
Lemonade|Cold|Fresh squeezed|🍋
Milkshake|Cold|Thick and creamy|🥤
Frappuccino|Cold|Blended coffee|🥤
Slurpee|Cold|Frozen and bright|🧊
Apple Juice|Cold|Cloudy or clear|🧃
Watermelon Juice|Cold|Summer in a cup|🍉
Horchata|Cold|Cinnamon rice milk|🥛
Ayran|Cold|Salty yogurt drink|🥛
Sugarcane Juice|Cold|Freshly pressed|🎋
Tamarind Juice|Cold|Sweet and sour|🥤
Cold Brew|Cold|Smooth coffee|🧊
Laban|Cold|Gulf yogurt drink|🥛
Rooh Afza|Cold|Rose syrup drink|🌹
7 Up|Fizzy|Lemon-lime|🥤
Ginger Ale|Fizzy|Gentle fizz|🫚
Monster Energy|Fizzy|Energy drink|⚡
Prime Hydration|Fizzy|Influencer drink|🧃
Fanta Grape|Fizzy|Purple fizz|🍇
Orange Crush|Fizzy|Orange soda|🍊
Pepsi Max|Fizzy|Zero sugar|🥤
Coke Zero|Fizzy|Zero sugar|🥤
Sparkling Water|Fizzy|Plain bubbles|💧
Barbican|Fizzy|Malt drink|🍺
Irn-Bru|Fizzy|Scotland's other drink|🧡
Kombucha|Fizzy|Fermented tea|🍵`,

  't-fruit': `
Mangosteen
Durian
Jackfruit
Persimmon
Apricot
Nectarine
Grapefruit
Lime
Clementine
Tangerine
Cranberry
Gooseberry
Star Fruit
Rambutan
Longan
Kumquat
Quince
Cantaloupe
Honeydew Melon
Blood Orange
Red Grapes
Prickly Pear
Custard Apple
Sapodilla
Loquat
Mulberry
Elderberry
Tamarind
Plantain
Jujube
Pomelo
Ackee
Yuzu
Feijoa`,

  't-bfast': `
Eggs and Toast
Scrambled Eggs
Omelette
Bacon and Eggs
English Muffin
Granola Bars
Breakfast Tacos
Huevos Rancheros
Biscuits and Gravy
Chocolate Croissant
Bagel with Lox
Açaí Bowl
Overnight Oats
Kaya Toast
Turkish Breakfast
Full Irish
Dutch Baby
Menemen
Idli Sambar
Poha
Pastelito
Muesli`,

  't-dess': `
Tiramisu
Panna Cotta
Crème Brûlée
Profiteroles
Éclair
Mille-feuille
Carrot Cake
Victoria Sponge
Lemon Tart
Pecan Pie
Pumpkin Pie
Bread Pudding
Rice Pudding
Ice Cream Cake
S'mores
Blondie
Snickerdoodle
Whoopie Pie
Mochi Ice Cream
Halo-halo
Bingsu
Basbousa
Umm Ali
Luqaimat
Jalebi
Kheer
Brigadeiro
Alfajores
Flan
Baklava Cheesecake
Chocolate Fondue
Frozen Yogurt
Sorbet
Affogato`,

  't-pizza': `
Beef Bacon
Smoked Turkey
Meatballs
Beef Salami
Chicken Shawarma
Arugula
Ricotta
Goat Cheese
Caramelized Onions
Roasted Red Peppers
Pesto
Buffalo Chicken
Tandoori Chicken
Olives
Zucchini
Eggplant
Broccoli
Tuna
Truffle Oil
Chorizo`,

  't-ffchains': `
Carl's Jr.
Hardee's
Culver's
Zaxby's
Bojangles
Church's Texas Chicken
Little Caesars
Papa John's
Jimmy John's
Jersey Mike's
Firehouse Subs
Panera Bread
Qdoba
Del Taco
El Pollo Loco
Steak 'n Shake
White Castle
Checkers
Long John Silvers
Krystal
Mos Burger
Lotteria
Hungry Jack's
Red Rooster
Pret A Manger
Quick
Herfy
Kudu
Shawarmer
Osmow's
Pizza Pizza
Swiss Chalet
Freshii
Booster Juice`,

  't-icecream': `
French Vanilla
Double Chocolate
Chocolate Chip
Mint
Blueberry
Cherry Garcia
Peach
Lemon
Raspberry Sorbet
Maple Walnut
Caramel Swirl
Chocolate Fudge Brownie
Toffee Crunch
Banana
Pineapple
Lavender
Saffron Pistachio
Rose
Green Tea Red Bean
Spumoni`,

  't-chocbars': `
Snickers Peanut Butter
KitKat Chunky
Lindt Excellence
Ferrero Rocher
Godiva
Ritter Sport
Tony's Chocolonely
Hershey's Cookies 'n' Creme
Heath Bar
PayDay
Almond Joy
Mounds
100 Grand
Whatchamacallit
Take 5
Krackel
Crunch
Coffee Crisp Mocha
Smarties Bar
Mint Aero
Turkish Delight Bar
Fry's Chocolate Cream
Boost
Topic
Star Bar
Ripple
Time Out
Freddo
Cherry Ripe
Violet Crumble
Moro
Kinder Chocolate
Patchi`,

  't-crisps': `
Lay's Salt & Vinegar
Lay's Dill Pickle
Ruffles All Dressed
Doritos Cool Ranch
Doritos Sweet Chili
Cheetos Puffs
Takis Blue Heat
Pringles BBQ
Kettle Sea Salt
Cape Cod
Utz
Herr's
Zapp's
Lay's Flamin' Hot
Sensations
McCoy's
Discos
Skips
Space Raiders
Tayto
Twisties
Burger Rings
Calbee
Jagabee
Lay's Magic Masala
Bingo Mad Angles
Pringles Pizza
Munchos
Cheez Doodles
Pirate's Booty
Ruffles Cheddar & Sour Cream
Doritos Dinamita
Lay's Poppables
Takis Fuego
Pringles Wavy
Tyrrells
Walkers Prawn Cocktail
Smiths Chicken`,

  't-cereal': `
Honey Bunches of Oats
Kellogg's Krave
Cinnamon Life
Life
Corn Chex
Wheaties
Total
Grape-Nuts
All-Bran
Fruit & Fibre
Crunchy Nut Clusters
Oreo O's
Cookie Crunch
Cocoa Krispies
Frosted Cheerios
Multigrain Cheerios
Golden Nuggets
Honey Smacks
Krave Double Chocolate
Cracklin' Oat Bran
Quaker Oatmeal Squares
Cinnamon Chex
Peanut Butter Crunch
Waffle Crisp
French Toast Crunch
Boo Berry
Franken Berry
Alpha-Bits
Honeycomb
Cocoa Pebbles
Froot Loops Marshmallow
Nesquik Cereal
Coco Rocks
Cheerios Protein
Muesli
Raisin Bran Crunch`,

  't-street': `
Kebab Roll
Bao Bun
Dumplings
Banh Xeo
Roti Canai
Hainanese Chicken Rice
Kati Roll
Vada Pav
Pav Bhaji
Chaat
Mandazi
Suya
Bunny Chow Quarter
Halo-halo
Isaw
Balut
Okonomiyaki
Yakitori
Taiyaki
Hotteok
Kimbap
Jian Bing
Stinky Tofu
Egg Waffle
Tamales
Esquites
Tlayuda
Churro Ice Cream Sandwich
Pretzel Dog
Philly Cheesesteak
Lobster Roll
Bratwurst
Fried Calamari
Pizza al Taglio`,

  't-mideast': `
Shawarma
Falafel
Mezze Platter
Kofta Kebab
Lamb Ouzi
Mujaddara
Sfeeha
Fatayer
Za'atar Manakish
Knafeh Nabulsieh
Halawet el Jibn
Atayef
Mahalabia
Arabic Coffee
Karak Chai
Mint Lemonade
Tamarind Juice
Lentil Soup
Freekeh
Maqluba Chicken
Shish Kebab
Mixed Grill
Hummus Beiruti
Muttabal
Batata Harra
Arayes
Kibbeh Nayyeh
Sumac Chicken
Qatayef
Ka'ak
Zaatar Croissant
Jallab
Shish Barak
Kebab Halabi`,

  't-saudi': `
Saleeg Chicken
Kabsa Lamb
Mandi Chicken
Hashi
Kabsa Camel
Shakshuka
Aseeda
Marasee
Mugalgal
Muttabaq Sweet
Samboosa Cheese
Kunafa
Basbousa
Ma'amoul
Laban
Jallab
Sobia
Arabic Coffee with Dates
Saudi Champagne
Khubz
Tamees with Ful
Shawarma Arabi
Broasted Chicken
Kibda
Mandi Rice
Madghout
Rubyan Kabsa
Thareed
Mandi Lamb
Kabsa Chicken`,

  't-turkish': `
Kuzu Tandır
Hünkar Beğendi
Testi Kebab
Ali Nazik
Beyti Kebab
Şiş Kebap
Tantuni
Kısır
Mercimek Köftesi
Sigara Böreği
Su Böreği
Poğaça
Açma
Katmer
Baklava with Ice Cream
Dondurma
Lokma
Revani
Kazandibi
Aşure
Salep
Boza
Şalgam
Sucuk
Pastırma
Kaşar Cheese
Beyaz Peynir
Kumru
Hamsi Tava
Zeytinyağlı Fasulye
Etli Ekmek
Kebab Plate
Turkish Breakfast
Pide with Egg`,

  't-japanese': `
Chirashi
Nigiri
Temaki
Uramaki
Ebi Fry
Chicken Katsu Curry
Kare Raisu
Tsukemen
Tantanmen
Hiyashi Chuka
Agedashi Tofu
Chawanmushi
Kushikatsu
Monjayaki
Okonomiyaki Hiroshima Style
Teriyaki Chicken
Saba Shioyaki
Nikujaga
Tendon
Kaisendon
Ochazuke
Natto
Takoyaki with Mayo
Melon Pan
Castella
Daifuku
Warabi Mochi
Kakigori
Anpan
Japanese Cheesecake
Matcha Parfait
Kit Kat Matcha
Ramune
Calpis`,

  't-korean': `
Jajangmyeon
Samgak Gimbap
Odeng
Sundae
Dakkochi
Gamjatang
Haemul Pajeon
Doenjang Jjigae
Galbi-jjim
Haemul-jjim
Dak-galbi
Yangnyeom Chicken
Cheese Corn
Rabokki
Kimchi Fried Rice
Kongguksu
Mul-naengmyeon
Bibim-naengmyeon
Gyeranjjim
Banchan
Kimchi Pancake
Dakgangjeong
Tteokgalbi
Ssiat Hotteok
Yakgwa
Injeolmi
Patbingsu
Banana Milk
Sikhye
Yuja Tea
Strawberry Milk
Corn Dog
Egg Bread
Tornado Potato
Hotdog Kimbap
Korean BBQ Ribs
Army Stew
Gyeran-mari`,

  't-italian': `
Fettuccine Alfredo
Penne alla Vodka
Spaghetti alle Vongole
Linguine al Pesto
Orecchiette
Pappardelle al Ragù
Bucatini
Gnocchi Sorrentina
Pizza Napoletana
Pizza al Taglio
Supplì
Pasta alla Norma
Pizza Fritta
Carpaccio
Vitello Tonnato
Bistecca alla Fiorentina
Chicken Parmigiana
Eggplant Parmigiana
Ribollita
Pasta e Fagioli
Insalata Caprese
Piadina
Panzerotti
Grissini
Zabaglione
Sfogliatella
Cassata
Torta Caprese
Semifreddo
Granita
Pistachio Gelato
Affogato
Espresso
Amaretti`,

  't-mexican': `
Tacos de Suadero
Tacos de Lengua
Fish Tacos
Chimichanga
Fajitas
Carne Asada
Pollo Asado
Chile Relleno
Tortilla Soup
Sopa de Lima
Queso Fundido
Enfrijoladas
Tamal Oaxaqueño
Mole Negro
Pambazo
Molletes
Esquites
Mangonada
Paleta
Agua de Jamaica
Tepache
Champurrado
Atole
Pan de Muerto
Bunuelos
Flan Napolitano
Arroz con Leche
Capirotada
Tacos Dorados
Huaraches
Memelas
Carne en su Jugo
Machaca
Chilorio`,

  't-indian': `
Paneer Tikka
Kadai Chicken
Chicken 65
Hyderabadi Biryani
Mutton Curry
Fish Curry
Prawn Masala
Baingan Bharta
Bhindi Masala
Aloo Paratha
Kulcha
Puri Bhaji
Upma
Uttapam
Medu Vada
Sambar
Rasam
Pongal
Appam
Kerala Parotta
Misal Pav
Dabeli
Kachori
Bhel Puri
Sev Puri
Dahi Puri
Momos
Thali
Rasmalai
Kaju Katli
Ladoo
Barfi
Payasam
Falooda`,

  't-chinese': `
Cantonese Roast Duck
Char Siu Bao
Cheung Fun
Lo Mai Gai
Turnip Cake
Egg Fried Rice
Yangzhou Fried Rice
Shrimp Dumplings
Chicken Bao
Sichuan Hot Pot
Fish-Fragrant Aubergine
Gong Bao Prawns
Chongqing Chicken
Boiled Fish
Cumin Lamb
Beef and Broccoli
Sesame Chicken
Lemon Chicken
Crispy Chilli Beef
Salt and Pepper Squid
Hot and Sour Soup
Egg Drop Soup
Biang Biang Noodles
Zhajiangmian
Rou Jia Mo
Liangpi
Sheng Jian Bao
Egg Roll
Sesame Balls
Red Bean Bun
Egg Waffle
Almond Tofu
Dragon's Beard Candy
Bubble Milk Tea`,

  't-sauces': `
Ponzu
Oyster Sauce
Fish Sauce
Sambal Oelek
Gochugaru Paste
Zhug
Toum
Amba
Muhammara
Romesco
Salsa Verde
Mole Sauce
Chipotle Mayo
Sriracha Mayo
Big Mac Sauce
Chick-fil-A Sauce
Raising Cane's Sauce
Thousand Island
Blue Cheese Dressing
Caesar Dressing
Balsamic Glaze
Hollandaise
Béarnaise
Alfredo Sauce
Marinara
Vodka Sauce
Curry Sauce
Satay Sauce
Plum Sauce
Duck Sauce
Cocktail Sauce
Horseradish
Apple Sauce
Cranberry Sauce`,

  't-coffee': `
Long Black
Lungo
Doppio
Red Eye
Breve
Café Bombón
Café Cubano
Cortadito
Piccolo
Gibraltar
Café Mocha White
Iced Latte
Iced Americano
Iced Caramel Latte
Shaken Espresso
Brown Sugar Oat Shaken Espresso
Iced Mocha
Matcha Espresso Fusion
Pistachio Latte
Salted Caramel Mocha
Peppermint Mocha
Gingerbread Latte
Hazelnut Latte
Vanilla Latte
Honey Oat Latte
Egg Coffee
Yuanyang
Kopi
Qahwa
Café Frappé
Freddo Espresso
Freddo Cappuccino
Espresso Tonic
Mazagran
Bulletproof Coffee
Mushroom Coffee
Cold Foam Cold Brew`,

  't-boba': `
Tiger Milk Tea
Lavender Milk Tea
Earl Grey Milk Tea
Hong Kong Milk Tea
Pandan Milk Tea
Strawberry Matcha
Mango Pomelo Sago
Dirty Brown Sugar
Crème Brûlée Milk Tea
Oreo Milk Tea
Avocado Smoothie
Watermelon Slush
Kiwi Green Tea
Lemon Black Tea
Yakult Green Tea
Rose Lychee
Osmanthus Oolong
Black Sesame Milk Tea
Red Bean Milk Tea
Coconut Mango
Banana Milk Tea
Honey Lemon Aloe`,

  't-bakery': `
Croissant aux Amandes
Pain aux Raisins
Morning Bun
Kouign-Amann
Cream Puff
Profiterole
Mille-feuille
Fruit Tart
Lemon Bar
Blondie
Brownie
Cupcake
Cookie
Biscotti
Shortbread
Pretzel
Ciabatta
Focaccia
Pita
Naan
Bao
Melon Pan
Pandesal
Pão de Queijo
Medialuna
Kanelbulle
Semla
Stollen
Panettone
Hot Cross Bun
Chelsea Bun
Eccles Cake
Bakewell Tart
Butter Tart
Beaver Tail
Date Square
Palmier`,

  't-noodles': `
Nissin Cup Noodles Seafood
Maruchan Instant Lunch
Indomie Ayam Bawang
Indomie Rendang
Shin Ramyun Black
Buldak Carbonara
Buldak 2x Spicy
Neoguri Seafood
Ansungtangmyun
Kokomen
Paldo Kokomen
MyKuali White Curry
Ibumie
Mama Tom Yum
Yum Yum
Nissin Raoh
Ichiran Instant Ramen
Myojo Ippeichan Yakisoba
Nongshim Bowl Noodle
Lucky Me Pancit Canton
Sapporo Ichiban Miso
Top Ramen Chicken
Maggi Masala
Knorr Chicken Noodle`,

  't-cheese': `
Asiago
Fontina
Taleggio
Pecorino Sardo
Grana Padano
Scamorza
Stracciatella
Burrata Pugliese
Cotija
Queso Fresco
Oaxaca Cheese
Swiss Cheese
American Cheese
Colby
Pepper Jack
Muenster
Limburger
Jarlsberg
Gjetost
Wensleydale
Red Leicester
Double Gloucester
Cornish Yarg
Port Salut
Reblochon
Munster
Époisses
Boursin
Labneh
Nabulsi
Kashkaval
Sirene
Leyden
Shropshire Blue`,
};
