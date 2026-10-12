/* Extra items for big groups — Animals. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_ANIMALS = {
  't-ani': `
Hippo Bull|Land|Territorial river heavyweight|🦛
Lioness|Land|The pride's hunter|🦁
Mandrill|Land|Colourful and fierce|🐒
Narwhal|Sea|Unicorn tusk|🦄
Polar Bear|Land|Biggest land carnivore|🐻‍❄️
Jaguar|Land|Crushing bite|🐆
Leopard|Land|Climbs with its prey|🐆
Cape Buffalo|Land|Black death of the savanna|🐃
Moose|Land|Huge and grumpy|🫎
Bison|Land|Charging tonne|🦬
Wolverine|Land|Pound-for-pound tough|🦡
Hyena|Land|Bone-crushing jaws|🐺
Silverback Gorilla|Land|Gentle until not|🦍
Anaconda|Land|Constrictor|🐍
King Cobra|Land|Longest venomous snake|🐍
Black Mamba|Land|Fastest snake|🐍
Kodiak Bear|Land|Giant brown bear|🐻
Giraffe|Land|Deadly kick|🦒
Ostrich|Land|Kicks like a truck|🪶
Cassowary|Land|Dagger claws|🐦
Saltwater Crocodile|Land|Strongest bite|🐊
Hammerhead Shark|Sea|Wide-set eyes|🦈
Tiger Shark|Sea|Eats anything|🦈
Bull Shark|Sea|Swims up rivers|🦈
Leopard Seal|Sea|Antarctic hunter|🦭
Walrus|Sea|Tusks|🦭
Sperm Whale|Sea|Fights giant squid|🐋
Box Jellyfish|Sea|Deadly sting|🪼
Electric Eel|Sea|600 volts|⚡
Mantis Shrimp|Sea|Fastest punch|🦐
Barracuda|Sea|Torpedo teeth|🐟
Moray Eel|Sea|Double jaws|🐍
Golden Eagle|Air|Hunts deer|🦅
Harpy Eagle|Air|Talons like grizzly claws|🦅
Peregrine Falcon|Air|Fastest animal alive|🦅
Andean Condor|Air|Giant wingspan|🦅
Great Horned Owl|Air|Silent hunter|🦉
Vulture|Air|Cleans up|🦅
Crow|Air|Genius bird|🐦‍⬛
Goose|Air|Pure aggression|🪿
Pelican|Air|Huge beak|🐦
Albatross|Air|Longest wings|🕊️
Murder Hornet|Air|Asian giant hornet|🐝
Dragonfly|Air|Perfect hunter|🪰
Bullet Ant|Land|Most painful sting|🐜
Scorpion|Land|Venomous tail|🦂
Tarantula|Land|Hairy spider|🕷️
Snapping Turtle|Sea|Beak bite|🐢
Piranha|Sea|Swarm attack|🐟
Stingray|Sea|Barbed tail|🐟
Killer Bee|Air|Aggressive swarm|🐝
Bat Swarm|Air|Thousands strong|🦇`,

  't-pet': `
Labrador|Dog|Family favourite|🐕
Beagle|Dog|Nose first|🐶
Corgi|Dog|Royal shorties|🐕
Dachshund|Dog|Sausage dog|🌭
Shiba Inu|Dog|Doge|🐕
Poodle|Dog|Smart and fluffy|🐩
Chihuahua|Dog|Tiny and brave|🐕
Border Collie|Dog|Smartest dog|🐕
Bulldog|Dog|Wrinkly|🐶
Pug|Dog|Squishy face|🐶
Samoyed|Dog|Smiling cloud|🐕
Cavapoo|Dog|Teddy bear|🐶
British Shorthair|Cat|Round and calm|🐈
Bengal Cat|Cat|Mini leopard|🐆
Scottish Fold|Cat|Folded ears|🐱
Russian Blue|Cat|Silver coat|🐈
Tabby Cat|Cat|Classic stripes|🐈
Black Cat|Cat|Lucky or not|🐈‍⬛
Orange Cat|Cat|One brain cell|🐈
Calico Cat|Cat|Three colours|🐈
Birman|Cat|Silky and gentle|🐈
Abyssinian|Cat|Active explorer|🐈
Norwegian Forest Cat|Cat|Viking cat|🐈
Exotic Shorthair|Cat|Flat-faced cutie|🐱
Cockatiel|Other|Whistles tunes|🦜
Canary|Other|Sings all day|🐤
Gecko|Other|Sticky feet|🦎
Hermit Crab|Other|Shell swapper|🦀
Gerbil|Other|Desert digger|🐭
Rat|Other|Clever and clean|🐀
Mouse|Other|Tiny|🐁
Pony|Other|Mini horse|🐴
Betta Fish|Other|Fancy fins|🐟
Koi|Other|Pond royalty|🐟`,

  't-cats': `
Sunda Leopard Cat||Small island hunter|🐈
Chinese Mountain Cat||Rare cat of the Tibetan plateau|🐈
Javan Leopard||Rare island leopard|🐆
Bengal Tiger
Amur Tiger
Sumatran Tiger
Malayan Tiger
Asiatic Lion
Barbary Lion
White Lion
White Tiger
Black Panther
Amur Leopard
Persian Leopard
African Leopard
Indian Leopard
Sri Lankan Leopard
Florida Panther
Andean Mountain Cat
Pampas Cat
Geoffroy's Cat
Kodkod
Oncilla
Flat-headed Cat
Marbled Cat
Asian Golden Cat
African Golden Cat
Bornean Bay Cat
Jungle Cat
Wildcat
African Wildcat
Leopard Cat
Sunda Clouded Leopard
King Cheetah
Asiatic Cheetah
Northeast African Cheetah
Liger
Tigon
Saber-toothed Cat||||Smilodon
Cave Lion
American Lion`,

  't-dogbreeds': `
Alaskan Malamute
Bichon Frise
Boston Terrier
Cane Corso
Dogo Argentino
English Springer Spaniel
Irish Setter
Irish Wolfhound
Jack Russell Terrier
Labradoodle
Goldendoodle
Lhasa Apso
Mastiff
Old English Sheepdog
Papillon
Pekingese
Pit Bull
Rhodesian Ridgeback
Saint Bernard
Schnauzer
Scottish Terrier
Shetland Sheepdog
Weimaraner
Whippet
West Highland White Terrier
Vizsla
Basenji
Basset Hound
Bloodhound
Borzoi
Afghan Hound
Great Pyrenees
Leonberger
Tibetan Mastiff
Xoloitzcuintle`,

  't-catbreeds': `
Donskoy||Hairless Russian breed|🐈
Ukrainian Levkoy||Folded-ear hairless cat|🐈
Bombay
Chartreux
Korat
LaPerm
Manx
Nebelung
Ocicat
Oriental Shorthair
Peterbald
Pixie-bob
Selkirk Rex
Singapura
Snowshoe
Somali
Toyger
American Curl
American Bobtail
Balinese
Burmilla
Cymric
Havana Brown
Japanese Bobtail
Kurilian Bobtail
Lykoi
Minuet
Ojos Azules
Highlander
Chausie
Serengeti
Sokoke
Thai
Aegean Cat
Khao Manee
Mekong Bobtail
Australian Mist
German Rex`,

  't-sharks': `
Blacknose Shark||Small Atlantic shark|🦈
Daggernose Shark||Long pointed snout|🦈
Galápagos Shark
Silky Shark
Dusky Shark
Sandbar Shark
Spinner Shark
Blacktip Shark
Caribbean Reef Shark
Grey Reef Shark
Silvertip Shark
Scalloped Hammerhead
Smooth Hammerhead
Porbeagle
Salmon Shark
Longfin Mako
Bigeye Thresher
Pelagic Thresher
Tawny Nurse Shark
Epaulette Shark
Port Jackson Shark
Horn Shark
Bamboo Shark
Spiny Dogfish
Small-spotted Catshark
Swell Shark
Lantern Shark
Pocket Shark
Bluntnose Sixgill Shark
Broadnose Sevengill Shark
Pacific Sleeper Shark
Kitefin Shark
Sawshark
Tasselled Wobbegong
Crocodile Shark
Speartooth Shark
Ganges Shark
Pondicherry Shark
Whitenose Shark`,

  't-whales': `
Southern Right Whale
Bryde's Whale
Omura's Whale
Pygmy Right Whale
Pygmy Sperm Whale
Dwarf Sperm Whale
Baird's Beaked Whale
Blainville's Beaked Whale
Northern Bottlenose Whale
Melon-headed Whale
Pygmy Killer Whale
Long-finned Pilot Whale
Short-finned Pilot Whale
Atlantic Spotted Dolphin
Pantropical Spotted Dolphin
Striped Dolphin
Rough-toothed Dolphin
Fraser's Dolphin
Dusky Dolphin
Hourglass Dolphin
White-beaked Dolphin
Atlantic White-sided Dolphin
Peale's Dolphin
Chilean Dolphin
Heaviside's Dolphin
Indo-Pacific Humpback Dolphin
Australian Snubfin Dolphin
Tucuxi
La Plata Dolphin
Ganges River Dolphin
Indus River Dolphin
Harbour Porpoise
Dall's Porpoise
Finless Porpoise
Spectacled Porpoise
Burmeister's Porpoise
Northern Right Whale Dolphin
Southern Right Whale Dolphin
Antarctic Minke Whale
Pygmy Blue Whale`,

  't-raptors': `
Bateleur
Tawny Eagle
African Fish Eagle
White-tailed Eagle
Booted Eagle
Short-toed Snake Eagle
Crested Caracara
Laughing Falcon
Lanner Falcon
Prairie Falcon
American Kestrel
Eurasian Hobby
Aplomado Falcon
Cooper's Hawk
Sharp-shinned Hawk
Rough-legged Buzzard
Common Buzzard
Ferruginous Hawk
Swainson's Hawk
Black Kite
Snail Kite
Swallow-tailed Kite
Hen Harrier
Western Marsh Harrier
Northern Harrier
King Vulture
Egyptian Vulture
Griffon Vulture
Lappet-faced Vulture
Black Vulture
Burrowing Owl
Great Grey Owl
Tawny Owl
Spotted Owl
Elf Owl
Blakiston's Fish Owl
Short-eared Owl
Long-eared Owl`,

  't-parrots': `
Green-winged Macaw
Military Macaw
Spix's Macaw
Palm Cockatoo
Major Mitchell's Cockatoo
Gang-gang Cockatoo
Red-tailed Black Cockatoo
Yellow-headed Amazon
Monk Parakeet
Rose-ringed Parakeet
Alexandrine Parakeet
Senegal Parrot
Kakariki
Hawk-headed Parrot
Caique
Golden Conure
Jenday Conure
Pacific Parrotlet
Superb Fairywren
Painted Bunting
Scarlet Tanager
Paradise Tanager
Wilson's Bird-of-paradise
King of Saxony Bird-of-paradise
Victoria Crowned Pigeon
Nicobar Pigeon
Lady Amherst's Pheasant
Himalayan Monal
Keel-billed Toucan
Hoatzin
Bee-eater
Hummingbird
Sunbird
Hoopoe
Roseate Spoonbill
Scarlet Ibis
Sri Lanka Junglefowl
Crested Partridge`,

  't-reptiles': `
Black Caiman
Chinese Alligator
Cuban Crocodile
Mugger Crocodile
Tomistoma
Dwarf Crocodile
Hawksbill Sea Turtle
Loggerhead Sea Turtle
Kemp's Ridley Sea Turtle
Olive Ridley Sea Turtle
Box Turtle
Red-eared Slider
Softshell Turtle
Mata Mata
Spur-thighed Tortoise
Sulcata Tortoise
Radiated Tortoise
Leopard Tortoise
Veiled Chameleon
Jackson's Chameleon
Crested Gecko
Tokay Gecko
Satanic Leaf-tailed Gecko
Flying Dragon
Armadillo Girdled Lizard
Chinese Water Dragon
Rhinoceros Iguana
Green Basilisk
Perentie
Lace Monitor
Savannah Monitor
Black-throated Monitor
Mexican Beaded Lizard
Glass Lizard
Uromastyx
Desert Monitor
Collared Lizard
Anole
Slow Worm`,

  't-snakes': `
Puff Adder
Rhinoceros Viper
Bushmaster
Eyelash Viper
Timber Rattlesnake
Mojave Rattlesnake
Tiger Snake
Coastal Taipan
Death Adder
Mulga Snake
Red-bellied Black Snake
Banded Krait
Many-banded Krait
Indian Cobra
Monocled Cobra
Egyptian Cobra
Cape Cobra
Rinkhals
Boomslang
Twig Snake
Green Mamba
Jameson's Mamba
Emerald Tree Boa
Rainbow Boa
Rosy Boa
Kenyan Sand Boa
Dumeril's Boa
Rock Python
Carpet Python
Children's Python
Blood Python
Hognose Snake
Rat Snake
Kingsnake
Rough Green Snake
Paradise Flying Snake
Vine Snake
Wolf Snake`,

  't-dinos': `
Albertosaurus
Gorgosaurus
Tarbosaurus
Daspletosaurus
Megalosaurus
Ceratosaurus
Suchomimus
Acrocanthosaurus
Carcharodontosaurus
Mapusaurus
Majungasaurus
Yutyrannus
Microraptor
Oviraptor
Compsognathus
Coelophysis
Herrerasaurus
Plateosaurus
Camarasaurus
Brontosaurus
Mamenchisaurus
Sauroposeidon
Dreadnoughtus
Patagotitan
Amargasaurus
Nigersaurus
Styracosaurus
Pachyrhinosaurus
Centrosaurus
Protoceratops
Psittacosaurus
Kentrosaurus
Euoplocephalus
Nodosaurus
Maiasaura
Corythosaurus
Lambeosaurus
Shantungosaurus
Ouranosaurus
Dimetrodon
Ichthyosaurus
Elasmosaurus
Liopleurodon
Kronosaurus
Dimorphodon
Rhamphorhynchus
Tupandactylus
Sarcosuchus
Deinosuchus
Postosuchus
Troodon
Muttaburrasaurus
Minmi
Mussaurus`,

  't-prehistmammals': `
Megaloceros||||Irish elk
Megalonyx
Toxodon
Arsinoitherium
Uintatherium
Brontotherium
Amphicyon
Daeodon
Sarkastodon
Thylacosmilus
Xenosmilus
Homotherium
Cave Hyena
Columbian Mammoth
Steppe Mammoth
Gomphotherium
Platybelodon
Moeritherium
Pakicetus
Rodhocetus
Dorudon
Livyatan
Josephoartigasia
Castoroides
Procoptodon
Palorchestes
Zygomaturus
Megalania
Phorusrhacos
Titanis
Gastornis
Hipparion
Eohippus
Synthetoceras
Merychippus
Aepycamelus
Sivatherium
Giant Beaver||||Castoroides
Ground Sloth||||Ground sloth`,

  't-insects': `
Fire Ant
Army Ant
Carpenter Ant
Weaver Ant
Velvet Ant
Tarantula Hawk
Paper Wasp
Yellowjacket
Carpenter Bee
Mason Bee
Hornet
Blue Morpho
Swallowtail Butterfly
Painted Lady
Peacock Butterfly
Glasswing Butterfly
Death's-head Hawkmoth
Hummingbird Hawk-moth
Rosy Maple Moth
Cecropia Moth
Silkworm
Firebug
Shield Bug
Water Strider
Giant Water Bug
Assassin Bug
Cicada Killer
Jewel Beetle
Rhinoceros Beetle
Titan Beetle
Tiger Beetle
Click Beetle
Weevil
Earwig
Silverfish
Flea
Housefly
Horsefly
Hoverfly
Lacewing
Mayfly
Damselfly
Katydid
Cricket`,

  't-farm': `
Guinea Hog||Small heritage farm pig|🐖
Belted Galloway||The 'Oreo cow'|🐄
Jacob Sheep||Up to six horns|🐑
Brahma Chicken||Giant fluffy hen|🐔
Indian Runner Duck||Walks upright like a bottle|🦆
Nubian Goat||Long floppy ears|🐐
Hen
Rooster
Piglet
Calf
Lamb
Dairy Cow
Holstein Friesian
Angus Cattle
Hereford Cattle
Jersey Cow
Merino Sheep
Suffolk Sheep
Nigerian Dwarf Goat
Boer Goat
Angora Goat
Clydesdale
Shire Horse
Shetland Pony
Arabian Horse
Pekin Duck
Muscovy Duck
Mallard
Peacock
Pheasant
Pigeon
Barn Cat
Zebu
Brahman Cattle
Dromedary
Bactrian Camel
Reindeer
Emu
Hinny
Mini Donkey||||Donkey
Silkie Chicken
Wagyu Cattle`,

  't-safari': `
Puku||Golden floodplain antelope|🦌
Sitatunga||Swamp antelope|🦌
Lechwe||Splashes through floodplains|🦌
Common Reedbuck||Hides in tall grass|🦌
Gelada||Bleeding-heart monkey|🐒
Black-and-white Colobus||Flowing white cape|🐒
Steenbok||Tiny solitary antelope|🦌
Common Duiker||Ducks into the bush|🦌
Pel's Fishing Owl||Ginger owl that fishes|🦉
Hamerkop||Builds giant nests|🐦
Black Rhinoceros
Masai Giraffe
Grevy's Zebra
Plains Zebra
Topi
Thomson's Gazelle
Grant's Gazelle
Springbok
Eland
Sable Antelope
Roan Antelope
Oryx
Waterbuck
Nyala
Bushbuck
Dik-dik
Klipspringer
Hartebeest
Bongo
Gerenuk
Caracal
Serval
African Civet
Honey Badger
Banded Mongoose
Bat-eared Fox
Black-backed Jackal
Aardwolf
Striped Hyena
Bushbaby
Vervet Monkey
Olive Baboon
Rock Hyrax
Marabou Stork
Shoebill
Southern Ground Hornbill
Lilac-breasted Roller
Kori Bustard
Grey Crowned Crane
African Fish Eagle
Martial Eagle
Black Mamba
African Rock Python
Leopard Tortoise
Nile Monitor
Dung Beetle`,

  't-arctic': `
Arctic Skua||Pirate of the skies|🐦
Beluga Calf||Born grey, turns white|🐋
Arctic Fox Kit||Fluffy brown pup|🦊
Snowshoe Hare||Giant snowy feet|🐇
Northern Fulmar||Tube-nosed seabird|🐦
Sea Angel||Tiny winged snail|🪽
Arctic Char
Bearded Seal
Hooded Seal
Spotted Seal
Ribbon Seal
Steller Sea Lion
Sea Otter
Arctic Ground Squirrel
Collared Lemming
Ermine
Canada Lynx
Grizzly Bear
Moose
Dall Sheep
Reindeer
Svalbard Reindeer
Gyrfalcon
Ivory Gull
Little Auk
Thick-billed Murre
Common Eider
King Eider
Long-tailed Duck
Snow Bunting
Common Raven
Glaucous Gull
Black Guillemot
Atlantic Cod
Arctic Cod
Polar Cod
Greenland Halibut
Lion's Mane Jellyfish
Snow Crab
Arctic Woolly Bear Moth
Sea Butterfly
Kamchatka Brown Bear
Muskrat`,

  't-aussie': `
Eastern Grey Kangaroo
Tree-kangaroo
Quoll
Bandicoot
Bettong
Potoroo
Pademelon
Rock-wallaby
Ringtail Possum
Greater Glider
Feathertail Glider
Honey Possum
Marsupial Mole
Spotted-tailed Quoll
Brolga
Jabiru
Rainbow Lorikeet
Sulphur-crested Cockatoo
Pink Cockatoo
Black Swan
Australian Magpie
Wedge-tailed Eagle
Tawny Frogmouth
Lace Monitor
Perentie
Shingleback Lizard
Blue-tongued Lizard
Eastern Water Dragon
Freshwater Crocodile
Tiger Snake
Eastern Brown Snake
Redback Spider
Huntsman Spider
Green Tree Frog
Corroboree Frog
Leafy Seadragon
Weedy Seadragon
Little Penguin
Australian Sea Lion`,

  't-primates': `
Western Lowland Gorilla
Eastern Gorilla
Bornean Orangutan
Sumatran Orangutan
Tapanuli Orangutan
Lar Gibbon
Hoolock Gibbon
Drill
Olive Baboon
Chacma Baboon
Barbary Macaque
Crab-eating Macaque
Bonnet Macaque
Lion-tailed Macaque
Hanuman Langur
Douc Langur
Dusky Leaf Monkey
Red Colobus
De Brazza's Monkey
Diana Monkey
Patas Monkey
Owl Monkey
Saki Monkey
Woolly Monkey
Muriqui
Emperor Tamarin
Cotton-top Tamarin
Common Marmoset
Aye-aye
Indri
Sifaka
Mouse Lemur
Slow Loris
Potto
Western Tarsier
Gray Langur
Golden Langur
Black-headed Spider Monkey
Red-shanked Douc
Allen's Swamp Monkey`,

  't-deepsea': `
Dragonfish
Black Dragonfish
Stoplight Loosejaw
Deep-sea Lizardfish
Tripod Fish
Hagfish
Glass Squid
Bigfin Squid
Firefly Squid
Cock-eyed Squid
Telescope Octopus
Glass Octopus
Flapjack Octopus
Basket Star
Brittle Star
Sea Spider
Giant Amphipod
Zombie Worm
Pompeii Worm
Football Fish
Triplewart Seadevil
Ghost Shark
Sixgill Shark
Greenland Shark
Sleeper Shark
Megamouth Shark
Cookiecutter Shark
Pelican Eel
Snipe Eel
Cusk Eel
Grenadier
Orange Roughy
Pacific Blackdragon
Benthocodon
Atolla Jellyfish
Crown Jellyfish
Comb Jelly
Giant Phantom Jelly
Sea Toad
Bristlemouth`,

  't-extinct': `
Sabre-toothed Cat||||Smilodon
Woolly Rhinoceros
Mastodon
Giant Ground Sloth
Glyptodon
Dire Wolf
Short-faced Bear
Cave Bear
Megalania
Thylacoleo
Diprotodon
Terror Bird
Titanoboa
Heath Hen
Pink-headed Duck
Spectacled Cormorant
Atlas Bear
Barbary Lion
Caspian Tiger
Bali Tiger
Zanzibar Leopard
Toolache Wallaby
Falkland Islands Wolf
Japanese Wolf
Mexican Grizzly Bear
Tarpan
Bluebuck
Schomburgk's Deer
Sea Mink
Stephens Island Wren
Huia
Laughing Owl
Kauaʻi ʻōʻō
Christmas Island Pipistrelle
Pinta Island Tortoise
Rocky Mountain Locust
Xerces Blue
Chinese Paddlefish
Northern White Rhinoceros
Spix's Macaw
Sumatran Rhinoceros`,

  't-cute': `
Baby Koala||Tiny clinging joey|🐨
Fluffy Owlet||Ball of feathers|🦉
Baby Hedgehog||Soft little spikes|🦔
Baby Capybara||Calm mini chonk|🐹
Bunny Kit||Pocket-sized rabbit|🐇
Baby Red Panda||Fuzzy and tiny|🐼
Baby Otter
Panda Cub
Koala Joey
Baby Penguin
Puffin
Guinea Pig
Netherland Dwarf Rabbit
Lop Rabbit
Golden Retriever Puppy
Pomeranian
Samoyed
Corgi Puppy
French Bulldog
Pug
Baby Goat
Piglet
Calf
Foal
Fawn
Baby Hippo
Baby Giraffe
Baby Sloth
Pygmy Hedgehog
Sugar Glider
Fennec Fox Kit
Red Fox Kit
Snow Leopard Cub
Lion Cub
Tiger Cub
Polar Bear Cub
Baby Seal
Sea Lion Pup
Beluga Calf
Dumbo Octopus
Pygmy Hippo
Slow Loris
Sand Cat
Pallas's Cat
Ermine
Long-tailed Tit
Chick
Baby Owl
Alpaca
Marmot
Chipmunk
Dormouse
Harvest Mouse
Jerboa
Pika
Wombat Joey`,
};
