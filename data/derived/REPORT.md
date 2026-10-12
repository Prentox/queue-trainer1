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
