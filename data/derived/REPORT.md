# Match data report

1500 EUW Challenger/Grandmaster solo-queue matches · patches 16.18, 16.19, 16.20.

Champions in the data that are missing from champions.txt: Zaahen, Locke.

## Draft rules vs real results

| Rule | Win rate when true | Win rate otherwise | Difference | Games (true / otherwise) |
| --- | --- | --- | --- | --- |
| 2+ frontliners | 48% | 51% | -3.1 pts | 814 / 1738 |
| 2+ engage champions | 50% | 50% | +0.5 pts | 1903 / 649 |
| Magic damage 20-80% | 50% | 47% | +2.9 pts | 2518 / 34 |
| At least one top-damage champion | 50% | 52% | -2.4 pts | 2531 / 21 |
| Fewer than 2 split pushers | 50% | 50% | 0 pts | 2252 / 300 |
| 4+ champions share one plan (teamfight or pick) | 50% | 50% | -0.6 pts | 706 / 1846 |
| vs squishy team: 3+ engage/burst champions | 52% | 46% | +6.8 pts | 484 / 134 |
| Late carry with a peeler (teams with a late carry) | 51% | 48% | +2.2 pts | 1636 / 353 |
| vs heavy engage: 2+ peel/disengage champions | 52% | 48% | +3.3 pts | 649 / 296 |
| vs teamfight comp: disengage or a split pusher | 50% | 51% | -0.9 pts | 345 / 253 |
| vs split pushers: 3+ waveclear champions | 47% | 54% | -7 pts | 180 / 120 |
| vs tanky team: 2+ sustained-damage carries | 45% | 50% | -4.8 pts | 62 / 76 |

## Lane rules vs real results

| Lane rule | Win rate when it applies | Games |
| --- | --- | --- |
| laneRange | 50% | 501 |
| laneEarly | 43% | 419 |
| laneBurst | 50% | 640 |
| laneTank | 54% | 183 |
| laneBully | 57% | 72 |
| laneSide | 50% | 345 |

