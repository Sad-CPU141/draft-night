/* ============================================================
   EXPANDED TOPIC LIBRARY (v3). One file per folder.
   Line format:  Name | short description | Wikipedia page (optional) | emoji (optional) | position (optional)
   Topic flags:  'p' = show Wikipedia photos (page = name unless given),
                 's' = generic things: look the photo up in sentence case ("Snow leopard").
   Only the three football topics in 20-topics.js use the Pitch layout, so only they get
   football ratings and the match simulator. Every topic here uses the List layout.
   ============================================================ */
function mkT(id, name, emoji, folder, slots, flags, text) {
  const photos = flags.includes('p'), sentence = flags.includes('s');
  const items = text.trim().split('\n').map((line, i) => {
    const [n, d, w, e, p] = line.split('|').map((x) => (x || '').trim());
    const it = { id: id + '-' + i, name: n, pos: p || '', desc: d || '', emoji: e || '', photo: '' };
    if (w) it.wiki = w; else if (photos && sentence) it.wiki = n.charAt(0) + n.slice(1).toLowerCase();
    return it;
  });
  return { id, name, emoji, slots: parseSlots(slots), layout: 'list', art: 'emoji', folder, photos, items, v3: true };
}

function sportsTopicsV3() {
  const F = 'Sports';
  return [
    mkT('t-ucl', 'Champions League Legends', '🏆', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Cristiano Ronaldo|All-time top scorer, 5 wins
Lionel Messi|4 wins with Barcelona
Paolo Maldini|5 European Cups with Milan
Karim Benzema|5 wins with Real Madrid
Luka Modrić|6 wins with Real Madrid|Luka Modrić
Toni Kroos|6 wins (Bayern, Real Madrid)
Clarence Seedorf|Won with 3 different clubs
Alfredo Di Stéfano|5 straight European Cups
Raúl|Real Madrid legend|Raúl (footballer)
Iker Casillas|Real Madrid captain
Xavi|Barcelona midfield maestro|Xavi
Andrés Iniesta|4 wins with Barcelona
Steven Gerrard|Istanbul 2005
Zinedine Zidane|2002 final volley
Ronaldinho|2006 winner with Barcelona
Thierry Henry|2009 winner
Andriy Shevchenko|2003 winner with Milan
Filippo Inzaghi|Two-goal 2007 final
Kaká|2007 Ballon d'Or winner
Robert Lewandowski|Bayern goal machine
Thomas Müller|Bayern stalwart
Sergio Ramos|92:48 in Lisbon
Didier Drogba|2012 final hero
Frank Lampard|Chelsea 2012 winner
Ryan Giggs|Manchester United winger
Gerd Müller|Bayern 1970s
Johan Cruyff|Ajax three-peat
Franz Beckenbauer|Bayern captain
Kylian Mbappé|PSG and Real Madrid star
Mohamed Salah|Liverpool 2019 winner
Gianluigi Buffon|Juventus keeper
Manuel Neuer|Bayern keeper
Marcelo|Real Madrid left back|Marcelo (footballer, born 1988)
Gareth Bale|2018 final overhead kick
Vinícius Júnior|2022 and 2024 winner`),
    mkT('t-plclubs', 'Premier League Clubs (2025–26)', '🦁', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Arsenal|The Gunners|Arsenal F.C.
Aston Villa|The Villans|Aston Villa F.C.
Bournemouth|The Cherries|AFC Bournemouth
Brentford|The Bees|Brentford F.C.
Brighton & Hove Albion|The Seagulls|Brighton & Hove Albion F.C.
Burnley|The Clarets|Burnley F.C.
Chelsea|The Blues|Chelsea F.C.
Crystal Palace|The Eagles|Crystal Palace F.C.
Everton|The Toffees|Everton F.C.
Fulham|The Cottagers|Fulham F.C.
Leeds United|The Whites|Leeds United F.C.
Liverpool|The Reds|Liverpool F.C.
Manchester City|The Citizens|Manchester City F.C.
Manchester United|The Red Devils|Manchester United F.C.
Newcastle United|The Magpies|Newcastle United F.C.
Nottingham Forest|Two-time European champions|Nottingham Forest F.C.
Sunderland|The Black Cats|Sunderland A.F.C.
Tottenham Hotspur|Spurs|Tottenham Hotspur F.C.
West Ham United|The Hammers|West Ham United F.C.
Wolverhampton Wanderers|Wolves|Wolverhampton Wanderers F.C.`),
    mkT('t-intl', 'International Football Teams', '🌍', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Brazil|5 World Cups|Brazil national football team|🇧🇷
Argentina|3 World Cups|Argentina national football team|🇦🇷
France|2 World Cups|France national football team|🇫🇷
Germany|4 World Cups|Germany national football team|🇩🇪
Spain|2010 World Cup, 4 Euros|Spain national football team|🇪🇸
Italy|4 World Cups|Italy national football team|🇮🇹
England|1966 World Cup|England national football team|🏴󠁧󠁢󠁥󠁮󠁧󠁿
Portugal|Euro 2016 winners|Portugal national football team|🇵🇹
Netherlands|Total Football|Netherlands national football team|🇳🇱
Uruguay|2 World Cups|Uruguay national football team|🇺🇾
Belgium|Golden generation|Belgium national football team|🇧🇪
Croatia|2018 finalists|Croatia national football team|🇭🇷
Morocco|2022 semi-finalists|Morocco national football team|🇲🇦
Saudi Arabia|Beat Argentina in 2022|Saudi Arabia national football team|🇸🇦
Japan|Samurai Blue|Japan national football team|🇯🇵
South Korea|2002 semi-finalists|South Korea national football team|🇰🇷
USA|2026 co-hosts|United States men's national soccer team|🇺🇸
Mexico|El Tri|Mexico national football team|🇲🇽
Canada|2026 co-hosts|Canada men's national soccer team|🇨🇦
Nigeria|Super Eagles|Nigeria national football team|🇳🇬
Senegal|2022 AFCON winners|Senegal national football team|🇸🇳
Egypt|7 AFCON titles|Egypt national football team|🇪🇬
Colombia|Los Cafeteros|Colombia national football team|🇨🇴
Denmark|Euro 1992 winners|Denmark national football team|🇩🇰
Switzerland|Nati|Switzerland national football team|🇨🇭
Turkey|2002 third place|Turkey national football team|🇹🇷
Ghana|Black Stars|Ghana national football team|🇬🇭
Australia|Socceroos|Australia men's national soccer team|🇦🇺
Cameroon|Indomitable Lions|Cameroon national football team|🇨🇲
Algeria|2019 AFCON winners|Algeria national football team|🇩🇿`),
    mkT('t-mgr', 'Football Managers', '📋', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Pep Guardiola|Barcelona, Bayern, Man City
Alex Ferguson|26 years at Manchester United
Jürgen Klopp|Dortmund and Liverpool
José Mourinho|Porto, Chelsea, Inter, Real Madrid
Carlo Ancelotti|Record 5 Champions Leagues
Arsène Wenger|Arsenal's Invincibles
Zinedine Zidane|3 straight Champions Leagues
Diego Simeone|Atlético Madrid
Johan Cruyff|Barcelona Dream Team
Mikel Arteta|Arsenal
Luis Enrique|PSG and Barcelona treble winner|Luis Enrique (footballer, born 1970)
Hansi Flick|Bayern sextuple, Barcelona
Xabi Alonso|Unbeaten Leverkusen champions
Antonio Conte|Juventus, Chelsea, Inter, Napoli
Rafael Benítez|Istanbul 2005
Vicente del Bosque|World Cup and Euro with Spain
Didier Deschamps|2018 World Cup with France
Lionel Scaloni|2022 World Cup with Argentina
Marcelo Bielsa|El Loco
Mauricio Pochettino|Tottenham and Chelsea
Thomas Tuchel|Chelsea 2021 Champions League
Unai Emery|Europa League specialist
Ange Postecoglou|Celtic and Tottenham
Brian Clough|Two European Cups with Forest
Bob Paisley|Three European Cups with Liverpool
Arrigo Sacchi|AC Milan revolution
Jupp Heynckes|Bayern 2013 treble
Louis van Gaal|Ajax 1995
Gareth Southgate|Two Euro finals with England
Roberto Mancini|Euro 2020 with Italy`),
    mkT('t-stadia', 'Football Stadiums', '🏟️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Camp Nou|Barcelona
Santiago Bernabéu|Real Madrid|Santiago Bernabéu Stadium
Old Trafford|Manchester United
Anfield|Liverpool
Wembley|London|Wembley Stadium
Signal Iduna Park|Borussia Dortmund|Westfalenstadion
San Siro|Milan|San Siro
Allianz Arena|Bayern Munich
Maracanã|Rio de Janeiro|Maracanã Stadium
La Bombonera|Boca Juniors
Estadio Azteca|Mexico City
Emirates Stadium|Arsenal
Tottenham Hotspur Stadium|Spurs
Etihad Stadium|Manchester City|City of Manchester Stadium
Stamford Bridge|Chelsea|Stamford Bridge (stadium)
Celtic Park|Celtic
Parc des Princes|Paris Saint-Germain
Stade Vélodrome|Marseille|Stade Vélodrome
Metropolitano|Atlético Madrid|Metropolitano Stadium
Juventus Stadium|Juventus|Juventus Stadium
Johan Cruyff Arena|Ajax
Estádio da Luz|Benfica|Estádio da Luz
King Fahd International Stadium|Riyadh
Lusail Stadium|2022 World Cup final
St James' Park|Newcastle United
Goodison Park|Everton's old home
Rose Bowl|Pasadena
MetLife Stadium|2026 World Cup final
BC Place|Vancouver
Türk Telekom Stadium|Galatasaray|Rams Park`),
    mkT('t-kits', 'Iconic Football Kits', '👕', F, 'Kit 1, Kit 2, Kit 3, Kit 4', '', `
Brazil 1970 Home|Pelé's yellow||🇧🇷
Netherlands 1988 Home|Orange with the famous pattern||🇳🇱
Nigeria 2018 Home|Green zig-zag sell-out||🇳🇬
Germany 1990 Home|Tricolour stripes||🇩🇪
Argentina 1986 Home|Maradona's World Cup||🇦🇷
France 1998 Home|First World Cup win||🇫🇷
Italy 2006 Home|Azzurri world champions||🇮🇹
England 1996 Home|Euro 96||🏴󠁧󠁢󠁥󠁮󠁧󠁿
Arsenal 2003–04 Home|The Invincibles||🔴
Manchester United 1999 Home|Treble season||🔴
Barcelona 2008–09 Home|Sextuple squad||🔵
Real Madrid 2016–17 Home|Back-to-back champions||⚪
AC Milan 1988–89 Home|Sacchi's Milan||⚫
Liverpool 2005 Home|Istanbul night||🔴
Chelsea 2012 Home|Munich champions||🔵
Juventus 1996 Home|Del Piero era||⚫
Inter 2010 Home|Mourinho's treble||🔵
Mexico 1998 Goalkeeper|Jorge Campos' colours||🧤
Colombia 1990 Home|Valderrama style||🇨🇴
Denmark 1986 Home|Hummel halves||🇩🇰
Japan 1998 Home|Flame sleeves||🇯🇵
Cameroon 2002 Home|Sleeveless shirt||🇨🇲
Croatia 1998 Home|Checkerboard||🇭🇷
Saudi Arabia 1994 Home|First World Cup||🇸🇦
Borussia Dortmund 1997 Home|Champions League winners||🟡
Ajax 1995 Home|Young champions||⚪
Newcastle 1995–96 Home|Black and white stripes||⚫
Parma 1999 Home|Yellow and blue||🟡`),
    mkT('t-wonder', 'Football Wonderkids', '🌟', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Lamine Yamal|Barcelona, born 2007
Pau Cubarsí|Barcelona defender, born 2007
Gavi|Barcelona midfielder, born 2004|Gavi (footballer)
Désiré Doué|PSG, born 2005
Warren Zaïre-Emery|PSG, born 2006
João Neves|PSG midfielder, born 2004|João Neves (footballer, born 2004)
Endrick|Real Madrid, born 2006|Endrick (footballer)
Arda Güler|Real Madrid, born 2005
Franco Mastantuono|Real Madrid, born 2007
Estêvão|Chelsea, born 2007|Estêvão (footballer, born 2007)
Kobbie Mainoo|Manchester United, born 2005
Alejandro Garnacho|Born 2004
Ethan Nwaneri|Arsenal, born 2007
Myles Lewis-Skelly|Arsenal, born 2006
Archie Gray|Tottenham, born 2006
Lucas Bergvall|Tottenham, born 2006
Rico Lewis|Manchester City, born 2004
Kenan Yıldız|Juventus, born 2005
Nico Paz|Born 2004
Jobe Bellingham|Born 2005
Leny Yoro|Manchester United, born 2005
Jorrel Hato|Born 2006
Mathys Tel|Born 2005
Claudio Echeverri|Born 2006
Adam Wharton|Crystal Palace, born 2004
Ayyoub Bouaddi|Lille, born 2007`),
    mkT('t-wfoot', 'Women’s Football Stars', '⚽', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Aitana Bonmatí|Spain, Ballon d'Or winner
Alexia Putellas|Spain, Ballon d'Or winner
Sam Kerr|Australia striker
Marta|Brazil legend|Marta (footballer)
Alex Morgan|USA legend
Megan Rapinoe|USA legend
Ada Hegerberg|Norway, first women's Ballon d'Or
Lucy Bronze|England defender
Vivianne Miedema|Netherlands goalscorer
Lauren James|England forward|Lauren James (footballer)
Alessia Russo|England striker
Lauren Hemp|England winger
Chloe Kelly|Euro 2022 winner
Leah Williamson|England captain
Mary Earps|England goalkeeper
Beth Mead|England forward
Trinity Rodman|USA forward
Sophia Smith|USA forward|Sophia Smith (soccer)
Mallory Swanson|USA forward
Caroline Graham Hansen|Norway winger
Wendie Renard|France captain
Kadidiatou Diani|France forward
Salma Paralluelo|Spain forward
Khadija Shaw|Jamaica striker
Christine Sinclair|Canada, all-time top scorer
Pernille Harder|Denmark forward
Ewa Pajor|Poland striker
Linda Caicedo|Colombia forward
Hinata Miyazawa|Japan midfielder
Alexandra Popp|Germany captain`),
    mkT('t-nbagreat', 'Greatest NBA Teams Ever', '🏀', F, 'Team 1, Team 2, Team 3, Team 4', 'p', `
1995–96 Chicago Bulls|72–10, Jordan & Pippen|1995–96 Chicago Bulls season
2016–17 Golden State Warriors|Durant joins the Splash Brothers|2016–17 Golden State Warriors season
1985–86 Boston Celtics|Bird's best team|1985–86 Boston Celtics season
1986–87 Los Angeles Lakers|Showtime|1986–87 Los Angeles Lakers season
1971–72 Los Angeles Lakers|33-game win streak|1971–72 Los Angeles Lakers season
1966–67 Philadelphia 76ers|Wilt Chamberlain|1966–67 Philadelphia 76ers season
1982–83 Philadelphia 76ers|Fo', Fo', Fo'|1982–83 Philadelphia 76ers season
2000–01 Los Angeles Lakers|Shaq & Kobe, 15–1 playoffs|2000–01 Los Angeles Lakers season
1991–92 Chicago Bulls|67 wins|1991–92 Chicago Bulls season
1996–97 Chicago Bulls|69 wins|1996–97 Chicago Bulls season
2012–13 Miami Heat|27-game streak|2012–13 Miami Heat season
2013–14 San Antonio Spurs|Beautiful game|2013–14 San Antonio Spurs season
2007–08 Boston Celtics|Big Three|2007–08 Boston Celtics season
2015–16 Golden State Warriors|73–9|2015–16 Golden State Warriors season
2015–16 Cleveland Cavaliers|Came back from 3–1|2015–16 Cleveland Cavaliers season
1988–89 Detroit Pistons|Bad Boys|1988–89 Detroit Pistons season
2003–04 Detroit Pistons|Team over stars|2003–04 Detroit Pistons season
1969–70 New York Knicks|Willis Reed game|1969–70 New York Knicks season
1976–77 Portland Trail Blazers|Bill Walton|1976–77 Portland Trail Blazers season
1993–94 Houston Rockets|Hakeem's title|1993–94 Houston Rockets season
2010–11 Dallas Mavericks|Dirk beats the Heat|2010–11 Dallas Mavericks season
2018–19 Toronto Raptors|Kawhi and The Shot|2018–19 Toronto Raptors season
2020–21 Milwaukee Bucks|Giannis's 50 in Game 6|2020–21 Milwaukee Bucks season
2022–23 Denver Nuggets|Jokić's first title|2022–23 Denver Nuggets season
2023–24 Boston Celtics|Banner 18|2023–24 Boston Celtics season
2024–25 Oklahoma City Thunder|SGA's champions|2024–25 Oklahoma City Thunder season
1964–65 Boston Celtics|Bill Russell dynasty|1964–65 Boston Celtics season
2016–17 Cleveland Cavaliers|LeBron and Kyrie|2016–17 Cleveland Cavaliers season`),
    mkT('t-nbateams', 'NBA Teams', '🏀', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Atlanta Hawks|East
Boston Celtics|East · 18 titles
Brooklyn Nets|East
Charlotte Hornets|East
Chicago Bulls|East · 6 titles
Cleveland Cavaliers|East
Detroit Pistons|East
Indiana Pacers|East
Miami Heat|East
Milwaukee Bucks|East
New York Knicks|East
Orlando Magic|East
Philadelphia 76ers|East
Toronto Raptors|East · 2019 champions
Washington Wizards|East
Dallas Mavericks|West
Denver Nuggets|West
Golden State Warriors|West
Houston Rockets|West
Los Angeles Clippers|West
Los Angeles Lakers|West · 17 titles
Memphis Grizzlies|West
Minnesota Timberwolves|West
New Orleans Pelicans|West
Oklahoma City Thunder|West · 2025 champions
Phoenix Suns|West
Portland Trail Blazers|West
Sacramento Kings|West
San Antonio Spurs|West
Utah Jazz|West`),
    mkT('t-oly', 'Olympic Athletes', '🥇', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Usain Bolt|Jamaica, sprint
Michael Phelps|USA, swimming · 23 golds
Simone Biles|USA, gymnastics
Carl Lewis|USA, sprint and long jump
Jesse Owens|USA, Berlin 1936
Nadia Comăneci|Romania, first perfect 10
Katie Ledecky|USA, distance swimming
Eliud Kipchoge|Kenya, marathon
Mo Farah|Great Britain, distance running
Allyson Felix|USA, sprint
Florence Griffith Joyner|USA, sprint
Armand Duplantis|Sweden, pole vault
Sydney McLaughlin-Levrone|USA, 400m hurdles
Faith Kipyegon|Kenya, middle distance
Shelly-Ann Fraser-Pryce|Jamaica, sprint
Larisa Latynina|Soviet gymnast
Paavo Nurmi|Finland, distance running
Mark Spitz|USA, swimming
Ian Thorpe|Australia, swimming
Léon Marchand|France, swimming
Caeleb Dressel|USA, swimming
Jessica Ennis-Hill|Great Britain, heptathlon
Chris Hoy|Great Britain, cycling
Kelly Holmes|Great Britain, middle distance
Noah Lyles|USA, sprint
Sifan Hassan|Netherlands, distance running
Rebeca Andrade|Brazil, gymnastics
Shaun White|USA, snowboarding
Marit Bjørgen|Norway, cross-country skiing
Steve Redgrave|Great Britain, rowing
Greg Louganis|USA, diving
Daley Thompson|Great Britain, decathlon`),
    mkT('t-wwe', 'WWE Superstars', '🤼', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
The Rock|The People's Champ|Dwayne Johnson
John Cena|You can't see me
Stone Cold Steve Austin|Austin 3:16
The Undertaker|The Deadman
Hulk Hogan|Hulkamania
Randy Orton|The Viper
Triple H|The Game
Shawn Michaels|Mr. WrestleMania
Roman Reigns|The Tribal Chief
Rey Mysterio|619
Brock Lesnar|The Beast Incarnate
CM Punk|Best in the World
Cody Rhodes|The American Nightmare
Seth Rollins|The Visionary
Becky Lynch|The Man
Charlotte Flair|The Queen
Rhea Ripley|Mami
Bianca Belair|The EST
Ric Flair|The Nature Boy
Randy Savage|Macho Man
André the Giant|The Eighth Wonder of the World
Bret Hart|The Hitman
Edge|The Rated-R Superstar|Edge (wrestler)
Kane|The Big Red Machine|Kane (wrestler)
Batista|The Animal|Dave Bautista
Kurt Angle|Olympic gold medallist
Eddie Guerrero|Lie, cheat, steal
Gunther|The Ring General|Gunther (wrestler)
Kofi Kingston|New Day
Trish Stratus|Seven-time women's champion
Drew McIntyre|The Scottish Warrior
Logan Paul|The Maverick`),
    mkT('t-golf', 'Golfers', '⛳', F, 'Pick 1, Pick 2, Pick 3, Pick 4', 'p', `
Tiger Woods|15 majors
Jack Nicklaus|18 majors
Arnold Palmer|The King
Rory McIlroy|Northern Ireland
Scottie Scheffler|USA
Phil Mickelson|Lefty
Gary Player|South Africa
Seve Ballesteros|Spain
Jon Rahm|Spain
Brooks Koepka|USA
Dustin Johnson|USA
Jordan Spieth|USA
Bryson DeChambeau|USA
Xander Schauffele|USA
Justin Rose|England
Ben Hogan|USA
Sam Snead|USA
Bobby Jones|Grand Slam 1930|Bobby Jones (golfer)
Nick Faldo|England
Ernie Els|South Africa
Vijay Singh|Fiji
Annika Sörenstam|Sweden
Nelly Korda|USA
Lydia Ko|New Zealand
Collin Morikawa|USA
Tommy Fleetwood|England
Ludvig Åberg|Sweden
Hideki Matsuyama|Japan
Shane Lowry|Ireland
Tom Watson|USA|Tom Watson (golfer)`),
    mkT('t-mlb', 'MLB Players', '⚾', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Shohei Ohtani|Pitcher and hitter
Aaron Judge|Outfielder
Mookie Betts|Infielder/outfielder
Juan Soto|Outfielder
Freddie Freeman|First baseman
Bryce Harper|First baseman
Mike Trout|Outfielder
Ronald Acuña Jr.|Outfielder
Vladimir Guerrero Jr.|First baseman
Bobby Witt Jr.|Shortstop
Gunnar Henderson|Shortstop
Corey Seager|Shortstop
Fernando Tatís Jr.|Outfielder
Yoshinobu Yamamoto|Pitcher
Paul Skenes|Pitcher
Tarik Skubal|Pitcher
Gerrit Cole|Pitcher
Zack Wheeler|Pitcher
Jacob deGrom|Pitcher
Julio Rodríguez|Outfielder|Julio Rodríguez (baseball)
Francisco Lindor|Shortstop
José Ramírez|Third baseman|José Ramírez (infielder)
Pete Alonso|First baseman
Cal Raleigh|Catcher
Kyle Schwarber|Designated hitter
Elly De La Cruz|Shortstop
Corbin Carroll|Outfielder
Manny Machado|Third baseman
Rafael Devers|Infielder
Yordan Alvarez|Designated hitter
José Altuve|Second baseman
Adley Rutschman|Catcher`),
    mkT('t-mlbl', 'MLB Legends', '⚾', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Babe Ruth|The Sultan of Swat
Jackie Robinson|Broke the colour barrier
Hank Aaron|755 home runs
Willie Mays|The Say Hey Kid
Mickey Mantle|Yankees
Lou Gehrig|The Iron Horse
Ted Williams|Last .400 hitter
Joe DiMaggio|56-game hit streak
Ty Cobb|Tigers
Roberto Clemente|Pirates
Derek Jeter|Yankees captain
Ken Griffey Jr.|The Kid
Barry Bonds|762 home runs
Cal Ripken Jr.|2,632 straight games
Nolan Ryan|5,714 strikeouts
Sandy Koufax|Dodgers
Randy Johnson|The Big Unit
Pedro Martínez|Red Sox
Mariano Rivera|Unanimous Hall of Famer
Greg Maddux|Braves
Stan Musial|Cardinals
Rickey Henderson|Stolen base king
Ichiro Suzuki|Mariners
David Ortiz|Big Papi
Albert Pujols|Cardinals
Johnny Bench|Reds catcher
Yogi Berra|Yankees catcher
Tony Gwynn|Mr. Padre
Cy Young|511 wins
Walter Johnson|The Big Train
Honus Wagner|Pirates
Chipper Jones|Braves`),
    mkT('t-rugby', 'Rugby Players', '🏉', F, 'Pick 1, Pick 2, Pick 3, Pick 4, Pick 5', 'p', `
Jonah Lomu|New Zealand
Richie McCaw|New Zealand
Dan Carter|New Zealand
Jonny Wilkinson|England
Brian O'Driscoll|Ireland
Antoine Dupont|France
Siya Kolisi|South Africa
Johnny Sexton|Ireland
Martin Johnson|England|Martin Johnson (rugby union)
Gareth Edwards|Wales|Gareth Edwards (rugby union)
Shane Williams|Wales
Beauden Barrett|New Zealand
Cheslin Kolbe|South Africa
Eben Etzebeth|South Africa
Maro Itoje|England
Alun Wyn Jones|Wales
Bryan Habana|South Africa
David Pocock|Australia
George Gregan|Australia
Sergio Parisse|Italy
Owen Farrell|England
Ardie Savea|New Zealand
Handré Pollard|South Africa
Pieter-Steph du Toit|South Africa
Finn Russell|Scotland
Faf de Klerk|South Africa
Michael Hooper|Australia
Jason Robinson|England|Jason Robinson (rugby)`),
    mkT('t-moments', 'Greatest Sports Moments', '🎬', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
Miracle on Ice|USA beat the USSR, 1980||🏒
Hand of God and Goal of the Century|Maradona v England, 1986||⚽
Rumble in the Jungle|Ali beats Foreman, 1974||🥊
Bolt runs 9.58|Berlin, 2009||⚡
Agüero 93:20|Man City win the league, 2012||⚽
Istanbul comeback|Liverpool from 3–0 down, 2005||🏆
Leicester City win the Premier League|5000–1 shot, 2016||🦊
Jordan's Flu Game|1997 Finals||🏀
Comăneci's perfect 10|Montreal, 1976||🤸
Bannister's four-minute mile|Oxford, 1954||🏃
Jesse Owens wins four golds|Berlin, 1936||🥇
Phelps wins eight golds|Beijing, 2008||🏊
Messi lifts the World Cup|Qatar, 2022||🏆
Cavaliers come back from 3–1|2016 Finals||🏀
Red Sox reverse the curse|2004||⚾
The Helmet Catch|Super Bowl XLII, 2008||🏈
Brady's 28–3 comeback|Super Bowl LI, 2017||🏈
Tiger wins the 2019 Masters|Comeback major||⛳
Federer v Nadal at Wimbledon|2008 final||🎾
Man United's injury-time treble|1999 Champions League final||⚽
Barcelona 6–1 PSG|La Remontada, 2017||⚽
Germany 7–1 Brazil|2014 World Cup semi-final||⚽
Kobe scores 81|2006||🏀
Ray Allen's corner three|2013 Finals||🏀
Bob Beamon's long jump|Mexico City, 1968||🦘
Kerri Strug's vault|Atlanta, 1996||🤸
Saudi Arabia beat Argentina|2022 World Cup||⚽
Raptors win the title|2019||🏀
Kawhi's buzzer-beater bounce|2019 playoffs||🏀`),
    mkT('t-goals', 'Greatest Football Goals', '🥅', F, 'Goal 1, Goal 2, Goal 3, Goal 4', '', `
Maradona v England|1986 World Cup solo run||⚽
Zidane volley|2002 Champions League final||⚽
Van Basten volley|Euro 88 final||⚽
Ibrahimović bicycle kick v England|2012 friendly||⚽
Rooney overhead kick v Man City|2011 derby||⚽
Roberto Carlos free kick v France|1997||⚽
Bergkamp turn v Newcastle|2002||⚽
Messi solo goal v Getafe|2007||⚽
Ronaldo bicycle kick v Juventus|2018||⚽
Bale overhead kick|2018 Champions League final||⚽
Gerrard's FA Cup final equaliser|2006 v West Ham||⚽
Henry volley v Man United|2000||⚽
Papiss Cissé v Chelsea|2012||⚽
Yeboah v Liverpool|1995||⚽
Giggs solo goal v Arsenal|1999 FA Cup semi-final||⚽
James Rodríguez volley v Uruguay|2014 World Cup||⚽
Van Persie header v Spain|2014 World Cup||⚽
Pavard half-volley v Argentina|2018 World Cup||⚽
Bergkamp v Argentina|1998 World Cup||⚽
Al-Owairan solo goal v Belgium|1994 World Cup||⚽
Cambiasso 24-pass goal|2006 World Cup||⚽
Lamela rabona v Arsenal|2021||⚽
Garnacho overhead kick v Everton|2023||⚽
Agüero v QPR|2012 title winner||⚽
Iniesta's World Cup winner|2010 final||⚽
Messi chip v Bayern|2015 semi-final||⚽
Ronaldo free kick v Spain|2018 World Cup||⚽`),
    mkT('t-rivals', 'Football Rivalries', '⚔️', F, 'Pick 1, Pick 2, Pick 3, Pick 4', '', `
El Clásico|Real Madrid v Barcelona||🇪🇸
North West Derby|Liverpool v Manchester United||🔴
Manchester Derby|City v United||🔵
North London Derby|Arsenal v Tottenham||⚪
Merseyside Derby|Liverpool v Everton||🔵
Old Firm|Celtic v Rangers||🍀
Derby della Madonnina|Inter v AC Milan||⚫
Derby della Capitale|Roma v Lazio||🟡
Derby d'Italia|Inter v Juventus||⚫
Der Klassiker|Bayern v Dortmund||🟡
Revierderby|Dortmund v Schalke||🟡
Le Classique|PSG v Marseille||🔵
Superclásico|Boca Juniors v River Plate||🇦🇷
Intercontinental Derby|Fenerbahçe v Galatasaray||🇹🇷
Madrid Derby|Real v Atlético||⚪
De Klassieker|Ajax v Feyenoord||🇳🇱
Eternal Derby|Red Star v Partizan||🔴
Cairo Derby|Al Ahly v Zamalek||🇪🇬
Riyadh Derby|Al Hilal v Al Nassr||🇸🇦
Tyne–Wear Derby|Newcastle v Sunderland||⚫
Seville Derby|Sevilla v Real Betis||🟢
Lisbon Derby|Benfica v Sporting||🦅
O Clássico|Benfica v Porto||🐉
Argentina v Brazil|South American classic||🌎
England v Germany|Penalties and heartbreak||🏴󠁧󠁢󠁥󠁮󠁧󠁿
Netherlands v Germany|Neighbours at war||🟠
USA v Mexico|Dos a Cero||🌎`),
  ];
}
