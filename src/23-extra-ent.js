/* Extra items for big groups — Entertainment. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_ENT = {
  't-rap': `
Lauryn Hill
Ice Cube
Missy Elliott
Busta Rhymes
OutKast
André 3000
Kid Cudi
Childish Gambino
Chance the Rapper
Mac Miller
Logic
Lil Uzi Vert
Young Thug
Gunna
Lil Durk
NBA YoungBoy
Rod Wave
DaBaby
Roddy Ricch
Jack Harlow
Doja Cat
Latto
GloRilla
Ice Spice
Doechii
Don Toliver
Lil Nas X
Gucci Mane
T.I.
Ludacris
Pusha T
Nipsey Hussle
XXXTentacion
Lil Peep
Wiz Khalifa
Big Sean
Meek Mill
Rick Ross
DMX
LL Cool J
Run-DMC
Rakim
Ghostface Killah
Method Man
Wu-Tang Clan
Little Simz
Skepta
J Hus
Aitch
Headie One
Burna Boy
Tory Lanez
Lil Tecca
Baby Keem
Denzel Curry
A Boogie wit da Hoodie
Polo G`,

  't-game': `
Super Mario 64
Super Mario Bros.
The Legend of Zelda: Ocarina of Time
Tears of the Kingdom
Pokémon Gold and Silver
Pac-Man
Street Fighter II
Mortal Kombat
Doom
Half-Life 2
Portal 2
BioShock
Mass Effect 2
Uncharted 2
Metal Gear Solid
Final Fantasy VII
Kingdom Hearts
Resident Evil 4
Silent Hill 2
Dark Souls
Bloodborne
Sekiro
Ghost of Tsushima
Horizon Zero Dawn
Assassin's Creed II
Batman: Arkham City
Grand Theft Auto: San Andreas
Grand Theft Auto: Vice City
Fallout: New Vegas
Baldur's Gate 3
Cyberpunk 2077
Stardew Valley
Terraria
Celeste
Hades
Undertale
Cuphead
Fall Guys
Genshin Impact
Counter-Strike 2
Dota 2
World of Warcraft
StarCraft
Diablo II
The Sims
SimCity
Guitar Hero
Just Dance
FIFA 12
Pro Evolution Soccer 6
Tony Hawk's Pro Skater 2
Crash Bandicoot
Spyro the Dragon
Sonic the Hedgehog 2
Kirby's Return to Dream Land
Splatoon 3
Monster Hunter: World
It Takes Two`,

  't-app': `
Facebook
Messenger
Telegram
Signal
LinkedIn
Tumblr
Twitch Mobile
Kick
Zoom
Microsoft Teams
Slack
Gmail
Google Drive
Google Photos
Google Docs
Chrome
Safari
Apple Wallet
Apple Pay
PayPal
Venmo
Cash App
Revolut
Klarna
Shopify
Etsy
eBay
Temu
Shein
Vinted
Depop
StockX
Skip the Dishes
Instacart
Lyft
Waze
Citymapper
Strava
MyFitnessPal
Calm
Headspace
Notion
ChatGPT
Claude
CapCut
Canva
Lightroom
VSCO
Tinder
Hinge
Uber One
Audible
Kindle
Wattpad
Muslim Pro
Weather
Camera
Clock
Find My
Pokémon GO
Candy Crush
Subway Surfers
Brawl Stars
Clash Royale`,

  't-toon': `
Teenage Mutant Ninja Turtles
Transformers
He-Man
ThunderCats
X-Men: The Animated Series
Batman: The Animated Series
Spider-Man: The Animated Series
Animaniacs
Pinky and the Brain
Rocko's Modern Life
CatDog
The Wild Thornberrys
Doug
Rugrats in Paris
Danny Phantom
Invader Zim
Samurai Jack
Justice League
Static Shock
Sonic X
Beyblade
Digimon
Sailor Moon
Bakugan
Totally Spies!
Martin Mystery
Code Lyoko
The Magic School Bus
Franklin
Caillou
Dora the Explorer
Blue's Clues
Bob the Builder
Thomas & Friends
Peppa Pig
Bluey
PAW Patrol
The Loud House
Gravity Falls
Star vs. the Forces of Evil
Steven Universe
Chowder
The Marvelous Misadventures of Flapjack
Camp Lazlo
Foster's Home for Imaginary Friends`,

  't-anim': `
Inside Out 2
Toy Story 3
Toy Story 2
Finding Dory
Monsters University
Coco
Soul
Luca
Turning Red
Elemental
Onward
Brave
A Bug's Life
Wreck-It Ralph
Bolt
The Princess and the Frog
Beauty and the Beast
The Little Mermaid
Mulan
Hercules
Tarzan
Lilo & Stitch
Pocahontas
Bambi
Dumbo
Pinocchio
Snow White and the Seven Dwarfs
Cinderella
The Jungle Book
101 Dalmatians
Howl's Moving Castle
Princess Mononoke
My Neighbor Totoro
Ponyo
Kiki's Delivery Service
The Boy and the Heron
Akira
Coraline
The Nightmare Before Christmas
Corpse Bride
Fantastic Mr. Fox
Wallace & Gromit: The Curse of the Were-Rabbit
Chicken Run
Rio
Hotel Transylvania
The Mitchells vs. the Machines
Across the Spider-Verse
The Super Mario Bros. Movie
Minions
The Wild Robot
Flow
KPop Demon Hunters`,

  't-singers': `
Janet Jackson
Madonna
Tina Turner
Diana Ross
Lionel Richie
Marvin Gaye
Sam Cooke
Ray Charles
Otis Redding
Etta James
Nina Simone
Elton John
David Bowie
George Michael
Phil Collins
Sting
Jon Bon Jovi
Bruce Springsteen
Bob Dylan
Johnny Cash
Dolly Parton
Garth Brooks
Morgan Wallen
Chris Stapleton
Luke Combs
Zach Bryan
Post Malone
Chappell Roan
Doja Cat
Tate McRae
Charli XCX
Raye
Hozier
Lewis Capaldi
Sam Smith
Calvin Harris
Rauw Alejandro
Karol G
J Balvin
Daddy Yankee
Enrique Iglesias
Ricky Martin
Marc Anthony
Rosalía
Burna Boy
Wizkid
Tems
Rema
Arijit Singh
A. R. Rahman
Atif Aslam
Nusrat Fateh Ali Khan
Kadim Al Sahir
Nancy Ajram
Elissa
Rashed Al-Majed
Mohammed Assaf
Tamer Hosny
Majid Al Mohandis`,

  't-bands': `
The Who
The Doors
The Eagles
Aerosmith
Kiss
Van Halen
Def Leppard
Iron Maiden
Black Sabbath
The Clash
Sex Pistols
The Police
Dire Straits
Journey
Toto
Earth, Wind & Fire
The Jackson 5
New Edition
Boyz II Men
TLC
NSYNC
Take That
Westlife
Little Mix
Fifth Harmony
Jonas Brothers
5 Seconds of Summer
The 1975
Tame Impala
Muse
Blur
The Strokes
Kings of Leon
OneRepublic
The Chainsmokers
Stray Kids
Seventeen
TWICE
NewJeans
EXO
Big Bang
Måneskin`,

  't-actors': `
Harrison Ford
Arnold Schwarzenegger
Sylvester Stallone
Bruce Willis
Mel Gibson
Russell Crowe
Liam Neeson
George Clooney
Jamie Foxx
Jake Gyllenhaal
Benedict Cumberbatch
Tom Hardy
Michael Fassbender
Daniel Craig
Pierce Brosnan
Sean Connery
Clint Eastwood
Jack Nicholson
Marlon Brando
Paul Newman
James Dean
Humphrey Bogart
Charlie Chaplin
Daniel Day-Lewis
Gary Oldman
Mark Wahlberg
Jonah Hill
Seth Rogen
Steve Carell
Will Ferrell
Ben Stiller
Owen Wilson
Paul Rudd
Chris Pratt
Mark Ruffalo
Jeremy Renner
Andrew Garfield
Tobey Maguire
Austin Butler
Jacob Elordi
Glen Powell
Barry Keoghan
Paul Mescal
Dev Patel
Mahershala Ali
Daniel Kaluuya
Chadwick Boseman
Sidney Poitier
Forest Whitaker
Oscar Isaac
Javier Bardem
Antonio Banderas
Salman Khan
Aamir Khan
Amitabh Bachchan
Hrithik Roshan
Ranveer Singh`,

  't-actresses': `
Jessica Chastain
Amy Adams
Rachel McAdams
Reese Witherspoon
Jennifer Lopez
Cameron Diaz
Drew Barrymore
Gwyneth Paltrow
Kate Hudson
Emma Thompson
Helen Mirren
Judi Dench
Maggie Smith
Kristen Stewart
Dakota Johnson
Elle Fanning
Dakota Fanning
Hailee Steinfeld
Rachel Zegler
Brie Larson
Elizabeth Olsen
Tessa Thompson
Regina King
Octavia Spencer
Taraji P. Henson
Gabrielle Union
Zoë Kravitz
Rebecca Ferguson
Vanessa Kirby
Lily James
Daisy Ridley
Ana de Armas
Penélope Cruz
Salma Hayek
Sofía Vergara
Eva Mendes
Grace Kelly
Elizabeth Taylor
Ingrid Bergman
Sophia Loren
Ayo Edebiri
Jodie Comer
Mia Goth
Aishwarya Rai
Alia Bhatt
Kareena Kapoor
Katrina Kaif`,

  't-franchise': `
The Avengers
Spider-Man
Batman
Superman
The Twilight Saga
The Maze Runner
Divergent
Men in Black
Ghostbusters
Jaws
Predator
Die Hard
Lethal Weapon
Rambo
Mad Max
Creed
Karate Kid
Godzilla
King Kong
The Mummy
Night at the Museum
Home Alone
Paddington
Madagascar
How to Train Your Dragon
Frozen
Cars
Minions
The Lego Movie
Hotel Transylvania
Spider-Verse
Bad Boys
Rush Hour
Ocean's
Kingsman
Now You See Me
Scream
Halloween
Saw
Final Destination
The Purge
Insidious`,

  't-tvshows': `
Friends
The Office
Grey's Anatomy
Prison Break
24
Heroes
Supernatural
The Vampire Diaries
Gossip Girl
The O.C.
Riverdale
Outer Banks
The Umbrella Academy
Lucifer
Vikings
The Witcher
Rings of Power
Fallout
Reacher
Jack Ryan
The Night Agent
Bridgerton
Emily in Paris
Ginny & Georgia
Never Have I Ever
Sex Education
Top Boy
Line of Duty
Doctor Who
Downton Abbey
Mad Men
The X-Files
Twin Peaks
Westworld
True Detective
Fargo
Mindhunter
Chernobyl
Band of Brothers
The Pacific
Boardwalk Empire
Daredevil
Loki
WandaVision
Andor
Invincible
Blue Eye Samurai
Adolescence
The White Lotus
The Penguin`,

  't-sitcoms': `
I Love Lucy
The Golden Girls
Full House
Fresh Off the Boat
Black-ish
Everybody Hates Chris
Martin
Living Single
My Wife and Kids
The Bernie Mac Show
George Lopez
Kenan & Kel
iCarly
Drake & Josh
Hannah Montana
The Suite Life of Zack & Cody
That's So Raven
Wizards of Waverly Place
Lizzie McGuire
Boy Meets World
Saved by the Bell
Family Matters
Silicon Valley
Veep
30 Rock
Superstore
The Good Place
What We Do in the Shadows
Peep Show
Derry Girls
Ghosts
Rick and Morty
South Park
Bob's Burgers
King of the Hill
Futurama
American Dad!`,

  't-anime': `
Dragon Ball
Dragon Ball Super
Naruto Shippuden
Boruto
Fairy Tail
Fire Force
Soul Eater
Hellsing
Trigun
Akame ga Kill!
Parasyte
Erased
Your Lie in April
Toradora!
Kaguya-sama: Love Is War
Horimiya
Fruits Basket
Ouran High School Host Club
Clannad
Violet Evergarden
Made in Abyss
Dororo
The Promised Neverland
Re:Zero
That Time I Got Reincarnated as a Slime
Overlord
Konosuba
No Game No Life
Kill la Kill
Gurren Lagann
Mobile Suit Gundam
Ghost in the Shell
Samurai Champloo
Berserk
Inuyasha
Yu Yu Hakusho
Slam Dunk
Kuroko's Basketball
Hajime no Ippo
Captain Tsubasa
Initial D
Beyblade
Cyberpunk: Edgerunners
Dandadan
Kaiju No. 8
Oshi no Ko
Sakamoto Days
The Apothecary Diaries`,

  't-animechars': `
Gohan
Piccolo
Frieza
Cell
Majin Buu
Trunks
Hinata Hyuga
Sakura Haruno
Gaara
Jiraiya
Madara Uchiha
Minato Namikaze
Pain
Sanji
Nami
Boa Hancock
Trafalgar Law
Portgas D. Ace
Shanks
Whitebeard
Armin Arlert
Reiner Braun
Megumi Fushiguro
Nobara Kugisaki
Inosuke Hashibira
Zenitsu Agatsuma
Rengoku
Muzan Kibutsuji
Aizen
Byakuya Kuchiki
Hisoka
Kurapika
Meruem
Genos
Alphonse Elric
Roy Mustang
Shoto Todoroki
Katsuki Bakugo
Power
Makima
Reigen Arataka
Mob
Thorfinn
Okabe Rintarou
Yor Forger
Loid Forger
Rimuru Tempest
Vash the Stampede
Guts
Inuyasha||||Inuyasha (character)`,

  't-heroes': `
Robin
Nightwing
Batgirl
Supergirl
Martian Manhunter
Blue Beetle
Captain Atom
Hawkman
Black Canary
Booster Gold
Plastic Man
Swamp Thing
Spawn
Hellboy
Miles Morales
Spider-Gwen
Venom||||Venom (character)
Punisher
Ghost Rider
Blade
Cyclops
Jean Grey
Rogue
Gambit
Beast
Iceman
Nightcrawler
Colossus
Shang-Chi
Captain Britain
She-Hulk
War Machine
Falcon
Winter Soldier
Nick Fury
Black Bolt
Mister Fantastic
Invisible Woman
Human Torch
The Thing
Nova
Iron Fist
Luke Cage
Jessica Jones
Omni-Man
Squirrel Girl`,

  't-villains': `
Sinestro
Black Adam
Reverse-Flash
Zod
Doomsday
Ra's al Ghul
Mr. Freeze
Hush
Black Manta
Cheetah
Sandman
Electro
Vulture
Rhino
Kraven the Hunter
Carnage
Juggernaut
Sabretooth
Mister Sinister
Dormammu
Baron Zemo
Abomination
M.O.D.O.K.
Taskmaster
Bullseye
Ronan the Accuser
Ego
Annihilus
Gorr the God Butcher
Knull
Bizarro
Mongul
Amanda Waller`,

  't-pixar': `
Hamm
Slinky Dog
Mr. Potato Head
Bo Peep
Lotso
Forky
Ken
Aliens||||Aliens (Toy Story)
Sally Carrera
Doc Hudson
Luigi
Guido
Marlin
Crush
Bruce
Gill
Randall
Roz
Celia
Syndrome
Violet Parr
Jack-Jack
Linguini
Colette
Anton Ego
Kevin
Disgust
Fear
Ennui
Envy
Embarrassment
Riley
Joe Gardner
22
Alberto
Giulia
Dante
Mama Imelda
Abuelita
Wade Ripple
Ian Lightfoot
Barley Lightfoot
Flik
Hopper
Heimlich
Dot
Queen Elinor`,

  't-disney': `
Pluto
Daisy Duck
Chip 'n' Dale
Scrooge McDuck
Mufasa
Nala
Rafiki
Zazu
Kristoff
Sven
Hans
Pua
Heihei
Te Kā
Sebastian
Flounder
Prince Eric
Beast
Gaston
Lumière
Cogsworth
Iago
Abu
Mushu
Shan Yu
Flynn Rider
Pascal
Mother Gothel
Prince Naveen
Dr. Facilier
Ray||||Ray (The Princess and the Frog)
Meg
Hades
Pegasus
Tinker Bell
Peter Pan
Cruella de Vil
Bambi
Thumper
Dumbo
Pinocchio
Jiminy Cricket
Bruno Madrigal
Isabela Madrigal
Wreck-It Ralph||||Wreck-It Ralph (character)
Vanellope von Schweetz
Baymax
Hiro Hamada
Raya
Sisu
Asha`,

  't-streaming': `
Prime Video
BritBox
BBC iPlayer
ITVX
Channel 4
Sky Go
Now TV
Canal+
Mubi
Criterion Channel
Shudder
AMC+
Starz
Showtime
BET+
Discovery+
Fubo
Sling TV
YouTube TV
Pluto TV
Roku Channel
Plex
Funimation
HIDIVE
JioHotstar
Netflix Games
Amazon Luna
Xbox Cloud Gaming
PlayStation Plus
Apple Arcade
Audible
Pandora
iHeartRadio
Boomplay
NetEase Cloud Music
Starzplay
TOD
Weyyak`,

  't-youtubers': `
Sidemen
Chunkz
Yung Filly
Harry Pinero
Niko Omilana
Sharky
Calfreezy
JiDion
Unspeakable
Preston
Linus Tech Tips
Unbox Therapy
Veritasium
Vsauce
Kurzgesagt
CGP Grey
Tom Scott
Smarter Every Day
Mrwhosetheboss
Captain Sparklez
DanTDM
Stampy
SSSniperWolf
Lele Pons
Liza Koshy
David Dobrik
Zach King
Brent Rivera
Alan Becker
Jacksfilms
Drew Gooden
Danny Gonzalez
Kurtis Conner
Cody Ko
Noel Miller
Good Mythical Morning
Hot Ones
Joe Weller
Deji
ChrisMD
Theo Baker
Max Fosh
WillNE
Mike Majlak
Typical Gamer
Faze Rug
Yes Theory
Michelle Khare
Safiya Nygaard
Philip DeFranco
Kallmekris
Sorted Food`,

  't-streamers': `
Sketch
Cinna
Emiru
QTCinderella
Amouranth
Myth
Tfue
Clix
Bugha
Mongraal
Benjyfishy
Aceu
TenZ
Tarik
Gaules
Rubius
TheGrefg
AuronPlay
Kameto
Squeezie
Zackrawrr
Moistcr1tikal
Pokelawls
Nmplol
Erobb221
Agent 00
Plaqueboymax
Lacy
Stableronaldo
Marlon
Silky
Jasontheween
Sommerset
Tubbo
Ranboo
Wilbur Soot
Quackity
Philza
GeorgeNotFound
Sapnap
BadBoyHalo`,

  't-consoles': `
Nintendo Virtual Boy
Neo Geo
TurboGrafx-16
Sega Saturn
Sega Master System
Sega Game Gear
Atari Lynx
Atari Jaguar
ColecoVision
Intellivision
Magnavox Odyssey
3DO
Game Boy Color
Game Boy Pocket
Nintendo DSi
New Nintendo 3DS
Nintendo 2DS
Game & Watch
PlayStation 3
PlayStation 5 Pro
PlayStation 4 Pro
PS One
Xbox One X
Xbox Series S
Nintendo Switch Lite
Nintendo Switch OLED
Sega CD
Sega 32X
N-Gage
Ouya
Google Stadia
Oculus Quest 2
Apple Vision Pro
ROG Ally
Analogue Pocket
Evercade
SNES Classic`,

  't-gamechars': `
Wario
Waluigi
Daisy
Toad
Rosalina
Diddy Kong
King K. Rool
Ganondorf
Sheik
Fox McCloud
Falco Lombardi
Captain Falcon
Ness
Marth
Ike
Sephiroth
Tifa Lockhart
Aerith Gainsborough
Lightning
Noctis Lucis Caelum
Sora
Riku
Tails
Knuckles
Shadow the Hedgehog
Amy Rose
Dr. Eggman
Ratchet
Sly Cooper
Marcus Fenix
Gordon Freeman
Alyx Vance
GLaDOS
Chell
Commander Shepard
Isaac Clarke
Max Payne
Niko Bellic
Tommy Vercetti
John Marston
Jill Valentine
Chris Redfield
Claire Redfield
Ada Wong
Big Boss
Raiden
Dante
Bayonetta
Sub-Zero
Liu Kang
Chun-Li
Ken Masters
Jin Kazama
Kazuya Mishima
Sackboy
Rayman
Ori
The Knight
Madeline
Shovel Knight
Isabelle
Tom Nook
Inkling`,

  't-pokemon': `
Raichu
Pichu
Charmeleon
Ivysaur
Wartortle
Butterfree
Pidgeot
Arcanine
Ninetales
Vulpix
Growlithe
Poliwrath
Golem
Onix
Steelix
Scyther
Scizor
Jolteon
Flareon
Vaporeon
Espeon
Leafeon
Glaceon
Aerodactyl
Kabutops
Togepi
Togekiss
Marill
Ampharos
Heracross
Houndoom
Celebi
Ho-Oh
Entei
Suicune
Raikou
Sceptile
Swampert
Salamence
Metagross
Latias
Latios
Kyogre
Groudon
Jirachi
Infernape
Torterra
Empoleon
Darkrai
Dialga
Palkia
Giratina
Zoroark
Hydreigon
Volcarona
Reshiram
Zekrom
Aegislash
Rowlet
Decidueye
Incineroar
Lycanroc
Toxapex
Corviknight
Cinderace
Zacian
Zamazenta
Sprigatito
Koraidon
Miraidon`,

  't-horror': `
Carrie
The Omen
Poltergeist
The Evil Dead
Evil Dead II
An American Werewolf in London
Candyman
The Silence of the Lambs
Se7en
The Others
The Sixth Sense
Final Destination
The Grudge
Dawn of the Dead
Shaun of the Dead
The Descent
REC
Let the Right One In
The Orphanage
The Witch
It Follows
Don't Breathe
Split
Nope
Pearl
X
Longlegs
Terrifier
Weapons
Nosferatu
The Substance
Late Night with the Devil
The Conjuring 2`,

  't-scifi': `
Star Trek
Return of the Jedi
Rogue One
The Fifth Element
Total Recall
RoboCop
Predator
The Abyss
Contact
Gattaca
The Truman Show
Children of Men
Looper
Moon
Her
Elysium
Pacific Rim
Oblivion
Prometheus
Alien: Romulus
Annihilation
Ad Astra
Tron: Legacy
War of the Worlds
I, Robot
Cloverfield
Super 8
Source Code
Snowpiercer
Mad Max: Fury Road
The Day the Earth Stood Still
Planet of the Apes
Dawn of the Planet of the Apes
Godzilla Minus One
The Creator
Mickey 17`,
};
