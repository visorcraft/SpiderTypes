# Expand from 20 to 100 Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Itsy Bitsy Spider typing game from 20 levels to 100 levels, with a smooth difficulty curve and rooftop celebrations every 20 levels.

**Architecture:** Move all level data into a new `src/levels.js` module. Keep game logic in `src/main.js` and import `LEVELS` from the new module. Generate 80 new levels of kid-friendly, spider-themed typing text in 10-level chunks. Update the completion logic so levels 20, 40, 60, 80, and 100 trigger the rooftop celebration, with intermediate milestones offering "Next Level" and the final milestone offering "Watch Celebration."

**Tech Stack:** Vanilla JavaScript, Vite, Three.js (no framework changes).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/levels.js` | Exports the full `LEVELS` array (levels 1–100). Data only. |
| `src/main.js` | Imports `LEVELS`; contains all game logic, celebration logic, and level modal rendering. |
| `src/styles.css` | Optional minor styles for chapter separators in the level modal. |

---

## Task 1: Create `src/levels.js` and migrate levels 1–20

**Files:**
- Create: `src/levels.js`
- Modify: `src/main.js:39-160`

- [ ] **Step 1.1: Create `src/levels.js` with existing levels**

Create `src/levels.js` containing the existing 20 levels exactly as they appear in `src/main.js` lines 39–160, exported as `LEVELS`:

```js
export const LEVELS = [
  {
    id: 1,
    title: "F and J bumps",
    focus: "Rest your pointer fingers on F and J. Feel the little bumps, then type in order.",
    text: "ffff jjjj fjfj jfjf"
  },
  // ... levels 2–20 unchanged ...
];
```

- [ ] **Step 1.2: Remove levels from `src/main.js` and add import**

Replace lines 39–160 in `src/main.js` with:

```js
import { LEVELS } from "./levels.js";
```

- [ ] **Step 1.3: Verify dev server still starts**

Run: `npm run dev`
Expected: Game loads in browser without errors and levels 1–20 still play.

- [ ] **Step 1.4: Commit**

```bash
git add src/levels.js src/main.js
git commit -m "refactor: move levels 1-20 into src/levels.js"
```

---

## Task 2: Generate levels 21–100 content

**Files:**
- Modify: `src/levels.js`

Generate 80 new level objects (id 21–100). Difficulty must progress smoothly and tell one continuous, kid-friendly Itsy Bitsy Spider story. Use the following chapter outline so each 10-level chunk has a clear mini-arc:

- **21–30:** Spider wakes and starts the climb; meets a moth.
- **31–40:** Climbs higher; meets a snail; a few clouds gather.
- **41–50:** Rain begins; spider holds fast and waits it out.
- **51–60:** Sun returns; spider rests and meets a ladybug.
- **61–70:** Climbs through a leafy garden; meets a beetle.
- **71–80:** Nears the roof; meets an ant; starts a cozy web.
- **81–90:** Almost at the top; helps a friend; shares a snack.
- **91–100:** Reaches the roof; celebrates with all friends.

Length targets per level range:

| Range | Shape | Target length |
|-------|-------|---------------|
| 21–30 | 1 sentence | 45–70 chars |
| 31–40 | 1–2 sentences | 70–110 chars |
| 41–50 | 2 sentences | 110–150 chars |
| 51–60 | 2–3 sentences (short paragraph) | 150–210 chars |
| 61–70 | 1 paragraph (3–4 sentences) | 210–290 chars |
| 71–80 | 2 paragraphs | 290–390 chars |
| 81–90 | 3 paragraphs | 390–510 chars |
| 91–100 | 4 paragraphs | 510–650 chars |

- [ ] **Step 2.1: Generate chapter 21–30**

Append to `src/levels.js`:

```js
// Chapter 3: The morning climb
{
  id: 21,
  title: "Sunrise stretch",
  focus: "The spider wakes up and starts a new climb.",
  text: "the sun peeks over the old roof."
},
// ... continue through id 30
```

- [ ] **Step 2.2: Generate chapter 31–40**

Append 10 levels continuing the story toward gathering clouds.

- [ ] **Step 2.3: Generate chapter 41–50**

Append 10 levels about rain and holding on.

- [ ] **Step 2.4: Generate chapter 51–60**

Append 10 levels about sun, rest, and a ladybug.

- [ ] **Step 2.5: Generate chapter 61–70**

Append 10 levels about the garden and a beetle.

- [ ] **Step 2.6: Generate chapter 71–80**

Append 10 levels about nearing the roof and an ant.

- [ ] **Step 2.7: Generate chapter 81–90**

Append 10 levels about helping a friend and sharing a snack.

- [ ] **Step 2.8: Generate chapter 91–100**

Append 10 levels culminating in four paragraphs at level 100.

- [ ] **Step 2.9: Content review checklist**

Before proceeding, verify:
- Every level has `id`, `title`, `focus`, and `text`.
- All text uses only lowercase letters, spaces, periods, and commas (matches existing levels 1–20).
- No contractions, no complex words, no scary themes.
- Length increases overall, with level 100 containing exactly four paragraphs separated by double spaces.
- Titles and focus strings stay short enough to display in the level modal buttons.

- [ ] **Step 2.10: Commit**

```bash
git add src/levels.js
git commit -m "content: add levels 21-100 with spider-themed typing text"
```

---

## Task 3: Update celebration logic for every 20th level

**Files:**
- Modify: `src/main.js:1423-1452`

- [ ] **Step 3.1: Change milestone detection in `completeLevel`**

Replace the existing branch in `completeLevel`:

```js
if (state.levelIndex < LEVELS.length - 1) {
  state.mode = "preWash";
  // ...
} else {
  startCelebration(now);
}
```

with:

```js
const levelId = currentLevel().id;
const isMilestone = levelId % 20 === 0;

