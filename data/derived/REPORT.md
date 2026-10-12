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

**Engine check:** 41143 moments (plus 10125 where the engine's answer, such as clearing a wave or farming, cannot be read from the data). The engine's answer was what the team did in 30% of them. When the team did the engine's answer: +284 gold on average; otherwise +276. Where the data has a clear best action (36324 moments), the engine picked it 10% of the time.

| Engine answer | Engine said it | Team did it | Gold swing when they did | When they did something else |
| --- | --- | --- | --- | --- |
| take | 5457 | 1582 | +473 | +518 |
| setup | 9538 | 2329 | +414 | +603 |
| trade | 9707 | 80 | -339 | -453 |
| push | 8032 | 1171 | +961 | +874 |
| defend | 742 | 252 | -1110 | -252 |
| split | 7667 | 7049 | +143 | +96 |

**Best measured action per situation** (players up or down | objective | gold; used as the app's answer when it is clear):

| Situation | Moments | Best action | Its gold swing | Everything else | All actions (moments, avg gold swing) |
| --- | --- | --- | --- | --- | --- |
| even · none · ahead | 9282 | recall | +909 | +616 | recall 52/+909, push 1765/+666, split 7294/+620, defend 171/-50 |
| even · none · even | 9026 | push | +485 | +44 | push 656/+485, recall 58/+226, split 8068/+62, defend 244/-610 |
| even · none · behind | 8121 | push | +392 | -552 | push 388/+392, recall 77/-73, split 6583/-510, defend 1073/-841 |
| up · none · ahead | 3094 | – | – | – | defend 77/+1297, split 2376/+1274, push 620/+1088, recall 21/+971 |
| even · up · even | 3055 | trade | +399 | +42 | trade 58/+399, take 874/+154, push 49/+138, split 2004/+4, recall 15/-58, defend 55/-425 |
| even · up · ahead | 2756 | trade | +781 | +628 | recall 21/+1669, trade 154/+781, split 1608/+697, take 759/+521, push 174/+516, defend 40/-167 |
| even · soon · ahead | 2633 | split | +708 | +410 | recall 12/+722, split 1174/+708, trade 160/+547, push 228/+462, setup 1006/+380, defend 53/+280 |
| even · up · behind | 2477 | take | -173 | -648 | push 32/+823, take 568/-173, trade 51/-226, defend 210/-680, split 1589/-682, recall 27/-949 |
| even · soon · behind | 2401 | push | +478 | -367 | push 61/+478, setup 748/+88, trade 50/-433, recall 26/-445, split 1249/-577, defend 267/-638 |
| even · soon · even | 2233 | push | +351 | +60 | recall 8/+497, push 72/+351, trade 44/+293, setup 910/+135, split 1155/+31, defend 44/-1054 |
| up · none · even | 1390 | push | +1130 | +686 | defend 37/+1235, push 117/+1130, recall 10/+875, split 1226/+668 |
| up · up · ahead | 1031 | split | +1330 | +1083 | recall 8/+2609, split 602/+1330, take 244/+1266, defend 26/+943, push 59/+928, trade 92/+605 |
| up · soon · ahead | 872 | split | +1246 | +997 | recall 4/+1588, split 390/+1246, push 81/+1231, setup 294/+1141, defend 20/+959, trade 83/+237 |
| up · none · behind | 853 | push | +1270 | +487 | push 92/+1270, recall 15/+547, split 668/+519, defend 78/+201 |
| up · up · even | 544 | – | – | – | push 27/+1350, defend 17/+1095, take 176/+947, split 305/+844, trade 16/+616, recall 3/+119 |
| up · soon · even | 390 | – | – | – | recall 2/+2470, push 19/+1549, trade 10/+1108, setup 170/+843, split 168/+625, defend 21/+523 |
| up · soon · behind | 319 | setup | +949 | +587 | push 10/+1430, setup 133/+949, defend 32/+750, split 132/+537, trade 11/+136, recall 1/-1429 |
| up · up · behind | 300 | – | – | – | push 15/+1816, trade 9/+1326, take 105/+888, split 138/+879, defend 24/+682, recall 9/+494 |
| down · none · behind | 162 | – | – | – | recall 14/-14, push 26/-365, defend 122/-1145 |
| down · soon · behind | 73 | – | – | – | push 2/+1137, recall 4/+850, setup 24/-83, defend 43/-848 |
| down · none · ahead | 59 | – | – | – | push 49/+434, defend 9/-840, recall 1/-917 |
| down · up · behind | 52 | – | – | – | trade 3/-1084, take 21/-1170, defend 23/-1335, recall 3/-1403, push 2/-2337 |
| down · soon · ahead | 42 | – | – | – | trade 5/-249, setup 26/-465, push 6/-1177, defend 5/-2207 |
| down · none · even | 36 | – | – | – | push 22/-539, defend 14/-1172 |
| down · soon · even | 25 | – | – | – | setup 18/-486, push 3/-500, trade 2/-3138, defend 2/-3228 |
| down · up · ahead | 22 | – | – | – | trade 3/+183, take 14/-127, push 4/-2367, defend 1/-3236 |
| down · up · even | 20 | – | – | – | defend 5/-350, take 12/-691, trade 1/-1631, push 2/-2156 |
