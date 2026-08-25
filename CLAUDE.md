# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This week's spec (Crit 5: A game)

> build a tiny browser game --- one mechanic is usually enough --- obvious in
> ten seconds, still interesting at five minutes, no tutorial in sight

Last week's instrument had no way to be played wrong; this week that's exactly
the point. A game has rules, stakes and an ending: a player can fail, and play
finishes somewhere.

Interpret *game* as broadly as you like: an arcade loop, a puzzle, a
Twine-style narrative experience --- if it invites play, it counts. The twist
is the no-tutorial rule. Bushnell's law says the best games are easy to learn
and difficult to master; here the learning half has to happen without words.
No how-to-play modal, no instructions page, nothing in the README standing in
for either: name the game if you like, but the opening screen itself has to
make the first move obvious (*affordance* --- World 1-1 of Super Mario Bros.
is the canonical worked example), and play teaches whatever comes next. Depth
is what makes the five minutes work: one mechanic is usually enough, and two
that interact is the harder, better move if you can keep a stranger finishing
inside five minutes.

What the tutor checks:

- deployed and live at its public GitHub Pages URL by the cutoff
  (2026-09-02T12:00 Canberra)
- it can be lost: a wrong move is possible, and play ends somewhere --- a win,
  a loss or a finish
- it teaches itself: no instructions anywhere, on screen or off --- the
  opening screen invites the first move, and play teaches whatever comes next
- a stranger can pick it up and reach an ending inside five minutes
- one rule of the game has a focused automated test, and one change made came
  from playing the finished game rather than reading its code
- the repo shows the process --- commits that grew with the work, a process
  overview in `PROCESS.md`, and the week's reflection in
  `reflections/crit-5.md`
- can account for how the work with the agent was directed, grounded and
  corrected

Put one rule under a focused automated test (e.g. "a collision ends the
round"), then play the finished game at both marking viewports --- only
playing tells you whether it *feels* fair. Keep it static: no backend needed,
ships straight to GitHub Pages. The no-tutorial rule is the one thing here
that can't be put under test and can't be faked; a stranger's hands on the
keyboard settle it in about ten seconds.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