if (isMilestone) {
  startCelebration(now);
} else {
  state.mode = "preWash";
  state.preWashStart = now;
  dom.feedback.className = "feedback good";
  dom.feedback.textContent = "The spider reached the top. Clouds are gathering...";
  dom.cameraCaption.textContent = "The spider reached the roof, but the rain is coming.";
}
```

- [ ] **Step 3.2: Update `showEndOverlay` call for milestones**

`showEndOverlay` currently receives a boolean `isFinal`. Keep that signature, but interpret `isFinal` as "this is the final milestone (level 100)."

In `startCelebration`, call:

```js
const isFinalMilestone = currentLevel().id === 100;
showEndOverlay(isFinalMilestone);
```

- [ ] **Step 3.3: Verify overlay text still makes sense**

Ensure `showEndOverlay` kicker/title/message still reads well for both intermediate and final milestones. For intermediate milestones the existing "Celebration!" kicker and "The spider finally made it!" title are acceptable; the message can remain the same.

- [ ] **Step 3.4: Verify `nextButton` behavior**

The existing `dom.nextButton` listener already handles both cases:
- Final level (index `LEVELS.length - 1`): hides overlay.
- Otherwise: advances to next level.

Because level 100 is now the last index, this still works. No change needed.

- [ ] **Step 3.5: Test milestone transitions**

Run `npm run dev` and use the level modal to jump to level 19. Complete level 20 and confirm:
- Celebration animation starts.
- Overlay button says "Next Level."
- Clicking it advances to level 21.

Repeat spot-checks for levels 39→40→41, 59→60→61, 79→80→81.

- [ ] **Step 3.6: Commit**

```bash
git add src/main.js
git commit -m "feat: trigger rooftop celebration every 20 levels"
```

---

## Task 4: Add chapter separators to the level modal

**Files:**
- Modify: `src/main.js:1687-1708`
- Modify: `src/styles.css:652-657`

- [ ] **Step 4.1: Insert a separator before each new chapter in `renderLevelModal`**

In `renderLevelModal`, before appending the button for level index `i`, check if its `id` is 21, 41, 61, or 81 and insert a chapter divider. For example:

```js
if (level.id > 20 && (level.id - 1) % 20 === 0) {
  const divider = document.createElement("div");
  divider.className = "level-chapter-divider";
  divider.style.gridColumn = "1 / -1";
  divider.innerHTML = `<span>Chapter ${Math.floor((level.id - 1) / 20) + 1}</span>`;
  dom.levelGrid.appendChild(divider);
}
```

- [ ] **Step 4.2: Style the divider**

Add to `src/styles.css`:

```css
.level-chapter-divider {
  margin: 6px 0;
  padding: 8px 0;
  border-top: 1px solid var(--line);
  color: var(--accent-2);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 4.3: Verify modal rendering**

Open the level modal and confirm:
- All 100 buttons render.
- Dividers appear between chapters.
- Scroll still works smoothly.

- [ ] **Step 4.4: Commit**

```bash
git add src/main.js src/styles.css
git commit -m "feat: add chapter separators to level modal"
```

---

## Task 5: Final verification

- [ ] **Step 5.1: Build the project**

Run: `npm run build`
Expected: No Vite build errors.

- [ ] **Step 5.2: Manual play-through spot checks**

Run: `npm run dev`

Check:
- Level 1 still works exactly as before.
- Level 20 celebration fires and advances to 21.
- Levels 40, 60, 80 celebrations fire and advance.
- Level 100 celebration fires and "Watch Celebration" dismisses the overlay.
- Level 100 text contains four paragraphs.
- Level modal shows all 100 levels with separators.

- [ ] **Step 5.3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: minor adjustments after 100-level verification"
```

---

## Spec coverage check

| Spec requirement | Implementing task |
|------------------|-------------------|
| 100 levels total | Task 2 |
| Move levels to separate module | Task 1 |
| Smooth length progression | Task 2 |
| Level 100 has 4 paragraphs | Task 2.8 |
| Celebration every 20 levels | Task 3 |
| Intermediate milestones show "Next Level" | Task 3.2 |
| Final milestone (100) shows "Watch Celebration" | Task 3.2 |
| Kid-friendly Itsy Bitsy Spider theme | Task 2 |
| Chapter separators in level modal | Task 4 |
| Manual verification | Task 5 |

## Placeholder scan

No TBD, TODO, or vague steps remain. Every code block contains real code or explicit content guidance.

## Type consistency check

- `LEVELS` remains an array of objects with `id`, `title`, `focus`, `text`.
- `completeLevel` uses `currentLevel().id`.
- `showEndOverlay` keeps its boolean `isFinal` parameter, now meaning "final milestone."
