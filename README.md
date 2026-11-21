# spot-the-difference-v1

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Brackenzig/spot-the-difference-v1/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Brackenzig/spot-the-difference-v1/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Lantern Market — Spot the Difference.** Two near-identical pictures side by side; find all 7 differences in each of 6 scenes before time runs out. A night market at dusk, a harbor at dawn, a garden tea house, a moonlit pier, a festival street in daylight, and the tea garden at dusk — every scene drawn from scratch on canvas, no copied art, no network requests. 42 differences in all.

## How it plays

- Click a difference in either picture to ring it. A wrong click costs 3 seconds.
- **H** spends one of 3 hints per scene: it rings an unfound difference for a moment.
- **M** toggles the magnifier: a 2x lens follows the pointer over either picture, for the small details.
- Each scene has its own clock (180s, 150s, 120s, 120s, 110s, 100s). Clear a scene for a time bonus plus a bonus for every unused hint.
- **N** moves to the next scene, **R** restarts. Your best score is kept in the browser.

## The differences

- **Night Market:** a red lantern turns green · the cat is gone · a third bird on the wire · the vendor's hat changes colour · oranges become apples · the bicycle moves · a string-light bulb goes dark.
- **Harbor Dawn:** the fishing boat's flag turns yellow · a seagull is gone · a second buoy appears · the lighthouse light goes out · the jumping fish moves · a cloud gains a puff · a crate vanishes from the pier.
- **Garden Tea House:** a cherry blossom turns white · the stone lantern loses its cap · a koi turns white · the teacup moves across the table · a second butterfly appears · a bamboo stalk is shorter · a stepping stone is gone.
- **Moonlit Pier:** the fishing boat's flag turns yellow · a seagull is gone · a second buoy appears · the lighthouse light goes out · the jumping fish moves · the moon's shadow shifts · the second boat's hull changes colour.
- **Festival Street:** a red lantern turns green · the sign changes words · fewer oranges in the basket · the bicycle moves · a third bird on the wire · the cat is gone · the dog changes colour.
- **Tea Garden Dusk:** the tea house roof changes colour · a cherry blossom turns white · a flower changes colour · a second butterfly appears · a koi turns white · a stepping stone is gone · the teacup moves across the table.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` (an `index.html` and ES modules, no library). `main.ts` hands it in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=atc4awx9&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
