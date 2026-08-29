# Crit 5 reflection

**The breakthrough** was realising the glitch tile didn't need a rule of
its own: sliding under the same movement rule as every other tile, and
clearing only through a merge, let it ride the intuition a player already
had instead of adding a second one to learn
([`7528066`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/75280663e90cd19a23359ce09ba161d0fe7742e1)).
Playtesting the logic on its own then exposed the gap in that plan: a
glitch spreading or getting purged inside a full-board redraw just looked
like tiles appearing and disappearing, with no way to tell a spread from a
plain spawn. Visual feedback wasn't a polish pass after the fact --- it had
to become part of the mechanic itself, which is why tile movement got
tracked and animated instead of redrawn
([`c9cba22`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-YanZZZZZZZZ/commit/c9cba22fe35150eac98633d1ea60798ff7c33c1d)).
Together, that turned a second mechanic from an obstacle a player has to
be told about into something they discover on their own.

**What it changed** is the order I ask design questions in: "what does the
player already know" now comes before "what's the new rule," and "can they
see it happening" comes before "does the logic handle it." I care less
about a feature being cool on its own and more about whether it slots into
rules a stranger has already picked up without a single new instruction ---
friction is the enemy, not complexity.
