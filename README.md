# Mosswater Isle

A single-player, offline TypeScript game. The Old Mill contains nine questions from the 60 minute recall deck. A player writes an answer, reads the worked solution and records a self-check. The game saves locally in the browser.

Use the arrow keys or WASD to walk. Click a path or a landmark to walk there. At the mill door, choose Enter mission. The hour pauses on exit or when the tab is hidden.

## Build

With Node.js and npm installed, run:

```sh
npm ci
npm run build
```

Open `docs/index.html` in a browser. Pass a filename to the build command to update an existing copy in place. Use the same file path and browser to keep your saved game.

## Source

- `assets/world.json` holds the five-pixel navigation grid, building bounds, doors and map labels. Coordinates refer to the 960 by 640 map.
- `src/world.ts` handles keyboard movement, pathfinding, door entry and compatibility with previous saves.
- `src/trainer.ts` draws the four-color directional trainer frames. `src/water.ts` animates the river, falls and paddle wheel.
- `assets/cards.json` contains the original prompts and solutions with offline math. `src/quiz.ts` runs the quiz, the two interactive diagrams and the notebook.

## Play and save

The public game is served from `docs/index.html` on GitHub Pages. The map uses the bundled Pixelify Sans font under the SIL Open Font License. The question panel uses system reading fonts and native math. The southern trail connects the original village to Birch Highlands.

Five gray stars mark an unfinished mission. A completed quiz earns the nearest whole number to five times the fraction marked “Got it”, with a minimum of one. The notebook retains individual answers and self-checks.

The Supabase JavaScript SDK supports the project’s default one-time sign-in links and optional numeric email codes. Hosted links return to the game. To transfer offline progress, request an email from the local game and paste the original link there. To provision a project, run `supabase/001_game_saves.sql` in its SQL editor, enable email authentication, and allow the exact hosted return URL. For numeric codes, include `{{ .Token }}` in the Magic Link and Confirm signup email templates. Keep any existing links used by other applications. The public client uses the project's publishable key. Database policies restrict each row to its signed-in owner. When two devices change a save independently, the passport asks which copy to keep.

## Publish a scheduled mission

Install the pinned dependencies with `npm ci`. Create `missions/YYYY-MM-DD.json` with a unique date on the two-day schedule beginning November 27, 2026. Each mission has a name and a cards array. Each card has a stable numeric id, a title, a front, and a back. Use standalone math and safe HTML or MathML. Publish only question and solution content. Keep private notes, source links and learner attempts outside the repository.

Run `npm run build` to generate the GitHub Pages site. Commit the new pack and rebuilt site together. A dated mission opens at 9 a.m. Pacific once its pack has been published. Previously completed missions keep their original dates and scores.
