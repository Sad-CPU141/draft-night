/* Positions for football topics whose slots are just "Pick 1…5" (Champions League Legends,
   Football Wonderkids, Women's Football Stars), so they can play the football match.
   G = goalkeeper, D = defender, M = midfielder, F = forward. Real-world positions. */
const ROLE_CODES = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };
const FOOTBALL_ROLES_SRC = `
Cristiano Ronaldo F|Lionel Messi F|Paolo Maldini D|Karim Benzema F|Luka Modrić M|Toni Kroos M|Clarence Seedorf M|Alfredo Di Stéfano F|Raúl F|Iker Casillas G
Xavi M|Andrés Iniesta M|Steven Gerrard M|Zinedine Zidane M|Ronaldinho F|Thierry Henry F|Andriy Shevchenko F|Filippo Inzaghi F|Kaká M|Robert Lewandowski F
Thomas Müller F|Sergio Ramos D|Didier Drogba F|Frank Lampard M|Ryan Giggs M|Gerd Müller F|Johan Cruyff F|Franz Beckenbauer D|Kylian Mbappé F|Mohamed Salah F
Gianluigi Buffon G|Manuel Neuer G|Marcelo D|Gareth Bale F|Vinícius Júnior F|Xabi Alonso M|Sergio Busquets M|Gerard Piqué D|Carles Puyol D|Dani Alves D
Samuel Eto'o F|Arjen Robben F|Franck Ribéry F|Philipp Lahm D|Bastian Schweinsteiger M|Wayne Rooney F|Rio Ferdinand D|Nemanja Vidić D|Paul Scholes M|Peter Schmeichel G
Ole Gunnar Solskjær F|Luís Figo F|Roberto Carlos D|Fernando Hierro D|Fernando Morientes F|Edwin van der Sar G|Marco van Basten F|Ruud Gullit M|Franco Baresi D|Alessandro Nesta D
Andrea Pirlo M|Gennaro Gattuso M|Diego Milito F|Javier Zanetti D|Wesley Sneijder M|Neymar F|Luis Suárez F|Ousmane Dembélé F|Achraf Hakimi D|Kevin De Bruyne M
Rodri M|Erling Haaland F|Virgil van Dijk D|Alisson G|Sadio Mané F|Casemiro M|Federico Valverde M|Thibaut Courtois G|Dani Carvajal D|Jude Bellingham M
Eusébio F|Kenny Dalglish F|Ian Rush F
Lamine Yamal F|Pau Cubarsí D|Gavi M|Désiré Doué F|Warren Zaïre-Emery M|João Neves M|Endrick F|Arda Güler M|Franco Mastantuono M|Estêvão F
Kobbie Mainoo M|Alejandro Garnacho F|Ethan Nwaneri M|Myles Lewis-Skelly D|Archie Gray M|Lucas Bergvall M|Rico Lewis D|Kenan Yıldız F|Nico Paz M|Jobe Bellingham M
Leny Yoro D|Jorrel Hato D|Mathys Tel F|Claudio Echeverri M|Adam Wharton M|Ayyoub Bouaddi M|Francesco Camarda F|Rodrigo Mora M|Geovany Quenda D|Dean Huijsen D
Marc Guiu F|Eli Junior Kroupi F|Lennart Karl M|Savinho F|Aleksandar Pavlović M|Alejandro Balde D|Harry Amass D|Chido Obi F|Rio Ngumoha F|Max Dowman M
Tyler Dibling F|Mikey Moore F|Roony Bardghji F|Luka Vušković D|Valentín Carboni M|Gonzalo García F|Ibrahim Mbaye F|Senny Mayulu M|Assan Ouédraogo M|Vitor Roque F
Kendry Páez M|Jamie Gittens F|Rasmus Højlund F|Yan Diomande F|Cristhian Mosquera D|Kees Smit M
Aitana Bonmatí M|Alexia Putellas M|Sam Kerr F|Marta F|Alex Morgan F|Megan Rapinoe F|Ada Hegerberg F|Lucy Bronze D|Vivianne Miedema F|Lauren James F
Alessia Russo F|Lauren Hemp F|Chloe Kelly F|Leah Williamson D|Mary Earps G|Beth Mead F|Trinity Rodman F|Sophia Smith F|Mallory Swanson F|Caroline Graham Hansen F
Wendie Renard D|Kadidiatou Diani F|Salma Paralluelo F|Khadija Shaw F|Christine Sinclair F|Pernille Harder F|Ewa Pajor F|Linda Caicedo F|Hinata Miyazawa M|Alexandra Popp F
Mapi León D|Irene Paredes D|Patri Guijarro M|Olga Carmona D|Mariona Caldentey M|Keira Walsh M|Ella Toone M|Georgia Stanway M|Millie Bright D|Hannah Hampton G
Alex Greenwood D|Jess Carter D|Lindsey Heaps M|Rose Lavelle M|Naomi Girma D|Alyssa Naeher G|Crystal Dunn D|Tobin Heath F|Carli Lloyd M|Abby Wambach F
Mia Hamm F|Lena Oberdorf M|Giulia Gwinn D|Lea Schüller F|Klara Bühl F|Fridolina Rolfö F|Stina Blackstenius F|Kosovare Asllani M|Magdalena Eriksson D|Barbra Banda F
Asisat Oshoala F|Steph Catley D|Mackenzie Arnold G|Caitlin Foord F|Ellie Carpenter D|Kadeisha Buchanan D|Jessie Fleming M|Ashley Lawrence D|Marie-Antoinette Katoto F|Eugénie Le Sommer F
Grace Geyoro M|Selma Bacha D|Lieke Martens F|Jill Roord M|Daniëlle van de Donk M|Cristiana Girelli F|Yui Hasegawa M|Saki Kumagai D|Ji So-yun M|Wang Shuang F
Debinha F|Tabitha Chawinga F
`;
const ROLE_BY_NAME = (() => { const m = {}; FOOTBALL_ROLES_SRC.trim().split(/\n|\|/).forEach((x) => { const t = x.trim(); const i = t.lastIndexOf(' '); if (i > 0) m[t.slice(0, i).toLowerCase()] = ROLE_CODES[t.slice(i + 1)]; }); return m; })();
// Topics that play the football match without the pitch layout.
const STARTER_SPORT = { 't-ucl': 'football', 't-wonder': 'football', 't-wfoot': 'football' };