Champion-vs-champion matchups with 10+ games: 68.

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
| Yone | 301 | AD share | 0.5 | 0.82 |
| Yone | 301 | frontline | 1 | 4 |
| Yone | 301 | engage/peel (CC) | 4 | 2 |
| Irelia | 118 | AD share | 1 | 0.75 |
| Irelia | 118 | frontline | 2 | 5 |
| Irelia | 118 | engage/peel (CC) | 4 | 2 |
| Renata Glasc | 79 | AD share | 0 | 0.26 |
| Renata Glasc | 79 | frontline | 1 | 3 |
| Renata Glasc | 79 | engage/peel (CC) | 5 | 3 |
| Jax | 76 | frontline | 2 | 4 |
| Jax | 76 | engage/peel (CC) | 4 | 2 |
| Jax | 76 | damage | 5 | 3 |
| Shaco | 58 | AD share | 0.8 | 0.26 |
| Shaco | 58 | engage/peel (CC) | 1 | 4 |
| Shaco | 58 | damage | 5 | 3 |
| Sylas | 266 | frontline | 2 | 4 |
| Sylas | 266 | damage | 5 | 3 |
| Lee Sin | 258 | frontline | 2 | 5 |
| Lee Sin | 258 | damage | 4 | 2 |
| Qiyana | 211 | frontline | 1 | 3 |
| Qiyana | 211 | engage/peel (CC) | 5 | 2 |
| Bard | 199 | AD share | 0.1 | 0.36 |
| Bard | 199 | frontline | 1 | 3 |
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
| Rakan | 111 | AD share | 0 | 0.25 |
| Rakan | 111 | frontline | 1 | 3 |
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
| Nidalee | 79 | frontline | 1 | 3 |
| Nidalee | 79 | damage | 5 | 3 |
| Varus | 74 | AD share | 0.8 | 0.51 |
| Varus | 74 | frontline | 1 | 3 |
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
| Shyvana | 53 | AD share | 0.3 | 0.56 |
| Shyvana | 53 | damage | 5 | 2 |
| Corki | 50 | AD share | 0.5 | 0.76 |
| Corki | 50 | frontline | 1 | 3 |
| Rumble | 47 | frontline | 2 | 4 |
| Rumble | 47 | engage/peel (CC) | 4 | 2 |
| Tryndamere | 43 | frontline | 1 | 5 |
| Tryndamere | 43 | damage | 5 | 3 |
| Yorick | 41 | AD share | 1 | 0.7 |
| Yorick | 41 | damage | 5 | 3 |
| Kindred | 33 | frontline | 1 | 3 |
| Kindred | 33 | engage/peel (CC) | 4 | 2 |
| Kassadin | 30 | frontline | 1 | 4 |
| Kassadin | 30 | damage | 5 | 3 |
| Syndra | 255 | engage/peel (CC) | 2 | 5 |
| Jhin | 248 | engage/peel (CC) | 2 | 4 |
| Yunara | 242 | AD share | 1 | 0.66 |
| Jayce | 238 | frontline | 1 | 3 |
| Camille | 205 | frontline | 2 | 4 |
| Kalista | 191 | frontline | 1 | 3 |
| Ahri | 164 | engage/peel (CC) | 4 | 2 |
| Akali | 150 | frontline | 1 | 3 |
| Ambessa | 148 | engage/peel (CC) | 4 | 1 |
| Zeri | 143 | frontline | 1 | 3 |
| Graves | 120 | engage/peel (CC) | 1 | 3 |
| Viego | 113 | frontline | 2 | 4 |
| Galio | 111 | damage | 4 | 2 |
| Olaf | 109 | damage | 5 | 3 |
| Zoe | 108 | engage/peel (CC) | 2 | 5 |
| Pyke | 103 | damage | 5 | 1 |
| Gangplank | 98 | frontline | 1 | 3 |
| Sion | 95 | AD share | 1 | 0.63 |
| Kog'Maw | 94 | AD share | 0.5 | 0.22 |
| Renekton | 93 | damage | 4 | 2 |
| Senna | 90 | damage | 5 | 2 |
| Katarina | 87 | frontline | 1 | 3 |

## Decision making vs real results

Real moments (after a kill, around objective spawns, and once a minute), what the team did in the next 90 seconds, and its gold swing over the next 2 minutes. Split and grouping are read from positions that exist once a minute, so they are estimates.

**Engine check:** 50696 moments. The engine's answer was what the team did in 26% of them. When the team did the engine's answer: +467 gold on average; otherwise +196. Where the data has a clear best action (49151 moments), the engine picked it 15% of the time.

| Engine answer | Engine said it | Team did it | Gold swing when they did | When they did something else |
| --- | --- | --- | --- | --- |
| take | 5813 | 3432 | +833 | +146 |
| setup | 17480 | 619 | -503 | +475 |
| trade | 10846 | 880 | -331 | -371 |
| push | 7972 | 4151 | +1163 | +653 |
| defend | 2682 | 201 | -1141 | -297 |
| split | 5903 | 3992 | -165 | +475 |

