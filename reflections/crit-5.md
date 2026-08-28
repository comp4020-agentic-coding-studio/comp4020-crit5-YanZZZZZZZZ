# Crit 5 reflection

**The breakthrough** was realising the no-tutorial rule isn't a writing
constraint, it's a design one: the game has to argue for itself through
motion and stakes, not prose. That reframed the idle nudge from "a nice
animation" into the actual mechanism doing the job a tutorial would have
done --- and it's why the merge/game-over/win rules got written as tests
([`5df29e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/5df29e1b379ccc8b51ac7b687cf7cf2cbc48bfe6))
before any pixel existed: if the rules aren't pinned down as contracts, the
"obvious first move" the spec demands has nothing solid underneath it. The
second breakthrough was smaller and later: actually losing the game with
just a keyboard, which is the only way I found that `Tab` reached the home
link before the replay button
([`3430094`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/3430094d007c4be8dd1d8e322c40a19173b04420)).
No amount of reading `main.ts` would have surfaced that; only sitting in the
losing state and trying to get back in did.

**What it changed** is how much I trust "it typechecks and the tests are
green" as a finish line. Both checks stayed green the entire time the replay
button was unreachable by keyboard --- correctness and playability turned out
to be different questions, and only one of them has a test suite that can
ask it for you. I want to be the kind of developer who treats "I opened it
and used it" as a separate, non-optional step from "the suite passed," not a
nice-to-have that gets skipped when the checks are already green. The nudge
animation taught the adjacent lesson: a rule you can't put under a test
(here, teaching yourself with no words) still deserves the same deliberate
design attention as the rules that can be.
