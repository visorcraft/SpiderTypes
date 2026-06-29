# Design: Expand from 20 to 100 Levels

## Overview
Expand the Itsy Bitsy Spider typing game from 20 levels to 100 levels. The difficulty progresses from single sentences to four paragraphs. Every 20 levels, the player reaches the rooftop and sees the Celebration party. Levels 21–100 tell one continuous, kid-friendly story about the spider climbing the water spout to visit friends.

## Approach
Move the level data out of `src/main.js` into a dedicated `src/levels.js` module that exports the full 100-level `LEVELS` array. Keep all game logic in `src/main.js` and import the levels from the new module.

## File structure
- `src/levels.js` — new file; exports `LEVELS` (levels 1–100, data only).
- `src/main.js` — imports `LEVELS` from `./levels.js`; all game logic remains here.

## Level progression
Levels 21–100 are grouped into 8 chapters of 10 levels. Length grows smoothly:

| Range | Shape | Approx. length |
|-------|-------|----------------|
| 21–30 | 1 sentence | 45–70 chars |
| 31–40 | 1 longer sentence or 2 short sentences | 70–110 chars |
| 41–50 | 2 sentences | 110–150 chars |
| 51–60 | 2–3 sentences (short paragraph) | 150–210 chars |
| 61–70 | 1 paragraph, 3–4 sentences | 210–290 chars |
| 71–80 | 2 paragraphs | 290–390 chars |
| 81–90 | 3 paragraphs | 390–510 chars |
| 91–100 | 4 paragraphs | 510–650 chars |

Each level object keeps the existing shape:
```js
{
  id: 21,
  title: "...",
  focus: "...",
  text: "..."
}
```

### Content theme
All sentences and paragraphs are kid-friendly and center on the Itsy Bitsy Spider climbing the water spout to see friends. The story includes friendly bugs (moth, snail, ant, ladybug, beetle), rain, sunshine, rest stops, and a final rooftop celebration.

## Celebration logic
- A level is a milestone when `level.id % 20 === 0` (20, 40, 60, 80, 100).
- On completing any milestone, call `startCelebration(now)`.
- For milestones 20, 40, 60, 80: call `showEndOverlay(false)` so the button reads **“Next Level”** and advances to the next level when clicked.
- For milestone 100: call `showEndOverlay(true)` so the button reads **“Watch Celebration”** and dismisses the overlay.
- Non-milestone levels keep the existing pre-wash / completion flow.
- No changes to the celebration animation, fireworks, or music.

## Level selection UI
The existing level modal grid already scrolls, so it can hold 100 buttons. Add a visual separator every 20 levels to mark chapters and make long scrolling friendlier for kids.

## Testing & verification
There is no automated test suite. Verify by:
1. Running `npm run dev`.
2. Opening the level modal and confirming all 100 levels appear.
3. Completing levels 20, 40, 60, 80, and 100 to confirm celebrations fire.
4. Confirming intermediate milestones show “Next Level” and advance.
5. Spot-checking levels across the curve for length, readability, and kid-friendly tone.
