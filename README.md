# Mosswater Isle

A single-player TypeScript game with an online PIN unlock and cloud saves. The Old Mill contains nine questions from the 60 minute recall deck. A player can check a draft, revise it, and submit a final answer for rubric-based feedback before reading the worked solution. The game saves locally in the browser.

Use the arrow keys or WASD to walk. Click open ground or a landmark to walk there. At the mill door, choose Enter mission. The hour pauses on exit or when the tab is hidden.

## Build

With Node.js and npm installed, run:

```sh
npm ci
npm run build
```

Open `docs/index.html` in a browser. Pass a filename to the build command to update an existing copy in place. Use the same file path and browser to keep your saved game.

## Source

The island is built from 32 pixel tiles, so every part of the scene shares one pixel size and can move on its own.

- `assets/map.txt` is the island: 80 rows of 60 characters, one character per tile. Edit it in any text editor and rebuild.
- `assets/world.json` lists each landmark, the tile in front of its door, and the villagers.
- `assets/tiles.png` is the tile sheet and `assets/tiles.json` records where each sprite sits on it. Both are drawn by code in `tools/`. Run `npm run tiles` to redraw them after changing that code. You can also edit the PNG by hand, as long as `npm run tiles` is not run afterwards.
- `src/tilemap.ts` reads the map into walkable tiles, landmarks and scenery. `src/world.ts` handles keyboard movement, pathfinding, door entry and older saves.
- `src/render.ts` paints three layers: moving water, the ground, and everything standing on it. Standing things are drawn from the top of the map down, so the walker passes behind treetops and in front of walls. It also runs the mill wheel, waterfall, chimney smoke, ducks, butterflies and birds.
- `assets/cards.json` contains the original prompts and solutions with offline math. `src/quiz.ts` runs the quiz, the two interactive diagrams and the notebook.

### Map characters

| Character | Tile | Walkable |
| --- | --- | --- |
| `.` | Grass | Yes |
| `,` | Path | Yes |
| `~` | Water | No |
| `#` | Rock wall | No |
| `T` `P` `B` | Oak, pine or birch forest | No |
| `t` `p` `b` | A single oak, pine or birch | No |
| `o` `r` `s` | Bush, boulder, signpost | No |
| `f` `g` | Flowers, reeds | Yes |
| `x` `c` | Fence, crop | No |
| `=` `D` | Bridge, dock (over water) | Yes |
| `H` | Stairs through a rock wall | Yes |
| `W` | Waterfall | No |
| `l` `R` | Lily pad, rock (in water) | No |

A tree also blocks the tile above it, so the walker is never fully hidden behind its crown. Edges between grass, path, water and rock are chosen automatically from the neighboring tiles.

## Play and save

The public game is served from `docs/index.html` on GitHub Pages. The whole interface uses the bundled Pixelify Sans font under the SIL Open Font License, with pixel-art frames, buttons and icons drawn in CSS and inline SVG. Formulas use native math. While the game is locked, the island shows behind the PIN prompt as a title screen. Ambient motion stops when the browser asks for reduced motion. Follow the river south from the village to Birch Highlands. Two bridges connect the library, station and grotto trails.

Five gray stars mark an unfinished mission. A completed quiz earns the nearest whole number to five times the average fraction of points earned per question (a full point for a legacy “Got it”), with a minimum of one. The notebook retains individual answers and self-checks.

The game opens with a six-digit trainer PIN for a single shared profile. The Supabase JavaScript SDK exchanges it for a random device session lasting 30 days. The database stores a bcrypt PIN verifier and hashed session tokens in a private schema. After five wrong PIN guesses the profile pauses unlock attempts for 15 minutes. A remembered browser checks its session with the server when reopening the game. The passport’s **Lock game** clears the browser token and requests server revocation. During an unlocked session, progress is cached locally and synchronized with revision checks.

Provisioning uses the SQL migrations in order. Configure the PIN verifier privately in the project’s SQL editor. Keep the PIN, verifier, and device tokens outside version control. The second migration can carry forward one previous email-account save and stops if it finds multiple saves.

## Publish a scheduled mission

Install the pinned dependencies with `npm ci`. Create `missions/YYYY-MM-DD.json` with a unique date on the two-day schedule beginning November 27, 2026. Each mission has a name and a cards array. Each card has a stable numeric id, a title, a front, and a back. Use standalone math and safe HTML or MathML. Publish only question and solution content. Keep private notes, source links and learner attempts outside the repository.

Run `npm run build` to generate the GitHub Pages site. Commit the new pack and rebuilt site together. A dated mission opens at 9 a.m. Pacific once its pack has been published. Previously completed missions keep their original dates and scores.

## Old Mill answer checking

Apply `supabase/003_grading.sql` after the PIN migration, deploy the `grade-answer` function using the supplied configuration, and set `OPENAI_API_KEY` in the project’s function secrets. The function verifies the active PIN session and permits 12 checks per minute and 150 per UTC day for the single player. Each AI check sends only the current answer and its grading guide to OpenAI. A few exact short answers are checked on-device. If grading is unavailable, the player may retry or explicitly reveal the solution for a self-check.
