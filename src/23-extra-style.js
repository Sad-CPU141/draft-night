/* Extra items for big groups — Style & Rides. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_STYLE = {
  't-car': `
Ford Mustang GT|Daily
Volkswagen Polo|Daily
Toyota GR Yaris|Daily
Lexus RX|SUV
Kia Telluride|SUV
Chevrolet Corvette Sting Ray '63|Classic
Mercedes-AMG One|Supercar
BMW M5|Daily
Ferrari SF90 Stradale|Supercar
Lamborghini Huracán|Supercar
McLaren 720S|Supercar
Audi R8|Supercar
Nissan GT-R|Supercar
Chevrolet Corvette C8|Supercar
Mercedes-AMG GT|Supercar
Aston Martin Vantage|Supercar
Pagani Huayra|Supercar
Rimac Nevera|Supercar
Ferrari 296 GTB|Supercar
Toyota Camry|Daily
Honda Accord|Daily
Mazda3|Daily
Kia K5|Daily
Volkswagen Jetta|Daily
Hyundai Sonata|Daily
Audi A4|Daily
Mercedes-Benz C-Class|Daily
BMW 3 Series|Daily
Toyota Prius|Daily
Subaru WRX|Daily
Lexus IS|Daily
Nissan Patrol|SUV
Lexus LX|SUV
Porsche Cayenne|SUV
BMW X5|SUV
Cadillac Escalade|SUV
Ford Bronco|SUV
Land Rover Defender|SUV
Toyota RAV4|SUV
Audi Q8|SUV
Chevrolet Tahoe|SUV
Jaguar E-Type|Classic
Aston Martin DB5|Classic
Volkswagen Beetle|Classic
Shelby Cobra|Classic
Lamborghini Miura|Classic
DeLorean DMC-12|Classic
Dodge Charger '69|Classic
Porsche 356|Classic
Ferrari 250 GTO|Classic
Mini Cooper (classic)|Classic
`,
  't-shoe': `
Air Max 95
Air Max 1
Air Max 270
Nike Air Huarache
Nike Air Presto
Nike Vapormax
Nike SB Dunk
Nike Air Foamposite
Air Jordan 6
Air Jordan 12
Yeezy Boost 350
Adidas Stan Smith
Adidas Forum
Adidas Campus
Adidas Spezial
Adidas NMD
Adidas Handball Spezial
New Balance 2002R
New Balance 9060
New Balance 530
New Balance 574
Asics Gel-Lyte III
Asics Gel-1130
Hoka Clifton
Salomon Speedcross
Onitsuka Tiger Mexico 66
Vans Sk8-Hi
Vans Slip-On
Converse Run Star Hike
Puma Palermo
Reebok Classic Leather
Saucony Shadow 6000
Common Projects Achilles
Golden Goose Superstar
Balenciaga Triple S
Alexander McQueen Oversized Sneaker
Dr. Martens 1460
Clarks Wallabee
`,
  't-luxcars': `
Rolls-Royce Wraith
Rolls-Royce Dawn
Bentley Flying Spur
Bentley Mulsanne
Mercedes-Maybach GLS
Mercedes-Benz EQS
Mercedes-AMG S 63
BMW i7
BMW XM
BMW M8
Audi RS7
Audi RS e-tron GT
Porsche Taycan
Porsche Cayenne
Lexus LX
Lexus LC
Aston Martin DBX
Aston Martin DBS
Ferrari Roma
Ferrari 12Cilindri
Lamborghini Revuelto
McLaren GT
Maserati Levante
Maserati GranTurismo
Cadillac Celestiq
Cadillac CT5-V Blackwing
Lincoln Continental
Genesis GV80
Lucid Gravity
Tesla Model S Plaid
Range Rover Sport
Land Rover Defender 130
Jaguar XJ
Volvo XC90 Recharge
Infiniti QX80
Bentley Batur
Rolls-Royce Boat Tail
Mercedes-Maybach SL
Polestar 1
`,
  't-supercars': `
Ferrari 488 GTB
Ferrari 458 Italia
Ferrari 12Cilindri
Ferrari Roma
Ferrari Daytona SP3
Lamborghini Gallardo
Lamborghini Murciélago
Lamborghini Diablo
Lamborghini Temerario
McLaren 765LT
McLaren 570S
McLaren 650S
McLaren MP4-12C
McLaren W1
Porsche 911 Turbo S
Porsche Carrera GT
Porsche 959
Mercedes-Benz SLS AMG
Mercedes-McLaren SLR
Aston Martin DBS
Aston Martin Valhalla
Bentley Continental GT Speed
Chevrolet Corvette Z06
Chevrolet Corvette ZR1
Dodge Viper ACR
Ford GT40
Jaguar XJ220
Lotus Emira
Lotus Exige
Maserati MC12
Noble M600
Saleen S7
Honda NSX (first generation)
BMW M1
BMW i8
Audi R8 V10 Performance
De Tomaso Pantera
Ferrari Testarossa
Lamborghini Countach LPI 800-4
`,
  't-hypercars': `
Bugatti Mistral
Bugatti Centodieci
Bugatti La Voiture Noire
Bugatti EB110
Koenigsegg One:1
Koenigsegg CCX
Koenigsegg Gemera
Koenigsegg CC850
Pagani Huayra R
Pagani Zonda R
Pagani Imola
McLaren Elva
McLaren Sabre
McLaren W1
McLaren F1
Ferrari Enzo
Ferrari FXX-K
Ferrari Monza SP2
Porsche Carrera GT
Mercedes-Benz CLK GTR
Aston Martin Valhalla
Aston Martin One-77
Aston Martin Vulcan
Lamborghini Veneno
Lamborghini Centenario
Lamborghini Sesto Elemento
Lamborghini Countach LPI 800-4
Rimac Concept One
Pininfarina Battista
Czinger 21C
Hennessey Venom GT
Jaguar XJ220
Maserati MC12
Saleen S7
W Motors Lykan HyperSport
Zenvo TSR-S
Apollo IE
De Tomaso P72
Ferrari Daytona SP3
`,
  't-jdm': `
Nissan Skyline GT-R R32
Nissan Skyline GT-R R33
Nissan Silvia S13
Nissan 180SX
Nissan 370Z
Nissan Z (RZ34)
Toyota Supra (A90)
Toyota Chaser
Toyota Mark II
Toyota Crown
Toyota Soarer
Toyota Celica
Toyota Starlet
Honda Civic EG
Honda Civic EK9
Honda Prelude
Honda CR-X
Honda Beat
Acura Integra
Mazda RX-3
Mazda Cosmo
Mazda Savanna RX-7 (FC)
Mazda Autozam AZ-1
Mitsubishi Eclipse
Mitsubishi Pajero
Mitsubishi FTO
Subaru BRZ
Subaru Legacy
Subaru Forester STI
Suzuki Cappuccino
Suzuki Swift Sport
Daihatsu Copen
Nissan Stagea
Nissan Cefiro
Nissan Laurel
Lexus IS 300
Toyota Century
Toyota Hiace
Nissan Patrol Y61
`,
  't-classics': `
Chevrolet Chevelle SS
Ford Thunderbird
Ford Mustang Boss 429
Buick Riviera
Oldsmobile 442
Plymouth Road Runner
Dodge Challenger (1970)
AMC Javelin
Chevrolet Impala (1964)
Lincoln Continental (1961)
Cadillac Series 62
Jaguar XK120
Austin-Healey 3000
MG MGB
Triumph TR6
Lotus Elan
Lotus Seven
Porsche 911 (1964)
Porsche 550 Spyder
Mercedes-Benz W113
Mercedes-Benz 190 SL
BMW 507
BMW E30 M3
Alfa Romeo Spider
Alfa Romeo Giulia GT
Lancia Stratos
Lancia Delta Integrale
Ferrari 275
Ferrari Daytona
Ferrari Dino
Maserati Ghibli (1967)
Lamborghini 350 GT
Rolls-Royce Silver Ghost
Bentley Blower
Bugatti Type 57
Toyota Land Cruiser FJ40
Ford Bronco (1966)
Chevrolet Nomad
`,
  't-evs': `
Tesla Roadster
Tesla Semi
Lucid Gravity
Rivian R2
Porsche Macan Electric
Audi Q8 e-tron
Audi Q4 e-tron
BMW i7
BMW iX3
Mercedes-Benz EQE
Mercedes-Benz G 580 EQ
Mercedes-AMG EQS
Hyundai Ioniq 5 N
Kia EV3
Kia Niro EV
Genesis GV60
Genesis Electrified G80
Volkswagen ID. Buzz
Volkswagen ID.3
Cadillac Lyriq
Cadillac Escalade IQ
Chevrolet Silverado EV
Chevrolet Equinox EV
Chevrolet Blazer EV
GMC Hummer EV
Ford Puma Gen-E
Polestar 3
Polestar 4
Volvo EX30
Volvo EX90
Nissan Ariya
Toyota bZ4X
Subaru Solterra
Lotus Eletre
BYD Dolphin
BYD Atto 3
BYD Han
NIO ET7
Zeekr 001
`,
  't-suvs': `
Mercedes-Benz GLS
Mercedes-Benz GLE
BMW X7
BMW X6
BMW X3
Audi Q8
Audi Q5
Porsche Macan
Lexus RX
Lexus GX
Toyota Highlander
Toyota Sequoia
Toyota Fortuner
Toyota Prado
Nissan Pathfinder
Nissan X-Trail
Honda Pilot
Hyundai Santa Fe
Hyundai Tucson
Kia Sorento
Kia Sportage
Mazda CX-5
Mazda CX-90
Subaru Outback
Subaru Forester
Volkswagen Tiguan
Volkswagen Touareg
Chevrolet Suburban
Ford Expedition
Lincoln Navigator
Jeep Grand Wagoneer
Range Rover Sport
Range Rover Velar
Aston Martin DBX
Maserati Levante
Ferrari Purosangue
Infiniti QX80
Genesis GV80
Suzuki Jimny
`,
  't-pickups': `
Ram 2500
Ram 3500
Chevrolet Silverado HD
GMC Sierra HD
Nissan Titan
Ford Ranger Raptor
Chevrolet Colorado ZR2
Toyota Tacoma TRD Pro
Ram 1500 Rebel
Chevrolet Silverado EV
Nissan Navara
Mazda BT-50
Mercedes-Benz X-Class
Kia Tasman
Ineos Quartermaster
Chevrolet Avalanche
Cadillac Escalade EXT
Hummer H2 SUT
Lincoln Mark LT
Ford Lobo
Dodge Dakota
Toyota T100
Chevrolet S-10
Jeep Comanche
Subaru BRAT
Chevrolet El Camino
Ford Ranchero
Ford F-100
Chevrolet C/K
Dodge Ram SRT-10
Ford SVT Lightning
GMC Syclone
Holden Ute
Ford Falcon Ute
Toyota Land Cruiser 70 pickup
Toyota Stout
Nissan Hardbody
Datsun 620
Great Wall Poer
`,
  't-motorbikes': `
Kawasaki Ninja ZX-10R
Kawasaki Ninja 400
Kawasaki Z1
Yamaha YZF-R6
Yamaha YZF-R7
Yamaha XSR900
Yamaha VMAX
Yamaha Ténéré 700
Honda Grom
Honda Rebel 500
Honda CBR600RR
Honda Super Cub
Suzuki GSX-S1000
Suzuki SV650
Suzuki V-Strom
Ducati Diavel
Ducati Multistrada
Ducati Streetfighter V4
Ducati SuperSport
BMW R nineT
BMW M 1000 RR
BMW K 1600
Triumph Rocket 3
Triumph Street Triple
Triumph Tiger 900
KTM 390 Duke
KTM RC 390
KTM 1290 Super Adventure
Harley-Davidson Road Glide
Harley-Davidson Street Glide
Harley-Davidson Iron 883
Harley-Davidson LiveWire
Indian Chief
Indian FTR
Royal Enfield Interceptor 650
Royal Enfield Himalayan
Aprilia Tuono V4
MV Agusta Brutale
Moto Guzzi V7
`,
  't-carbrands': `
Alfa Romeo
Acura
Infiniti
Lincoln
Buick
GMC
Chrysler
Ram
Mitsubishi
Suzuki
Peugeot
Renault
Citroën
Fiat
Lancia
Abarth
Skoda
SEAT
Cupra
Opel
Vauxhall
Mini
Smart
Alpine
Lotus
Pagani
Rimac
Lucid
Polestar
Dacia
Saab
Holden
Pontiac
Hummer
Isuzu
Daihatsu
Geely
Chery
Haval
Nio
Xpeng
Zeekr
Tata Motors
Mahindra
Proton
Ceer
`,
  't-luxbrands': `
Acne Studios
Bulgari
Cartier
Tiffany & Co.
Van Cleef & Arpels
Jacquemus
Marni
Maison Margiela
Rick Owens
Amiri
Jil Sander
Lanvin
Kenzo
Moschino
Max Mara
Salvatore Ferragamo
Etro
Zegna
Brioni
Kiton
Berluti
Christian Louboutin
Jimmy Choo
Manolo Blahnik
Golden Goose
Stella McCartney
Chloé
Alaïa
Vivienne Westwood
Paul Smith
Dsquared2
Philipp Plein
Mulberry
Goyard
Hugo Boss
`,
  't-streetwear': `
Off-White
Fear of God Essentials
A-Cold-Wall*
Anti Social Social Club
Undefeated
Huf
Obey
Diamond Supply Co.
Mastermind Japan
Neighborhood
WTAPS
Human Made
Sacai
Comme des Garçons Play
Y-3
Yeezy
Cactus Jack
Broken Planet
Sp5der
Eric Emanuel
Kapital
Aape
Noah
Awake NY
Pleasures
Brain Dead
Martine Rose
Daily Paper
Ader Error
Arc'teryx
Salomon
Dickies
Levi's
Converse
Reebok
Ralph Lauren Polo
Tommy Hilfiger
`,
  't-watches': `
Blancpain
Ulysse Nardin
Girard-Perregaux
Piaget
Franck Muller
Jacob & Co.
Roger Dubuis
F.P. Journe
H. Moser & Cie
MB&F
Greubel Forsey
Parmigiani Fleurier
Bell & Ross
Oris
Rado
Montblanc
Baume & Mercier
Frederique Constant
Nomos Glashütte
Glashütte Original
Sinn
Junghans
Orient
Casio
Timex
Fossil
Daniel Wellington
MVMT
Movado
Victorinox
Bulova
Raymond Weil
Maurice Lacroix
Christopher Ward
Samsung Galaxy Watch
`,
  't-fragrance': `
Dior Homme Intense
Dior Fahrenheit
Chanel Allure Homme Sport
Chanel Coco Mademoiselle
Creed Silver Mountain Water
Creed Green Irish Tweed
Tom Ford Ombré Leather
Tom Ford Lost Cherry
Tom Ford Noir Extreme
YSL La Nuit de L'Homme
YSL Libre
Versace Dylan Blue
Paco Rabanne Invictus
Jean Paul Gaultier Ultra Male
Jean Paul Gaultier Le Beau
Giorgio Armani Stronger With You
Armani Sì
Valentino Uomo Born in Roma Intense
Prada L'Homme
Guerlain L'Homme Idéal
Hermès Terre d'Hermès
Hermès Un Jardin sur le Nil
Montblanc Explorer
Azzaro The Most Wanted
Viktor & Rolf Spicebomb
Dolce & Gabbana Light Blue
Gucci Bloom
Gucci Guilty
Burberry Hero
Mancera Cedrat Boisé
Parfums de Marly Delina
Amouage Interlude Man
Maison Francis Kurkdjian Grand Soir
Ajmal Wisal
Lattafa Asad
Afnan 9PM
Al Haramain Amber Oud
Ard Al Zaafaran Dirham
`,
  't-hairstyles': `
Low Fade
Mid Fade
High Fade
Drop Fade
Temple Fade
Bald Fade
Shadow Fade
Comb Over
Brush Up
Spiky Hair
Messy Fringe
Bowl Cut
Middle Part
Wolf Cut
Shag
Long Layers
Top Knot
Half Up
Slicked Undercut
Hard Part
Crop Fade
Frohawk
Sponge Twists
Freeform Locs
Starter Locs
High Top
Flat Top
Jheri Curl
Finger Coils
Curly Taper
Buzz Fade
Military Cut
Butch Cut
Ducktail
Rockabilly Quiff
`,
  't-bballshoes': `
Air Jordan 6
Air Jordan 7
Air Jordan 8
Air Jordan 9
Air Jordan 10
Air Jordan 14
Air Jordan 23
Air Jordan XX8
Nike Kobe 4
Nike Kobe 8
Nike Hyperdunk
Nike Zoom Kobe 1
Nike Air Max Uptempo
Nike Air Flight 89
Nike Air Force Max
Nike Shox BB4
Nike Zoom GT Cut
Nike G.T. Jump
Nike PG
Nike Giannis Immortality
Nike LeBron 7
Nike Zoom Generation
Nike Air Zoom Flight 95
Nike Air Total Max Uptempo
Adidas Dame
Adidas Trae Young 1
Adidas T-Mac 1
Adidas Kobe 1
Adidas Crazy 1
Reebok Answer
Reebok Pump Omni Lite
Under Armour Curry 1
Puma Clyde
Puma MB.03
Li-Ning Way of Wade
Converse Weapon
And1 Tai Chi
Fila Grant Hill 2
`,
  't-bags': `
Hermès Constance
Hermès Evelyne
Hermès Picotin
Chanel 2.55
Chanel 19
Chanel Deauville Tote
Chanel Gabrielle
Louis Vuitton Alma
Louis Vuitton Pochette Métis
Louis Vuitton Capucines
Louis Vuitton Twist
Louis Vuitton Christopher Backpack
Dior Book Tote
Dior Bobby
Dior Caro
Gucci Dionysus
Gucci Horsebit 1955
Gucci Bamboo 1947
Fendi Peekaboo
Fendi First
Prada Cleo
Prada Re-Nylon Backpack
Bottega Veneta Jodie
Bottega Veneta Andiamo
Celine Luggage
Celine Belt Bag
Loewe Flamenco
Loewe Hammock
Saint Laurent Sac de Jour
Saint Laurent Kate
Balenciaga Hourglass
Balenciaga Le Cagole
Givenchy Pandora
Miu Miu Arcadie
Chloé Paddington
Mulberry Bayswater
Goyard Saigon
Telfar Medium Shopper
Marc Jacobs The Tote Bag
`,
  't-outerwear': `
Shearling Jacket
Aviator Jacket
Car Coat
Chesterfield Coat
Mac Coat
Cape
Poncho
Kimono Jacket
Utility Jacket
Safari Jacket
Overshirt
Coach Jacket
Souvenir Jacket
Down Vest
Barn Jacket
Waxed Jacket
Barbour Jacket
Moncler Puffer
The North Face Nuptse
Arc'teryx Beta
Patagonia Retro-X
Columbia Fleece
Carhartt Detroit Jacket
Levi's Trucker Jacket
Schott Perfecto
Alpha Industries MA-1
Burberry Trench
Stone Island Jacket
Track Top
Zip-up Hoodie
Puffer Vest
Cropped Puffer
Long Puffer Coat
Wool Coat
Camel Coat
Belted Coat
`,
  't-sunglasses': `
Ray-Ban Round
Ray-Ban Justin
Ray-Ban Erika
Ray-Ban Hexagonal
Oakley Sutro
Oakley Flak
Oakley Juliet
Oakley Gascan
Persol 649
Tom Ford Snowdon
Saint Laurent SL 1
Versace Medusa
Dior So Real
Chanel Pilot
Fendi Eyeline
Balenciaga Rim
Prada Symbole
Carrera Champion
Police Sunglasses
Polaroid Sunglasses
Revo
Smith Optics
Bollé
Le Specs
Retrosuperfuture
Garrett Leight
`,
};
