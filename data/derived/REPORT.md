# Match data report

1500 EUW Challenger/Grandmaster solo-queue matches · patches 16.18, 16.19, 16.20.

## Draft rules vs real results

| Rule | Win rate when true | Win rate otherwise | Difference | Games (true / otherwise) |
| --- | --- | --- | --- | --- |
| 2+ frontliners | 46% | 52% | -5.3 pts | 972 / 2028 |
| 2+ engage champions | 50% | 50% | +0.1 pts | 2219 / 781 |
| Magic damage 20-80% | 50% | 40% | +10.6 pts | 2962 / 38 |
| At least one top-damage champion | 50% | 48% | +2 pts | 2975 / 25 |
| Fewer than 2 split pushers | 50% | 50% | -0.3 pts | 2642 / 358 |
| 4+ champions share one plan (teamfight or pick) | 49% | 51% | -1.8 pts | 803 / 2197 |
| Late carry with a peeler (teams with a late carry) | 51% | 50% | +0.6 pts | 1904 / 425 |
| vs squishy team: 3+ engage/burst champions | 51% | 48% | +3.2 pts | 563 / 147 |
| vs heavy engage: 2+ peel/disengage champions | 51% | 49% | +2.4 pts | 734 / 349 |
| vs teamfight comp: disengage or a split pusher | 50% | 53% | -3.2 pts | 381 / 294 |
| vs split pushers: 3+ waveclear champions | 48% | 52% | -3.3 pts | 205 / 153 |
| vs tanky team: 2+ sustained-damage carries | 49% | 53% | -4.1 pts | 74 / 91 |

## Lane rules vs real results

| Lane rule | Win rate when it applies | Games |
| --- | --- | --- |
| laneRange | 49% | 538 |
| laneEarly | 43% | 419 |
| laneBurst | 49% | 687 |
| laneTank | 54% | 183 |
| laneBully | 57% | 72 |
| laneSide | 50% | 359 |

Champion-vs-champion matchups with 10+ games: 72.

## After a kill leaves a team 2+ players up (next 90 s)

| Players up | Objective up | Moments | Took objective | Took tower | Lost a player | Won the game |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | baron | 2704 | 52% | 48% | 64% | 74% |
| 2 | dragon | 3062 | 48% | 35% | 68% | 71% |
| 2 | none | 11148 | 10% | 52% | 69% | 70% |
| 3 | baron | 1359 | 55% | 59% | 53% | 82% |
| 3 | dragon | 896 | 58% | 57% | 54% | 82% |
| 3 | none | 3965 | 11% | 68% | 58% | 82% |
| 4+ | baron | 693 | 46% | 67% | 36% | 89% |
| 4+ | dragon | 341 | 45% | 70% | 41% | 89% |
| 4+ | none | 1678 | 8% | 76% | 41% | 90% |

## champions.txt values the data disagrees with

Measured from damage, damage taken, crowd control and healing per minute, graded 1-5 against all champions (5 = top 20%). Review before changing anything: the data measures what champions do, not always what they are for.

