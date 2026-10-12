/* Extra items for big groups — Travel & Places. Format: Name | position | description | emoji | Wikipedia page */
const EXTRA_TRAVEL = {
  't-trav': `
Vancouver|City
Wadi Rum|Nature
Los Angeles|City
Hong Kong|City
Prague|City
Vienna|City
Budapest|City
Florence|City
Venice|City
Madrid|City
Mexico City|City
Buenos Aires|City
Toronto|City
Doha|City
Kuala Lumpur|City
Shanghai|City
Osaka|City
Riyadh|City
Edinburgh|City
Copenhagen|City
Phuket|Beach
Mauritius|Beach
Seychelles|Beach
Mykonos|Beach
Tulum|Beach
Fiji|Beach
Gold Coast|Beach
Algarve|Beach
Amalfi Coast|Beach
Langkawi|Beach
Sharm El Sheikh|Beach
Ibiza|Beach
Bahamas|Beach
Yosemite|Nature
Patagonia|Nature
Serengeti|Nature
Norwegian fjords|Nature
Ha Long Bay|Nature
Lake Como|Nature
Cappadocia|Nature
AlUla|Nature
Scottish Highlands|Nature
New Zealand|Nature
Dolomites|Nature
Yellowstone|Nature
Petra|Nature
Costa Rica|Nature
Lapland|Nature
Galápagos Islands|Nature
`,
  't-ctry': `
Ireland|Europe
Austria|Europe
Belgium|Europe
Sweden|Europe
Norway|Europe
Denmark|Europe
Poland|Europe
Croatia|Europe
Iceland|Europe
Czech Republic|Europe
Bosnia and Herzegovina|Europe
Albania|Europe
Vietnam|Asia
Philippines|Asia
Singapore|Asia
Qatar|Asia
Jordan|Asia
Kuwait|Asia
Oman|Asia
Bangladesh|Asia
Sri Lanka|Asia
Uzbekistan|Asia
Maldives|Asia
Nepal|Asia
Tanzania|Africa
Ethiopia|Africa
Senegal|Africa
Tunisia|Africa
Algeria|Africa
Rwanda|Africa
Uganda|Africa
Cameroon|Africa
Ivory Coast|Africa
Sudan|Africa
Somalia|Africa
Madagascar|Africa
Namibia|Africa
Botswana|Africa
Colombia|Americas
Peru|Americas
Chile|Americas
Cuba|Americas
Uruguay|Americas
Ecuador|Americas
Costa Rica|Americas
Dominican Republic|Americas
Panama|Americas
Venezuela|Americas
Trinidad and Tobago|Americas
`,
  't-capitals': `
Brussels
Bern
Warsaw
Budapest
Helsinki
Reykjavík
Kyiv
Bucharest
Sofia
Belgrade
Zagreb
Sarajevo
Tirana
Valletta
Edinburgh
Kuwait City
Muscat
Manama
Baghdad
Beirut
Damascus
Tehran
Kabul
Tashkent
Astana
Dhaka
Kathmandu
Colombo
Hanoi
Manila
Jakarta
Taipei
Ulaanbaatar
Addis Ababa
Accra
Abuja
Dakar
Tunis
Algiers
Khartoum
Kigali
Pretoria
Bogotá
Santiago
Caracas
Quito
Montevideo
Panama City
`,
  't-landmarks': `
Louvre
Arc de Triomphe
Notre-Dame de Paris
Buckingham Palace
Tower of London
Trevi Fountain
St. Peter's Basilica
Duomo di Milano
Kremlin
Saint Basil's Cathedral
Blue Mosque
Topkapı Palace
Charles Bridge
Cologne Cathedral
Atomium
Little Mermaid statue
Parthenon
Kinkaku-ji
Fushimi Inari-taisha
Tokyo Tower
Tokyo Skytree
Marina Bay Sands
Petronas Towers
Gateway of India
Golden Temple
Badshahi Mosque
Faisal Mosque
Kingdom Centre
Masmak Fortress
Al Wahbah Crater
Abu Simbel
Great Sphinx of Giza
Karnak
Table Mountain
Space Needle
Hollywood Sign
Gateway Arch
Lincoln Memorial
White House
Château Frontenac
Hoover Dam
Teotihuacan
Sugarloaf Mountain
Leshan Giant Buddha
Borobudur
`,
  't-wonders': `
Lake Natron
Mount Kilimanjaro
Amazon River
Yosemite Valley
Komodo Island
Socotra
Wadi Rum
Lake Baikal
Grand Prismatic Spring
Bryce Canyon
Monument Valley
Cliffs of Moher
Fjords of Norway
Milford Sound
Torres del Paine
Perito Moreno Glacier
Okavango Delta
Ngorongoro Crater
Lake Hillier
Waitomo Glowworm Caves
Son Doong Cave
Mammoth Cave
Blue Lagoon
Jiuzhaigou
Guilin
Li River
Danxia Landform
Mount Roraima
Sossusvlei
Great Blue Hole
Kawah Ijen
Dolomites
Eisriesenwelt
Chocolate Hills
Fly Geyser
`,
  't-islands': `
Lanzarote
Gran Canaria
Corfu
Rhodes
Malta
Gozo
Corsica
Skye
Isle of Wight
Aruba
Curaçao
St. Lucia
Antigua
Bermuda
Turks and Caicos
Cuba
Puerto Rico
Tahiti
Moorea
Samoa
Tasmania
Fraser Island
Langkawi
Penang
Boracay
Palawan
Okinawa
Hokkaido
Lombok
Gili Islands
Koh Samui
Koh Phi Phi
Réunion
Cape Verde
Socotra
Bahrain
`,
  't-beaches': `
Clearwater Beach
Siesta Key
Venice Beach
Huntington Beach
Myrtle Beach
Cannon Beach
Manly Beach
Surfers Paradise
Cable Beach
Hyams Beach
Ipanema
Baía do Sancho
Playa del Carmen
Playa Norte
Eagle Beach
Shoal Bay
Trunk Bay
Horseshoe Bay
Seven Mile Beach (Jamaica)
Nissi Beach
Myrtos Beach
Balos Lagoon
La Concha
Praia do Camilo
Nazaré
Porthcurno
Luskentyre
Biarritz
Plage de Palombaggia
Spiaggia dei Conigli
Patong Beach
White Beach Boracay
Nacpan Beach
Kuta Beach
Diani Beach
Nungwi
Clifton Beaches
Lagos Bar Beach
La Mer
Kite Beach
Durrat Al Arus
Half Moon Bay
`,
  't-themeparks': `
Disney's Hollywood Studios
Epcot
Disney's Animal Kingdom
Tokyo DisneySea
Hong Kong Disneyland
Shanghai Disneyland
Walt Disney Studios Park
Universal Studios Singapore
Universal Studios Beijing
SeaWorld Orlando
Knott's Berry Farm
Kings Dominion
Carowinds
Silver Dollar City
Six Flags Great Adventure
Six Flags Over Texas
Kennywood
Holiday World
Blackpool Pleasure Beach
Paultons Park
Legoland Billund
Legoland Windsor
Parc Astérix
Heide Park
Movie Park Germany
Walibi Holland
Energylandia
Fuji-Q Highland
Nagashima Spa Land
Chimelong Ocean Kingdom
Dreamworld
Warner Bros. Movie World
IMG Worlds of Adventure
Motiongate Dubai
Yas Waterworld
Six Flags Qiddiya
Boulevard World
Gröna Lund
`,
  't-europe': `
Valencia
Málaga
Granada
San Sebastián
Bilbao
Nice
Lyon
Marseille
Bordeaux
Strasbourg
Hamburg
Cologne
Frankfurt
Heidelberg
Salzburg
Bratislava
Ljubljana
Zagreb
Split
Belgrade
Sarajevo
Mostar
Sofia
Bucharest
Warsaw
Gdańsk
Tallinn
Riga
Vilnius
Helsinki
Bergen
Gothenburg
Rotterdam
Antwerp
Ghent
Luxembourg
Valletta
Palermo
Verona
Bologna
Turin
Lucerne
Bath
York
Oxford
Cambridge
Glasgow
Belfast
Kotor
`,
  't-asia': `
Yokohama
Nagoya
Hiroshima
Sapporo
Nara
Fukuoka
Incheon
Gyeongju
Guangzhou
Chengdu
Xi'an
Hangzhou
Guilin
Chongqing
Kaohsiung
Tainan
Phuket
Pattaya
Penang
Malacca
Kota Kinabalu
Bali
Yogyakarta
Surabaya
Cebu
Da Nang
Hoi An
Hue
Luang Prabang
Vientiane
Phnom Penh
Yangon
Bagan
Kolkata
Bengaluru
Chennai
Hyderabad
Agra
Varanasi
Goa
Udaipur
Islamabad
Peshawar
Pokhara
Thimphu
Malé
Tashkent
Samarkand
Bukhara
Bishkek
`,
  't-mecities': `
Eskişehir
Al Khobar
Dhahran
Tabuk
Yanbu
Al-Ahsa
Ha'il
Najran
Jazan
Buraidah
Diriyah
NEOM
Ras Al Khaimah
Ajman
Fujairah
Al Ain
Umm Al Quwain
Al Wakrah
Lusail
Sohar
Nizwa
Sur
Muharraq
Aqaba
Irbid
Madaba
Tripoli, Lebanon
Byblos
Sidon
Tyre
Homs
Latakia
Basra
Mosul
Najaf
Karbala
Sulaymaniyah
Mashhad
Tabriz
Yazd
Kashan
Kerman
Izmir
Antalya
Bursa
Konya
Trabzon
Gaziantep
Luxor
Aswan
`,
  't-nacities': `
Portland
Minneapolis
Detroit
St. Louis
Kansas City
Charlotte
Raleigh
Salt Lake City
Pittsburgh
Baltimore
Tampa
Jacksonville
San Antonio
Sacramento
San Jose
Cleveland
Cincinnati
Columbus
Indianapolis
Milwaukee
Memphis
Albuquerque
Tucson
Anchorage
Charleston
Savannah
Santa Fe
Victoria
Hamilton
Kitchener
London, Ontario
Regina
Saskatoon
St. John's
Whistler
Banff
Monterrey
Tijuana
Puebla
Oaxaca
Mérida
Playa del Carmen
Puerto Vallarta
Los Cabos
San Miguel de Allende
Havana
`,
  't-africa': `
Alexandria
Aswan
Hurghada
Giza
Abu Simbel
Rabat
Tangier
Agadir
Sahara Desert
Merzouga
Djerba
Carthage
Ngorongoro Crater
Lake Malawi
Bwindi Impenetrable Forest
Kampala
Dar es Salaam
Mombasa
Lamu
Diani Beach
Garden Route
Stellenbosch
Table Mountain
Robben Island
Windhoek
Etosha National Park
Skeleton Coast
Chobe National Park
Lake Victoria
Gorée Island
Cape Coast
Abuja
Timbuktu
Zanzibar City
Kilwa Kisiwani
Mount Kenya
`,
  't-states': `
Washington, D.C.
Puerto Rico
Guam
United States Virgin Islands
American Samoa
Northern Mariana Islands
`,
  't-canada': `
Thousand Islands|Place
Cabot Trail|Place
Gros Morne National Park|Place
Signal Hill|Place
Lunenburg|Place
Montreal Old Port|Place
Mont-Tremblant|Place
Percé Rock|Place
Hopewell Rocks|Place
Toronto Islands|Place
Prince Edward County|Place
Royal Ontario Museum|Place
Capilano Suspension Bridge|Place
Butchart Gardens|Place
Okanagan Valley|Place
Emerald Lake|Place
Icefields Parkway|Place
Columbia Icefield|Place
Calgary Stampede|Place
Dinosaur Provincial Park|Place
Riding Mountain National Park|Place
Yellowknife|Place
Dawson City|Place
`,
  't-saudicities': `
Jubbah
Al Kharj
Hofuf
Al Mubarraz
Ras Tanura
Al Khafji
Hafar Al-Batin
Arar
Al Qurayyat
Bisha
Al Wajh
Umluj
Duba
Rabigh
Al Lith
Al Qunfudhah
Sharurah
Wadi ad-Dawasir
Al Majma'ah
Shaqra
Az Zulfi
Ar Rass
Dumat al-Jandal
Tayma
Ushaiqer
Farasan Islands
Al Wahbah Crater
Elephant Rock
Rijal Almaa
Al Soudah
Qiddiya
King Abdullah Economic City
Masmak Fortress
Al-Balad
Jeddah Corniche
Riyadh Boulevard
Jabal Sawda
`,
  't-airports': `
Abu Dhabi International
Bahrain International
Muscat International
Kuwait International
King Fahd International
Prince Mohammad bin Abdulaziz International
Cairo International
Queen Alia International
London Gatwick
Manchester Airport
Dublin Airport
Copenhagen Airport
Vienna Airport
Rome Fiumicino
Barcelona–El Prat
Lisbon Airport
Athens International
Oslo Gardermoen
Stockholm Arlanda
Tokyo Narita
Kansai International
Shanghai Pudong
Beijing Capital
Taiwan Taoyuan
Bangkok Suvarnabhumi
Kuala Lumpur International
Indira Gandhi International
Chhatrapati Shivaji Maharaj International
Melbourne Airport
Auckland Airport
San Francisco International
Miami International
Seattle–Tacoma
Calgary International
Mexico City International
São Paulo–Guarulhos
Johannesburg O. R. Tambo
Addis Ababa Bole International
`,
  't-mountains': `
Lhotse
Makalu
Cho Oyu
Dhaulagiri
Manaslu
Nanga Parbat
Ama Dablam
Mount Ararat
Mount Damavand
Mont Blanc du Tacul
Zugspitze
Jungfrau
Grossglockner
Triglav
Monte Rosa
Pico de Orizaba
Popocatépetl
Chimborazo
Huascarán
Fitz Roy
Cerro Torre
Mount Whitney
Mount Hood
Mount Shasta
Pikes Peak
Longs Peak
Mount Washington
Mount Kinabalu
Mount Rinjani
Mount Bromo
Mount Mayon
Jade Mountain
Hallasan
Mount Tai
Huangshan
Mount Hermon
Jebel Shams
`,
  't-deserts': `
Owyhee Desert
Red Desert
Alvord Desert
Ad-Dahna Desert
Great Indian Desert
Dasht-e Lut
Ordos Desert
Badain Jaran Desert
Tengger Desert
Painted Desert
Black Rock Desert
White Sands
Little Sandy Desert
Tanami Desert
Gibson Desert
Strzelecki Desert
Sechura Desert
Monte Desert
Libyan Desert
Nubian Desert
Eastern Desert
Ténéré
Ogaden
Chalbi Desert
Karoo
Bayuda Desert
Dasht-e Margo
Registan Desert
Cholistan Desert
Sinai Desert
Al-Jafurah
Judaean Desert
Accona Desert
Tabernas Desert
Bardenas Reales
Lençóis Maranhenses
`,
  't-natparks': `
Grand Teton
Olympic
Mount Rainier
Denali
Redwood
Death Valley
Canyonlands
Capitol Reef
Shenandoah
Hawaii Volcanoes
Big Bend
Badlands
Kootenay
Yoho
Waterton Lakes
Cape Breton Highlands
Fundy
Algonquin
Peak District
Cairngorms
Swiss National Park
Berchtesgaden
Triglav
Vatnajökull
Thingvellir
Jostedalsbreen
Abel Tasman
Tongariro
Blue Mountains
Daintree
Etosha
Chobe
Hwange
Bwindi
Amboseli
Tsavo
Masai Mara
Iguazú
Los Glaciares
Manu
`,
  't-lakes': `
Lake Maggiore
Lake Constance
Lake Wakatipu
Lake Wanaka
Emerald Lake
Maligne Lake
Lake O'Hara
Abraham Lake
Lake Michigan
Lake Erie
Lake Huron
Great Salt Lake
Lake Placid
Flathead Lake
Lake Chelan
Lake Tanganyika
Lake Nakuru
Lake Retba
Lake Natron
Lake Inle
Lake Toba
Lake Kivu
Pangong Lake
West Lake
Lake Ashi
Lake Sevan
Lake Van
Lake Balaton
Lake Bohinj
Eibsee
Plansee
Lago di Braies
Lake Brienz
Lake Thun
`,
  't-rivers': `
Ob River
Yenisei
Lena River
Amur River
Mackenzie River
Columbia River
Ohio River
Snake River
Arkansas River
Paraná River
Orinoco
São Francisco River
Magdalena River
Brahmaputra
Irrawaddy
Chao Phraya
Pearl River
Han River
Sumida River
Limpopo River
Orange River
Okavango River
Senegal River
Loire
Rhône
Po
Elbe
Oder
Vistula
Dnieper
Ebro
Tagus
Guadalquivir
Moselle
River Severn
River Clyde
Arno
Kura River
`,
  't-ski': `
Saas-Fee
Davos
Laax
Engelberg
Crans-Montana
Andermatt
Tignes
Les Arcs
La Plagne
Avoriaz
Les Deux Alpes
Alpe d'Huez
Megève
Sölden
Saalbach
Mayrhofen
Obergurgl
Zell am See
Livigno
Cervinia
Madonna di Campiglio
Val Gardena
Sestriere
Åre
Hemsedal
Baqueira-Beret
Grandvalira
Steamboat
Snowbird
Alta
Deer Valley
Sun Valley
Taos Ski Valley
Killington
Stowe
Big White
Sun Peaks
Fernie
Kicking Horse
Le Massif
Gudauri
Rusutsu
Furano
Yongpyong
Thredbo
Queenstown
`,
};
