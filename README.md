# Mosswater Isle

A single-player, offline TypeScript game. The Old Mill contains nine questions from the 60 minute recall deck. A player writes an answer, reads the worked solution and records a self-check. The game saves locally in the browser.

Use the arrow keys or WASD to walk. Click a path or a landmark to walk there. At the mill door, choose Enter mission. The hour pauses on exit or when the tab is hidden.

## Build

With Node.js and the TypeScript compiler (`tsc`) on your path, run:

```sh
node build.mjs
```

Open `.build/Mosswater Isle.html` in a browser. Pass a filename to the build command to update an existing copy in place. Use the same file path and browser to keep your saved game.

## Source

- `assets/world.json` holds the five-pixel navigation grid, building bounds, doors and map labels. Coordinates refer to the 960 by 640 map.
- `src/world.ts` handles keyboard movement, pathfinding, door entry and compatibility with previous saves.
- `src/trainer.ts` draws the four-color directional trainer frames. `src/water.ts` animates the river, falls and paddle wheel.
- `assets/cards.json` contains the original prompts and solutions with offline math. `src/quiz.ts` runs the quiz, the two interactive diagrams and the notebook.