| Champion | Games | Field | Ours | Data |
| --- | --- | --- | --- | --- |
| Jax | 76 | frontline | 2 | 4 |
| Jax | 76 | engage/peel (CC) | 4 | 2 |
| Jax | 76 | damage | 5 | 3 |
| Yone | 301 | frontline | 1 | 4 |
| Yone | 301 | engage/peel (CC) | 4 | 2 |
| Sylas | 266 | frontline | 2 | 4 |
| Sylas | 266 | damage | 5 | 3 |
| Lee Sin | 258 | frontline | 2 | 5 |
| Lee Sin | 258 | damage | 4 | 2 |
| Qiyana | 211 | frontline | 1 | 3 |
| Qiyana | 211 | engage/peel (CC) | 5 | 2 |
| Yasuo | 196 | frontline | 1 | 4 |
| Yasuo | 196 | damage | 5 | 3 |
| Ekko | 175 | frontline | 1 | 3 |
| Ekko | 175 | damage | 5 | 3 |
| Kha'Zix | 145 | frontline | 1 | 3 |
| Kha'Zix | 145 | damage | 5 | 3 |
| Elise | 143 | frontline | 1 | 3 |
| Elise | 143 | damage | 5 | 2 |
| Talon | 138 | frontline | 1 | 3 |
| Talon | 138 | damage | 5 | 3 |
| Cho'Gath | 128 | engage/peel (CC) | 2 | 5 |
| Cho'Gath | 128 | damage | 4 | 2 |
| Jarvan IV | 124 | engage/peel (CC) | 5 | 3 |
| Jarvan IV | 124 | damage | 4 | 2 |
| Irelia | 118 | frontline | 2 | 5 |
| Irelia | 118 | engage/peel (CC) | 4 | 2 |
| Wukong | 110 | engage/peel (CC) | 5 | 2 |
| Wukong | 110 | damage | 4 | 2 |
| Ryze | 105 | frontline | 1 | 3 |
| Ryze | 105 | engage/peel (CC) | 1 | 3 |
| Twisted Fate | 104 | engage/peel (CC) | 2 | 5 |
| Twisted Fate | 104 | damage | 4 | 2 |
| Cassiopeia | 99 | frontline | 1 | 3 |
| Cassiopeia | 99 | engage/peel (CC) | 2 | 4 |
| Hecarim | 97 | engage/peel (CC) | 5 | 2 |
| Hecarim | 97 | damage | 4 | 2 |
| Rengar | 90 | frontline | 1 | 3 |
| Rengar | 90 | damage | 5 | 3 |
| Nidalee | 79 | frontline | 1 | 4 |
| Nidalee | 79 | damage | 5 | 3 |
| Anivia | 73 | frontline | 1 | 3 |
| Anivia | 73 | damage | 4 | 2 |
| Naafiri | 70 | frontline | 1 | 3 |
| Naafiri | 70 | damage | 5 | 3 |
| Riven | 68 | frontline | 2 | 4 |
| Riven | 68 | damage | 5 | 2 |
| Lillia | 67 | frontline | 1 | 4 |
| Lillia | 67 | damage | 5 | 3 |
| Vi | 64 | frontline | 2 | 4 |
| Vi | 64 | damage | 4 | 1 |
| Diana | 58 | frontline | 2 | 5 |
| Diana | 58 | engage/peel (CC) | 5 | 2 |
| Shaco | 58 | engage/peel (CC) | 1 | 4 |
| Shaco | 58 | damage | 5 | 3 |
| Rumble | 47 | frontline | 2 | 4 |
| Rumble | 47 | engage/peel (CC) | 4 | 2 |
| Tryndamere | 43 | frontline | 1 | 5 |
| Tryndamere | 43 | damage | 5 | 3 |
| Kindred | 33 | frontline | 1 | 3 |
| Kindred | 33 | engage/peel (CC) | 4 | 2 |
| Kassadin | 30 | frontline | 1 | 4 |
| Kassadin | 30 | damage | 5 | 3 |
| Syndra | 255 | engage/peel (CC) | 2 | 5 |
| Jhin | 248 | engage/peel (CC) | 2 | 4 |
| Jayce | 238 | frontline | 1 | 3 |
| Camille | 205 | frontline | 2 | 4 |
| Locke | 199 | frontline | 1 | 3 |
| Bard | 199 | frontline | 1 | 3 |
| Kalista | 191 | frontline | 1 | 3 |
| Ahri | 164 | engage/peel (CC) | 4 | 2 |
| Akali | 150 | frontline | 1 | 3 |
| Ambessa | 148 | engage/peel (CC) | 4 | 1 |
| Zeri | 143 | frontline | 1 | 3 |
| Graves | 120 | engage/peel (CC) | 1 | 3 |
| Viego | 113 | frontline | 2 | 4 |
| Galio | 111 | damage | 4 | 2 |
| Rakan | 111 | frontline | 1 | 3 |
| Olaf | 109 | damage | 5 | 3 |
| Zoe | 108 | engage/peel (CC) | 2 | 5 |
| Pyke | 103 | damage | 5 | 1 |
| Gangplank | 98 | frontline | 1 | 3 |
| Renekton | 93 | damage | 4 | 2 |
| Senna | 90 | damage | 5 | 2 |
| Katarina | 87 | frontline | 1 | 3 |
| Shen | 86 | AD share | 0.3 | 0.6 |
| Aurelion Sol | 85 | engage/peel (CC) | 1 | 3 |
| Orianna | 83 | engage/peel (CC) | 5 | 3 |
| Darius | 80 | damage | 5 | 2 |
| Renata Glasc | 79 | engage/peel (CC) | 5 | 3 |
| Quinn | 75 | engage/peel (CC) | 1 | 3 |
| Garen | 74 | engage/peel (CC) | 2 | 4 |

## Decision making vs real results

Real moments (after a kill, around objective spawns, and once a minute), what the team did in the next 90 seconds, and its gold swing over the next 2 minutes. The action is read from where the team was (positions exist once a minute, so it is an estimate), not from whether it worked. Stronger teams also choose more aggressive actions, so compare actions within one situation, not across situations.