**Best measured action per situation** (players up or down | objective | gold; used as the app's answer when it is clear):

| Situation | Moments | Best action | Its gold swing | Everything else | All actions (moments, avg gold swing) |
| --- | --- | --- | --- | --- | --- |
| even · none · ahead | 8615 | push | +919 | +178 | push 5271/+919, recall 28/+655, split 3153/+217, defend 97/-495, trade 66/-914 |
| even · none · even | 8411 | push | +569 | -150 | push 2961/+569, split 5169/-116, recall 34/-665, defend 164/-696, trade 83/-1007 |
| even · none · behind | 7550 | push | +276 | -712 | push 2126/+276, recall 62/-8, split 4341/-684, trade 219/-732, defend 802/-912 |
| up · none · ahead | 2941 | push | +1383 | +884 | recall 7/+1519, push 2159/+1383, split 735/+931, defend 23/+620, trade 17/-1030 |
| even · up · even | 2812 | push | +951 | +104 | push 102/+951, take 1264/+475, recall 7/+219, trade 261/-43, split 1158/-261, defend 20/-380 |
| even · up · ahead | 2765 | push | +1139 | +673 | push 248/+1139, take 1784/+844, split 516/+360, trade 196/+135, recall 3/-824, defend 18/-1136 |
| even · soon · ahead | 2754 | take | +840 | +72 | take 1635/+840, push 414/+773, split 241/+34, trade 228/-149, recall 2/-677, setup 222/-892, defend 12/-1180 |
| even · soon · behind | 2317 | take | +694 | -535 | take 554/+694, push 151/+360, trade 345/-180, setup 328/-542, split 740/-771, recall 17/-894, defend 182/-941 |
| even · up · behind | 2279 | push | +431 | -435 | push 81/+431, take 612/+392, trade 301/-319, split 1135/-834, defend 138/-950, recall 12/-1913 |
| even · soon · even | 2267 | push | +705 | +66 | push 151/+705, take 936/+577, trade 274/-122, setup 318/-346, split 556/-363, recall 4/-1556, defend 28/-1763 |
| up · none · even | 1312 | push | +1121 | +396 | push 662/+1121, defend 14/+873, split 617/+390, recall 6/+318, trade 13/+211 |
| up · up · ahead | 1034 | push | +1688 | +1180 | push 94/+1688, take 805/+1298, split 106/+677, recall 1/+658, trade 28/-285 |
| up · soon · ahead | 873 | take | +1348 | +466 | take 592/+1348, push 162/+886, split 48/+222, defend 1/-34, setup 34/-250, trade 36/-410 |
| up · none · behind | 814 | push | +1217 | +187 | push 364/+1217, split 362/+246, recall 8/+178, defend 56/+40, trade 24/-358 |
| down · none · behind | 621 | push | -268 | -1165 | recall 11/+224, push 408/-268, defend 99/-1181, trade 103/-1297 |
| up · up · even | 554 | take | +1092 | +549 | take 413/+1092, push 15/+999, trade 23/+549, split 99/+518, defend 4/-379 |
| up · soon · even | 397 | – | – | – | take 249/+1174, push 29/+674, trade 37/+577, split 44/+547, setup 36/-239, defend 2/-2953 |
| down · none · even | 349 | – | – | – | push 303/-101, trade 37/-534, defend 9/-1075 |
| down · none · ahead | 322 | – | – | – | push 290/-82, defend 7/-1261, trade 25/-1461 |
| up · up · behind | 316 | take | +1442 | +574 | push 22/+1572, take 209/+1442, trade 24/+681, split 54/+230, defend 7/-283 |
| up · soon · behind | 295 | take | +1501 | +270 | take 135/+1501, trade 28/+975, push 28/+637, defend 15/+470, setup 32/-101, split 57/-102 |
| down · soon · behind | 261 | take | +346 | -490 | recall 2/+2418, take 80/+346, push 37/+250, trade 94/-661, defend 35/-711, setup 13/-1207 |
| down · up · behind | 202 | take | +200 | -900 | take 57/+200, trade 115/-756, recall 3/-1403, defend 20/-1406, push 7/-1595 |
| down · up · even | 162 | – | – | – | take 85/-425, trade 69/-486, defend 4/-672, push 4/-976 |
| down · soon · ahead | 161 | – | – | – | push 19/+633, take 102/-289, trade 25/-1519, defend 4/-1615, setup 11/-1839 |
| down · soon · even | 158 | take | -180 | -673 | push 10/+373, take 92/-180, trade 50/-722, setup 4/-1395, defend 2/-3228 |
| down · up · ahead | 154 | – | – | – | take 91/-221, push 17/-688, trade 45/-749, defend 1/-3236 |
