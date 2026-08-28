# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A 4x4 sliding-tile 2048 clone: arrow keys or a swipe slide every tile one
direction, equal tiles merge and double, and a new tile spawns after every
move that actually moved something. The board opens with two tiles and no
text telling you what to do; if you sit still for a moment it nudges itself,
inviting the first press. The round ends the same way the real game does ---
reach 2048 and you've won, run out of empty cells and matching neighbours and
you've lost --- either way an overlay appears with one button to try again.

## The moments that mattered

1. **Tests before the board existed.** The obvious path was to write
   `game.ts` and eyeball it in the browser until it looked right. Instead the
   merge, game-over and win rules got a failing spec first, against a module
   that didn't exist yet, so "done" meant the rules held rather than "the
   board looked fine when I poked it." Ran red, then green one rule at a
   time.
   [`5df29e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/5df29e1b379ccc8b51ac7b687cf7cf2cbc48bfe6)
   →
   [`6937bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/6937bf08943bde6a3ea573df7303f9be533105f1)

2. **No instructions modal, a nudge instead.** The spec rules out any
   how-to-play text, on screen or off. Rather than lean on the title "2048"
   to carry the mechanic, the board waits ~1.8s of no input and gives itself
   a small shake --- a physical hint at "these things slide" that a stranger
   reads with their eyes, not by parsing a sentence. `prefers-reduced-motion`
   turns it off for anyone it'd bother instead.
   [`1126732`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/1126732b4cbbfaf043c9e64511c6ce2a1feb6771)

3. **A bug only playing surfaced.** Reading `main.ts` gave no reason to
   doubt the replay flow --- the button was there, wired to a click handler,
   done. Actually losing the game with only a keyboard (no mouse) showed the
   real behaviour: the first `Tab` after game-over landed on the header's
   "2048" home link, not the pulsing replay button, and pressing `Enter`
   there reloaded the page instead of calling the game's own restart. Fixed
   by focusing the replay button the instant the game ends, so `Enter` works
   immediately with no `Tab` required. Verified with a headless-Chromium
   keyboard-only run: game ends → `document.activeElement` is `#replay` →
   one `Enter` clears the overlay and resets the score, no `Tab` at all.
   [`3430094`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/3430094d007c4be8dd1d8e322c40a19173b04420)

4. **Pure logic, dumb rendering.** `game.ts` knows nothing about the DOM ---
   `move`, `spawnTile`, `isGameOver` and `hasWon` are plain functions over a
   `number[][]`, with randomness injectable for tests. `main.ts` only reads
   that board and paints tiles. That split is why moment 1 was possible at
   all: the rules could be asserted without a page to render them onto.
   [`6937bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/6937bf08943bde6a3ea573df7303f9be533105f1)

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that a
reflection entry the marker reads is in `reflections/`, and that your
`CLAUDE.md` is there --- before a marker ever opens the file. It checks that
your map is traceable, not that it is good: the marker judges whether your
small, deliberately chosen set of moments shows real judgement and reflection. A
green check is not a substitute for that curation.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