**Engine check:** 59612 moments (plus 9881 where the engine's answer, such as clearing a wave or farming, cannot be read from the data). The engine's answer was what the team did in 15% of them. When the team did the engine's answer: +238 gold on average; otherwise -31. Where the data has a clear best action (34553 moments), the engine picked it 21% of the time.

| Engine answer | Engine said it | Team did it | Gold swing when they did | When they did something else |
| --- | --- | --- | --- | --- |
| take | 6171 | 1582 | +473 | +472 |
| setup | 11763 | 2329 | +414 | +543 |
| trade | 13676 | 80 | -339 | -445 |
| push | 9429 | 1445 | +1004 | +848 |
| defend | 10175 | 256 | -1097 | -933 |
| split | 5468 | 1423 | +158 | -39 |
| farm | 2930 | 1911 | -490 | -163 |

**Best measured action per situation** (players up or down | objective | gold). Used as the app's answer only when it is clear: 100+ moments, 150+ gold better than everything else, and at least 2 standard errors (unlikely to be chance).

| Situation | Moments | Best action | Its gold swing | Everything else | All actions (moments, avg gold swing) |
| --- | --- | --- | --- | --- | --- |
| even · none · ahead | 10970 | push | +707 | +492 | recall 52/+909, push 2135/+707, split 1884/+664, farm 6626/+457, defend 273/+86 |
| even · none · behind | 10137 | push | +243 | -537 | push 506/+243, recall 77/-73, split 1783/-434, farm 6457/-509, defend 1314/-843 |
| even · none · even | 10121 | push | +474 | -17 | push 980/+474, recall 58/+226, split 1266/+111, farm 7400/-20, defend 417/-377 |
| even · up · even | 3522 | take | +154 | -46 | trade 58/+399, push 81/+322, take 874/+154, split 138/+96, recall 15/-58, farm 2254/-68, defend 102/-309 |
| down · none · behind | 3464 | – | – | – | recall 14/-14, push 26/-365, defend 122/-1145, farm 3302/-1228 |
| up · none · ahead | 3417 | – | – | – | defend 117/+1405, split 750/+1330, farm 1787/+1195, push 742/+1174, recall 21/+971 |
| even · up · ahead | 3340 | – | – | – | recall 21/+1669, trade 154/+781, push 233/+704, farm 1892/+527, take 759/+521, split 214/+485, defend 67/+228 |
| even · soon · ahead | 3190 | – | – | – | recall 12/+722, split 277/+596, push 265/+595, trade 160/+547, farm 1397/+481, setup 1006/+380, defend 73/+359 |
| even · up · behind | 3174 | take | -173 | -598 | push 43/+397, take 568/-173, trade 51/-226, split 223/-571, farm 1991/-613, defend 271/-710, recall 27/-949 |
| even · soon · behind | 2983 | setup | +88 | -520 | push 65/+464, setup 748/+88, split 327/-390, trade 50/-433, recall 26/-445, farm 1448/-575, defend 319/-625 |
| even · soon · even | 2594 | – | – | – | recall 8/+497, push 93/+334, trade 44/+293, split 183/+171, setup 910/+135, farm 1285/-46, defend 71/-533 |
| down · none · even | 1566 | – | – | – | push 22/-539, farm 1530/-676, defend 14/-1172 |
| up · none · even | 1423 | push | +1043 | +732 | push 167/+1043, recall 10/+875, farm 887/+736, split 290/+727, defend 69/+679 |
| up · up · ahead | 1159 | – | – | – | recall 8/+2609, split 114/+1444, defend 38/+1333, take 244/+1266, farm 589/+1235, push 74/+1030, trade 92/+605 |
| down · up · behind | 1120 | – | – | – | trade 3/-1084, farm 1068/-1155, take 21/-1170, defend 23/-1335, recall 3/-1403, push 2/-2337 |
| down · none · ahead | 1062 | – | – | – | push 49/+434, farm 1003/-633, defend 9/-840, recall 1/-917 |
| up · soon · ahead | 978 | split | +1501 | +1012 | recall 4/+1588, split 104/+1501, push 87/+1291, setup 294/+1141, farm 377/+1015, defend 29/+973, trade 83/+237 |
| down · soon · behind | 931 | – | – | – | push 2/+1137, recall 4/+850, setup 24/-83, defend 43/-848, farm 858/-1079 |
| up · none · behind | 920 | push | +1184 | +589 | push 102/+1184, split 260/+682, farm 440/+578, recall 15/+547, defend 103/+409 |
| up · up · even | 582 | – | – | – | split 42/+1592, push 32/+1388, take 176/+947, defend 28/+858, farm 285/+815, trade 16/+616, recall 3/+119 |
| down · up · even | 579 | – | – | – | defend 5/-350, take 12/-691, farm 559/-868, trade 1/-1631, push 2/-2156 |
| up · soon · even | 424 | – | – | – | recall 2/+2470, push 24/+1237, trade 10/+1108, setup 170/+843, farm 149/+752, split 46/+674, defend 23/+406 |
| down · soon · even | 414 | – | – | – | setup 18/-486, push 3/-500, farm 389/-735, trade 2/-3138, defend 2/-3228 |
| up · up · behind | 361 | – | – | – | push 15/+1816, trade 9/+1326, split 43/+1056, farm 149/+1004, take 105/+888, defend 31/+499, recall 9/+494 |
| down · up · ahead | 360 | – | – | – | trade 3/+183, take 14/-127, farm 338/-841, push 4/-2367, defend 1/-3236 |
| down · soon · ahead | 351 | – | – | – | trade 5/-249, setup 26/-465, farm 309/-694, push 6/-1177, defend 5/-2207 |
| up · soon · behind | 351 | – | – | – | push 11/+1310, setup 133/+949, farm 108/+699, defend 35/+695, split 52/+688, trade 11/+136, recall 1/-1429 |
