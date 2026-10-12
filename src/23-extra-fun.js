/* Extra items for big groups — Just for Fun. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_FUN = {
  't-pow': `
Super Hearing
Intangibility
Duplication
Regeneration
Gravity Control
Size Changing
Water Powers
Earth Powers
Electricity Powers
Super Jump
Wall Crawling
Portals
Technopathy
Telepathy
Animal Shapeshifting
Danger Sense
Super Charisma
Plant Control
Sound Waves
Rewind 10 Seconds
`,
  't-myth': `
Kitsune
Banshee
Gorgon
Chimera
Harpy
Manticore
Wendigo
Djinn
Roc
Nymph
Siren
Selkie
Goblin
Ogre
Dwarf
Leprechaun
Gnome
Pixie
Hippogriff
Kelpie
Jackalope
Mothman
Sea serpent
Wyvern
Bunyip
Tengu
Qilin
Chinese dragon
Nāga
Garuda
Anubis
Valkyrie
Satyr
Faun
Behemoth
Ifrit
Mummy
Headless Horseman
`,
  't-job': `
Pro Gamer
Formula One Driver
Movie Director
Video Game Tester
Fighter Pilot
Surgeon
Racing Driver
Personal Trainer
Barber
Mechanic
Food Critic
Park Ranger
Diplomat
Journalist
Data Scientist
Animator
Graphic Designer
Interior Designer
Wildlife Photographer
Air Traffic Controller
Deep-sea Diver
Car Designer
Football Manager
Hotel Owner
`,
  't-zomb': `
Machete|Weapon
Sledgehammer|Weapon
Spear|Weapon
Golf Club|Weapon
Cricket Bat|Weapon
Axe|Weapon
Shovel|Weapon
Crossbow|Weapon
Slingshot|Weapon
Hammer|Weapon
Lockpick Set|Tool
Multi-tool|Tool
Bolt Cutters|Tool
Wind-up Torch|Tool
Solar Charger|Tool
Water Filter|Tool
Fire Starter|Tool
Whistle|Tool
Tarp|Tool
Sewing Kit|Tool
Rice Sack|Supply
Peanut Butter|Supply
Tuna Cans|Supply
Instant Noodles|Supply
Honey|Supply
Dried Fruit|Supply
Protein Bars|Supply
Painkillers|Supply
Bandages|Supply
Water Purification Tablets|Supply
Warm Blanket|Supply
Rain Poncho|Supply
Spare Socks|Supply
Hiking Boots|Supply
Backpack|Supply
Candles|Supply
Matches|Supply
Seeds to Grow Food|Supply
Salt|Supply
Coffee|Supply
Chocolate|Supply
Vitamins|Supply
Soap|Supply
Toilet Paper|Supply
Garbage Bags|Supply
Armoured Car|FLEX
Boat|FLEX
Horse|FLEX
Skateboard|FLEX
Drone|FLEX
Ladder|FLEX
Tent|FLEX
Generator|FLEX
Hazmat Suit|FLEX
Riot Shield|FLEX
Motorcycle Helmet|FLEX
Trained Medic Friend|FLEX
`,
  't-island': `
Axe
Shovel
Tarp
Cooking Pot
Spear Gun
Life Jacket
Waterproof Matches
Binoculars
Seeds
Chickens
Goat
Notebook & Pen
Deck of Cards
Volleyball
Sunglasses
Flip-flops
Toothbrush
Multi-tool
Hot Chocolate
Bag of Dates
Solar Fridge
Radio
`,
  't-inv': `
Steam engine
Telescope
Microscope
X-ray
Anaesthesia
Pasteurization
Penicillin
Concrete
Plumbing
Battery
Radio
Satellite
Rocket
Laser
Transistor
Solar panel
Electric motor
Jet engine
Helicopter
Train
Elevator
Escalator
Credit card
Barcode
QR code
Email
Search engine
Social media
Smartwatch
Calculator
Typewriter
Sewing machine
Dishwasher
Vacuum cleaner
Toaster
Umbrella
Velcro
Plastic
Lightning rod
Pencil
`,
  't-board': `
Mahjong
Rummikub
Yahtzee
Mancala
Stratego
Othello
Boggle
Blokus
Mastermind
Hungry Hungry Hippos
Mouse Trap
Kerplunk
Don't Break the Ice
Pandemic
Ticket to Ride
Carcassonne
Dixit
Splendor
Azul
Sushi Go!
Skip-Bo
Phase 10
Crazy Eights
Old Maid
Blackjack
Solitaire
Speed
War
Hearts
Bananagrams
Apples to Apples
Cards Against Humanity
Pass the Pigs
Headbanz
The Game of Life
Cranium
Kalah
Baloot
Tarneeb
Jackaroo
`,
  't-toys': `
Barbie
Transformers
Teenage Mutant Ninja Turtles
Polly Pocket
Bratz
My Little Pony
Hatchimals
Shopkins
L.O.L. Surprise!
Lite-Brite
Spirograph
Magna Doodle
Super Soaker
Frisbee
Hula hoop
Pogo stick
Skateboard
Jump rope
Toy train
Wooden blocks
Rocking horse
Mr. Potato Head
Stretch Armstrong
Bop It
Simon
Magic 8 Ball
View-Master
Tickle Me Elmo
Beanie Babies
Zhu Zhu Pets
Sylvanian Families
Playmobil
K'Nex
Mega Bloks
Duplo
Yu-Gi-Oh! cards
Gogo's Crazy Bones
Nintendo 64
Tamiya
Light-up sneakers
`,
  't-emoji': `
Heart Eyes
Wink
Kiss
Blush
Grinning
Rolling on the Floor
Zany Face
Shushing
Zipper Mouth
Neutral Face
Expressionless
Unamused
Grimacing
Relieved
Sleeping
Drooling
Face Mask
Cold Face
Hot Face
Woozy
Cowboy
Disguise
Monocle
Pouting
Angry
Screaming
Exploding Head
Flushed
Pensive
Worried
Yawning
Devil
Alien
Robot
Poop
Monkey See No Evil
Flexed Bicep
Clapping
OK Hand
Peace Sign
Crossed Fingers
Raising Hands
Waving Hand
Handshake
Brain
Trophy
Crown
Gem
Money Bag
Lightning
Rainbow
Star
Check Mark
Cross Mark
White Flag
`,
  't-hobby': `
Painting
Writing
Singing
Dancing
Tennis
Padel
Golf
Horse riding
Archery
Surfing
Skiing
Snowboarding
Scuba diving
Yoga
Bird watching
Astronomy
Model building
Pottery
Woodworking
Origami
Puzzle solving
Podcasting
Collecting cards
DJing
`,
  't-road': `
Travel Pillow
Trail Mix
Pretzels
Energy Drinks
Iced Coffee
Car Phone Mount
Paper Map
First Aid Kit
Jumper Cables
Tire Pressure Gauge
Flashlight
Cooler Bag
Paper Towels
Trash Bags
Tissues
Lip Balm
Sunscreen
Pillow & Blanket Set
Card Games
Travel Mug
Audiobook
Road Trip Bingo
Headphones
Tablet with Movies
Toll Pass
Spare Change
Phone Holder Fan
Dates & Nuts
Cookies
Popcorn
Extra Hoodie
Slippers
Car Air Freshener
Window Sun Shades
Loaded Snack Bag
Instant Camera Film
Licorice
Sour Candy
`,
  't-smell': `
Fresh Rain on Concrete
Gingerbread
Lemon
Jasmine
Sandalwood
Honey
Pizza in the Oven
Vanilla Candle
Sunscreen
Chlorine Pool
Cardamom Coffee
Rose Water
Freshly Cut Wood
Clean Baby
Leather
Strawberries
Caramel
Mango
Saffron
Bonfire Marshmallows
Fresh Mint Tea
Peppermint
`,
  't-holi': `
Lantern Festival
Ganesh Chaturthi
Mawlid
Islamic New Year
Laylat al-Qadr
Saudi National Day
Founding Day
Independence Day
Bastille Day
St. Patrick's Day
Mid-Autumn Festival
Carnival
Oktoberfest
Day of the Dead
Rosh Hashanah
Passover
Vesak
Songkran
Bonfire Night
Remembrance Day
Labour Day
Earth Day
Father's Day
Teacher's Day
Friendship Day
April Fools' Day
Pi Day
Star Wars Day
First Day of Summer
First Snowfall
World Kindness Day
Children's Day
Anniversary
Family Reunion
Your Team's Final
`,
  't-gadget': `
Laptop
Tablet
Smartwatch
Fitness tracker
E-reader
Action camera
Mirrorless camera
Gimbal
Wireless charger
Smart speaker
Smart bulb
Smart doorbell
Smart lock
Dashcam
Portable monitor
Gaming headset
Streaming microphone
Webcam
Capture card
Gaming controller
Retro handheld
Electric toothbrush
Massage gun
Portable blender
Coffee machine
Hoverboard
Tracker tag
Noise machine
Portable fan
USB hub
Graphics tablet
Label maker
Translator earbuds
Digital photo frame
`,
  't-wknd': `
Cinema Trip
Spa Day
Shisha Café Night
Karaoke
Camping Trip
Fishing
Cycling
Football Watch Party
Cooking Something New
Car Meet
Desert Trip
Day Trip to a New City
Thrift Shopping
Pottery Class
Mini Golf
Water Park
Video Call with Old Friends
Do Absolutely Nothing
`,
  't-school': `
Calculus
Algebra
Geometry
Literature
Creative Writing
Spanish
Arabic
Islamic Studies
World Religions
Civics
Politics
Sociology
Anthropology
Engineering
Robotics
Coding Club
Graphic Design
Photography
Film Studies
Cooking Class
Home Economics
Woodwork
Physical Education
Swimming Lessons
Environmental Science
Earth Science
Anatomy
Forensic Science
Debate
Public Speaking
Entrepreneurship
Personal Finance
Study Hall
Assembly
`,
  't-redflags': `
Talks over everyone
Laughs at people getting hurt
Keeps score in friendships
Never asks how you are
Only calls when they need something
Shares your secrets
Mean to people they think are "below" them
Makes every story about them
Can't lose at anything
Blames everyone else
Brags about cheating
Flakes on plans last minute
Rude to customer service
Gossips about everyone
Always "joking" when it hurts
Never lets you pick the music
Plays music out loud on the bus
Leaves you on read for days
Borrows things and never returns them
Says "I'm brutally honest"
Has no friends from before
Treats you differently in public
Hates every film you like
Makes fun of your hobbies
Reads your texts over your shoulder
Never tips
Drives aggressively
Doesn't flush
Picks fights online
Never admits they're wrong
Always one-upping your stories
Loud on speaker phone in public
Starts drama in the group chat
Takes 50 photos of their food
Late to everything, never sorry
Mocks people's accents
Can't keep a single plant alive (and blames you)
Thinks rules don't apply to them
Doesn't wash their hands
Gets angry at referees on TV for hours
`,
  't-greenflags': `
Asks how your day was
Remembers your birthday
Owns up to mistakes
Includes everyone
Good with your family
Stands up for people
Gives honest advice
Shows up when it matters
Shares their charger
Saves you the last slice
Sends memes that remind them of you
Asks before borrowing
Returns what they borrow
Picks up the bill sometimes
Checks you got home safe
Listens without interrupting
Keeps your secrets
Brings snacks
Good loser
Humble winner
Tips well
Polite to strangers
Laughs at themselves
Keeps their word
Says thank you
Learns your favourite things
Gives credit to others
Calm in a crisis
Reads the room
Cleans up after themselves
Encourages you to rest
Plans surprises
Remembers your friends' names
Tells you when there's food in your teeth
Drives you to the airport
Asks your opinion
Loves their grandparents
Volunteers
Picks up the phone
Lets you pick the film
`,
  't-skills': `
Basic plumbing
Hanging a shelf
Speed reading
Note taking
Basic electrical safety
Packing a suitcase well
Making a good first impression
Remembering names
Active listening
Giving a good apology
Saying no politely
Writing a good email
Basic Excel
Typing without looking
Video editing
Resisting impulse buys
Meal prepping
Baking bread
Grilling
Knife skills
Cleaning a bathroom properly
Doing laundry right
Folding a fitted sheet
Tying a tie
Shaving properly
Basic sewing
Riding a bike
Ice skating
Basic fitness
Stretching
Meditation
Sleeping well
Spotting scams
Online privacy
Backing up your files
Basic first aid for burns
Tying knots
Basic camping
Calming down in an argument
Learning how to learn
`,
  't-splurge': `
Pillows
A sofa
A desk
A monitor
Your keyboard
Hiking boots
Rain jacket
Winter boots
Sunglasses
Skincare
A good wallet
Backpack
Car seat for kids
Pots and pans
A blender
Air purifier
Bed frame
Towels
Your wedding
A family holiday
Healthy groceries
Therapy and wellbeing
Driving lessons
Home insurance
Tools that last
A good bag
Hair clippers
Gaming chair
Phone case
Power bank
Your commute
Good socks
Photo printing
Learning a language
Weekend getaway
Restaurant birthdays
A good barber
Tailoring
Noise-cancelling earbuds
A reliable bike
`,
  't-waste': `
Phone screen insurance you never use
Premium versions you don't need
Paid parking you could avoid
Fancy pet clothes
Pre-cut fruit
Brand-name medicine
Single-use gadgets
Gold-plated cables
Expensive gym clothes for no gym
Hotel breakfast
Convenience store prices
Holiday souvenirs
Mobile game gems
Premium fuel for a normal car
Overpriced theme park photos
Movie theatre 3D upgrade
Fancy candles you never light
Bulk buying food that expires
Tanning beds
Teeth-whitening gadgets
Car leasing for status
Overdraft fees
Payday loans
Fancy notebooks you never write in
Kitchen gadgets you use once
Gaming chairs as decoration
Expensive phone upgrades every year
Exercise bikes used as hangers
Branded water bottles
Influencer products
Collecting plastic bags
Paid dating apps
Seat upgrades on 1-hour flights
Fake designer stuff
VIP queue passes
Monthly snack boxes
Paid emoji packs
Rental insurance add-ons
Premium chewing gum
Fidget toys you lose in a week
`,
  't-partybring': `
Paper plates
Ice cream
Cookies
Fruit platter
Sandwiches
Popcorn
Juice
Sparkling water
A cooler
Card games
Party hats
Confetti
Bluetooth mic
Projector
Extension cord
Power bank
Wet wipes
Trash bags
Mini fan
A blanket
A frisbee
Candles
Decorations
Dates and coffee
Samosas
Shawarma platter
Cupcakes
Brownies
Doughnuts
Pizza rolls
Chocolate fountain
Nachos
Wings
Mocktails
Hot chocolate station
Jenga
Mario Kart
FIFA
Your funniest friend
A gift for the host
`,
  't-business': `
Pizza place
Burger joint
Shawarma shop
Juice bar
Sneaker reselling
Streetwear brand
Perfume brand
Skincare brand
Tutoring company
Driving school
Escape room
Bowling alley
Arcade
Cinema
Padel courts
Football academy
Car rental
Luxury car rental
Event planning
Photography studio
Recording studio
Podcast network
Game studio
App development agency
Marketing agency
Cleaning company
Moving company
Pet grooming
Bakery café
Candy shop
Flower shop
Furniture brand
Watch shop
Bike shop
Phone accessories brand
Board game café
Karting track
`,
  't-worldslive': `
Avonlea
Wonderland
Oz
Candy Land
The Hundred Acre Wood
Middle-earth
Tatooine
Coruscant
Rivendell
The Avatar World's Air Temples
Pallet Town
Kanto
Sodor
Toontown
Agrabah
Atlantica
Radiator Springs
San Fransokyo
Metropolis
Stars Hollow
Pawnee
Smurf Village
Gravity Falls
Hogsmeade
Ninjago City
Skyrim
Tamriel
Azeroth
Paddington's London
The Lego Movie's Bricksburg
The Incredibles' Metroville
Spirited Away's Bathhouse
Totoro's Countryside
Sky Island
The Sims Neighbourhood
Rocket League Arena
Fortnite Island
Minecraft Village
Stardew Valley
Animal Crossing Village
`,
  't-worldsavoid': `
The Hunger Games Capitol
The Labyrinth
The Other World from Coraline
Skynet's Future
The Borg Cube
King's Landing
Vecna's Mind Lair
The Island from Lost
Mad Max's Wasteland
The Thing's Antarctic Base
Jurassic World
The Lost World
Planet of the Apes
Alien's Nostromo
LV-426
The Shining's Overlook Hotel
Elm Street
Camp Crystal Lake
Derry
The Twilight Zone
The Hunger Games' District 12
The Glade
Divergent's Chicago
Oceania from 1984
Gilead
Westworld
Black Mirror's world
Resident Evil's Mansion
Five Nights at Freddy's Pizzeria
Bloodborne's Yharnam
Elden Ring's Lands Between
Dark Souls' Anor Londo
Fallout's Vault
Half-Life's City 17
The Last of Us World
The Death Star
Mustafar
The Shadow Realm
Pennywise's Sewers
The Nether
The End
Zombieland
`,
  't-annoying': `
People who walk four across
Kicking the back of your seat
Phone ringing in the cinema
Neighbours drilling at 8 am
Shoes that squeak
Cold food that should be hot
Hot drinks that are too hot
Missing the bus by seconds
Wi-Fi that drops
Typing "lol" with a straight face
Stepping on LEGO
Receipts that are 2 metres long
Online forms that reset
Captchas
Two-factor codes that never arrive
Getting your sleeve wet washing hands
Hair in the food
Someone eating your leftovers
Slow lifts
Car alarms at night
People not saying thank you
Tags that itch
Shoelaces untying
Running out of toilet paper
Bad parking
Queue jumpers
Soggy chips
Phone updates at the worst time
Loud speakerphone calls
Low battery warning at 20%
Hiccups
Sneezing in sunlight
Cracked phone screen
Stickers that won't peel
Charging cables that only work at an angle
Group projects
Leaving your phone at home
Rain right after you wash the car
Ads before a 10-second video
"We need to talk"
`,
  't-satisfying': `
Peeling a perfect orange in one go
Cracking an egg perfectly
Folding a fitted sheet right
Empty inbox
Deleting old files
Organising your desk
Soap cutting videos
Slime
Making a perfect pour
Catching your phone before it drops
Hitting all green lights
Finding the perfect parking spot
First bite of a crispy burger
Opening a fresh tub of Nutella
Watching ice melt on a hot day
Car wash foam
Lawn mower stripes
Perfect latte art
Finishing a series
Completing a game 100%
Dunking the ball
Top-bin goal
Hole in one
Strike in bowling
Untangling a knot
Fitting everything in the dishwasher
Closing a full suitcase
Scraping ice off a windscreen
Snapping a chocolate bar
Pouring cereal then milk perfectly
The sound of a can opening
Ripping off a sticker in one piece
Pancake flip landing
Sweeping into a dustpan in one go
Plugging a USB in first try
Hearing your name called first
Everything charged before bed
A clean car interior
A fresh pair of socks
`,
  't-dayimprovers': `
Breakfast in bed
The bus arriving right as you get there
A random good review at work
Seeing an old friend
A baby smiling at you
A free upgrade
Finding a parking spot right outside
Getting extra fries
A cancelled meeting
Perfect weather
Phone at 100% in the morning
A good workout
A fresh haircut
New shoes
A thank-you message
Your favourite song on shuffle
Your mum's cooking
A clean house
A day off
Smell of rain
A good book
A funny meme
Your crush texting back
Learning something new
Finishing a task you've been avoiding
Someone remembering your name
A stranger holding the door
A kid giving you a drawing
Getting a package
Sleeping 8 hours
A good parking spot at the mall
A new episode out
Winning a game with friends
A sunny morning walk
Fresh juice
Cookies out of the oven
A long hug
Your pet happy to see you
Ice cream truck
`,
  't-spend100': `
Football boots
A good backpack
Video game subscription
Fancy brunch for two
Karaoke night
Cinema with snacks
Day pass at a spa
Bike repair
New headphones
Mechanical keyboard
Art supplies
A good pillow
Running shoes
Restaurant you always wanted to try
Mini golf and dinner
Phone accessories
A watch strap
A nice perfume sample set
Fishing gear
Camping gear
Treat your parents
Surprise for a friend
Pizza party
Plants for your room
Lego set
Puzzle collection
Fruit basket
New bedsheets
Tickets to a local game
Cooking class
Painting class
Online course
Car detailing
A good knife
Phone stand and ring light
Sunglasses
Hat collection
Coffee beans and grinder
Frame your best photos
`,
  't-spend1000': `
A gaming console and games
A new bed
A gym membership for a year
A weekend in a cabin
Diving course
Flying lesson
Track day in a sports car
A designer bag
Fragrance collection
A good camera lens
Home studio setup
Pro football boots and kit
A new wardrobe
Kitchen upgrade
Treat the whole family to dinner
Buy a bike and gear
Electric scooter
Smart home setup
Desk setup upgrade
A good mattress
Language course abroad
Concert tour tickets
Theme park trip
Sports game VIP seats
Gift for your parents
Surprise party for a friend
Car repairs
Rent buffer
Stocks or index fund
A gold chain
A designer watch
Desert safari with friends
A spa weekend
Weekend in Dubai
Tickets to a final
Buy your first shares
Learn to drive
Hot air balloon ride
Camping gear for life
`,
  't-3am': `
Watch a full football match replay
Research random facts
Make a smoothie
Play chess online
Learn a new skill on YouTube
Video call a friend in another time zone
Take a long shower
Organise your phone photos
Write a to-do list for tomorrow
Plan your dream trip
Make a sandwich
Rewatch old videos
Listen to a podcast
Watch the stars from the roof
Pet your cat
Text your crush (bad idea)
Online shopping you'll regret
Do a puzzle
Build Lego
Write a song
Practise guitar quietly
Pray
Watch a scary film
Make hot chocolate
Do homework you forgot
Edit videos
Stalk old photos
Learn a magic trick
Watch speedruns
Take a walk outside
Rewatch your favourite film
Read old messages
Make a vision board
Learn to cook something
Plan a business
Fold laundry
Workout at home
Watch cooking videos
Plan a surprise
`,
  't-worstpowers': `
Smell colours
Super strength, but only when sneezing
Teleport, but only to your school
Talk to bugs who only complain
Invisible clothes, not you
Fly, but only 1 km/h
Super speed, only while walking backwards in sand
Turn water into slightly warmer water
Mind reading, only for babies
Summon a spoon (once a day)
Perfect memory of every ad you've seen
Grow your fingernails instantly
Shoot bubbles from your nose
Know everyone's shoe size
Change the colour of bananas
Telekinesis for paper clips only
Breathe fire, but it's cold
Sneeze glitter
Turn into a pigeon at random
Hear every phone ringing in the city
Know when food is about to burn, 1 second late
Turn invisible when you sleep
Heal others, but you get their cold
Talk to computers who don't answer
Control traffic lights, but only red
Make anyone sleepy, including yourself
Every door you open squeaks
Stretch your arms 1 cm
Change channels on other people's TVs
Super jump, only on stairs
Always find the slowest queue
Super taste, but everything tastes like broccoli
Freeze objects, but only ice
Become immortal at age 90
Light up like a lamp when nervous
Glow in the dark, only in daylight
Understand cats, who hate you
Duplicate yourself, but the copy is lazy
Shapeshift, only into a teapot
Predict the weather, 5 minutes late
`,
  't-powercombos': `
Healing + Super Speed
Invisibility + Flight
Shapeshifting + Telepathy
Fire Powers + Ice Powers
Telekinesis + Super Intelligence
Teleportation + Time Freeze
Super Strength + Invulnerability
Mind Reading + Time Travel
Laser Eyes + X-Ray Vision
Duplication + Teleportation
Animal Control + Flight
Super Luck + Time Travel
Photographic Memory + Speed Reading
Force Fields + Super Strength
Plant Control + Healing
Weather Control + Lightning
Night Vision + Invisibility
Speak Every Language + Teleportation
Intangibility + Teleportation
Gravity Control + Super Strength
Healing + Immortality
Mind Control + Invisibility
Water Breathing + Talk to Animals
Technopathy + Super Intelligence
Elasticity + Super Strength
Super Speed + Never Need Sleep
`,
  't-shouldexist': `
A dishwasher that also puts dishes away
Self-tying shoelaces for everyone
A mute button for people
Rain-proof phone screens
A car that parks itself everywhere
Shoes that charge your phone
A bed that makes itself
A "find my everything" button
Edible water bottles
A pillow that stays cool all night
A shower with saved settings
Groceries that come to you instantly
Homework that does itself
An app that ends awkward silences
Sunglasses that dim the sun on command
A toaster that never burns
Pizza that stays hot for hours
A clock that adds an extra hour on weekends
A plane seat with real legroom
Wi-Fi that works in lifts
Ice cream that doesn't melt
A sleeping pod at school
A taxi drone
A translator earpiece for animals
An app that tells you who ate your food
A room that cleans itself while you sleep
Chocolate that's healthy
A personal weather bubble
A fridge that tells you what to cook
Glasses that remind you of names
A pen that never runs out
A mirror that shows your outfit from behind
Self-charging phones
A button that ends meetings
Clothes that change size as you grow
A real-life inventory bag
A car that never needs fuel
A lunchbox that keeps food fresh forever
An alarm that gently pulls you out of bed
A one-hour flight to anywhere
`,
  't-collect': `
Postcards
Bottle caps
Vintage cameras
Old phones
Sneaker boxes
Perfume bottles
Model cars
Trading cards
Football stickers
Panini albums
Baseball cards
Basketball cards
Seashells
Fossils
Antique maps
Vinyl toys
Swords
Pens
Notebooks
Banknotes
Movie tickets
Concert tickets
Magazines
Matchbox cars
Teacups
Lego minifigures
Video game consoles
Arcade machines
Typewriters
Glass bottles
Patches
Caps
Football boots
Jerseys
Autographs
Rubik's cubes
Puzzles
Board games
Classic cars
`,
  't-overrated': `
Celebrity restaurants
Birthday surprises at work
Big weddings
Expensive sneakers
Matching outfits
Celebrity perfumes
Theme park queues
Five-star hotel breakfasts
Overpriced popcorn
Waking up at 5 am
Wellness retreats
Detox teas
Influencer gyms
Fancy cupcakes
Cold brew
Luxury cars in traffic
Fancy cars for the school run
TikTok trends
Reality TV
Award shows
Superhero films (the 30th one)
Remakes
Sequels
Ten-step skincare
Tiny houses
Open-plan offices
Group holidays
Bottle service
Glamping
Smart watches for texting
Hoverboards
Gold phone cases
Wireless everything
Unboxing videos
"Secret" menu items
Ultra-hot sauce challenges
Food served on boards
Paying for blue ticks
Last-minute shopping
Huge TVs
Buffets
`,
  't-underrated': `
Rice
Soup
Bananas
Cold pizza
Sleeping in socks
Afternoon tea
Morning walks
Clean bedsheets
Cooking at home
Reading before bed
Water parks
Picnics
Local markets
Thrift shops
Second-hand books
Handwritten letters
Uncles who tell jokes
Old cartoons
Classic films
Mixtapes
Flip phones
Bicycles
Hiking
Sunsets
Dates
Hot showers
Cold water
Tidy rooms
Calendars
Notebooks
Asking for help
Free museums
Coupons
Second-hand cars
Village life
Long drives
Quiet friends
Learning to cook
Listening
`,
};
