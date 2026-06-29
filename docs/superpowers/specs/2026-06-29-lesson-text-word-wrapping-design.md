# Lesson Text Word Wrapping Design

## Problem

The lesson text in `src/main.js` renders every character as its own `display: inline-block` span. Because each character is an independent box, the browser wraps lines between any two letters, splitting words in half. On Level 15 the text currently renders as:

```
a friendly ant waits near t
he roof
```

The desired behavior is whole-word wrapping:

```
a friendly ant waits near
the roof
```

## Goal

Lesson text must wrap only at word boundaries (spaces) for all 100 levels and all screen sizes, while preserving the existing per-character styling, animation, and accessibility attributes.

## Approach

Wrap each word — its letters plus the trailing space — in a non-breaking `<span class="word">` container. Characters inside the container keep their existing spans and classes.

## Changes

### `src/main.js` — `renderLessonText`

- Iterate through the lesson string and group characters into words.
- A word ends at the next space character; include that trailing space inside the same word wrapper.
- Emit `<span class="word">...</span>` around each word's character spans.
- The final word has no trailing space.
- Keep all existing per-character classes (`done`, `current`, `upcoming`, `space-char`), `data-index`, `aria-label`, and escaped display characters exactly as they are today.

### `src/styles.css`

- Add `.lesson-text .word { display: inline-block; white-space: nowrap; margin: 0; }`.
  - The `margin: 0` reset is load-bearing: the wrapper is itself a `<span>`, so the existing `.lesson-text span` rule (`min-width: 0.55em; margin: 1px; border-radius: 7px; text-align: center`) also matches it. Without the reset, every word picks up an extra 1px margin on top of its characters' margins, widening inter-word gaps. The other inherited properties are harmless on the wrapper.
- Leave the per-character `.lesson-text span` rules unchanged; the nested character spans still inherit them.
- `overflow-wrap: anywhere` on `.lesson-text` becomes dead for intra-word breaking once words are atomic boxes — leaving it is harmless (whole-word breaking does not depend on it; verified). Note the resulting trade-off: a single word wider than the scroller now overflows horizontally instead of breaking. The longest word across all 100 levels is "Celebration" (11 chars), which fits the narrowest mobile breakpoint, so this does not bite the current corpus.

## Out of Scope

- No changes to `src/levels.js` level text.
- No changes to `nextChunk`, on-screen keyboard, or stats displays.
- No changes to mobile breakpoints beyond the existing styles.
- **No change to `scrollCurrentCharacterIntoView`.** The wrappers are non-positioned `inline-block` elements, so they do not become the current character's `offsetParent` — its `offsetLeft`/`offsetTop` (and `offsetParent`) are identical before and after wrapping (verified). Auto-scroll keeps working untouched. (Separately, the current character's `offsetParent` is a `position: relative` ancestor, not the `.lesson-text-card` scroller, so today's offset math is slightly imprecise — but that is a pre-existing issue unrelated to word wrapping and out of scope here.)

## Verification

Open the game at Level 15 and confirm the text wraps between "near" and "the" instead of inside "the" or "roof". Resize the browser to the narrowest mobile width and switch to side-keyboard layout, confirming words remain intact on all line breaks and inter-word spacing is unchanged from before (catches the `.word` margin regression). Spot-check at least one level whose text is longer than the visible area to confirm auto-scroll still tracks the current character.
