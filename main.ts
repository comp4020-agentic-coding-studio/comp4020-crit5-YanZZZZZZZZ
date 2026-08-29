import {
  emptyBoard,
  GLITCH,
  hasWon,
  isGameOver,
  move,
  spawnTile,
  spreadGlitches,
  type Board,
  type Direction,
} from "./game.ts";

const MOVE_MS = 100;
const PURGE_MS = 200;
const GLITCH_INTRODUCE_AFTER_MOVES = 3;

const boardEl = document.getElementById("board") as HTMLDivElement;
const scoreEl = document.getElementById("score") as HTMLParagraphElement;
const overlayEl = document.getElementById("overlay") as HTMLDivElement;
const replayEl = document.getElementById("replay") as HTMLButtonElement;

document.documentElement.style.setProperty("--move-ms", `${MOVE_MS}ms`);

for (let i = 0; i < 16; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  boardEl.appendChild(cell);
}
const tilesEl = document.createElement("div");
tilesEl.id = "tiles";
boardEl.appendChild(tilesEl);

interface LiveTile {
  el: HTMLDivElement;
  value: number;
}

let board: Board = emptyBoard();
let score = 0;
let ended = false;
let animating = false;
let movesMade = 0;
let inviteTimer: number | undefined;
let liveTiles = new Map<string, LiveTile>();

const keyOf = (r: number, c: number) => `${r},${c}`;

// Alternates axes each cycle so idle play previews both "push sideways" and
// "push up/down" --- a literal rehearsal of the slide, not just a flourish.
let inviteAxis: "x" | "y" = "x";

function scheduleInvite() {
  window.clearTimeout(inviteTimer);
  inviteTimer = window.setTimeout(() => {
    boardEl.classList.remove("invite-x", "invite-y");
    void boardEl.offsetWidth; // restart the animation
    boardEl.classList.add(inviteAxis === "x" ? "invite-x" : "invite-y");
    inviteAxis = inviteAxis === "x" ? "y" : "x";
    scheduleInvite();
  }, 1800);
}

function cancelInvite() {
  window.clearTimeout(inviteTimer);
  boardEl.classList.remove("invite-x", "invite-y");
}

function metrics(): { cell: number; gap: number } {
  const gap = parseFloat(getComputedStyle(boardEl).columnGap) || 8;
  const cell = (tilesEl.clientWidth - gap * 3) / 4;
  return { cell, gap };
}

function placeTile(el: HTMLDivElement, r: number, c: number, cell: number, gap: number) {
  el.style.width = `${cell}px`;
  el.style.height = `${cell}px`;
  el.style.left = `${c * (cell + gap)}px`;
  el.style.top = `${r * (cell + gap)}px`;
}

function createTileEl(
  value: number,
  r: number,
  c: number,
  cell: number,
  gap: number,
  animationClass: string,
): HTMLDivElement {
  const el = document.createElement("div");
  if (value === GLITCH) {
    el.className = `tile glitch ${animationClass}`;
    el.textContent = "✕";
  } else {
    el.className = `tile ${animationClass}`;
    el.dataset.value = String(value);
    el.textContent = String(value);
  }
  placeTile(el, r, c, cell, gap);
  tilesEl.appendChild(el);
  return el;
}

function spawnNewTile(before: Board, after: Board, cell: number, gap: number) {
  after.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== 0 && before[r][c] === 0) {
        const el = createTileEl(value, r, c, cell, gap, "materialize");
        liveTiles.set(keyOf(r, c), { el, value });
      }
    }),
  );
}

function repositionAll() {
  const { cell, gap } = metrics();
  for (const [key, tile] of liveTiles) {
    const [r, c] = key.split(",").map(Number);
    placeTile(tile.el, r, c, cell, gap);
  }
}

function newGame() {
  tilesEl.innerHTML = "";
  liveTiles = new Map();
  board = emptyBoard();
  score = 0;
  ended = false;
  animating = false;
  movesMade = 0;
  overlayEl.hidden = true;
  overlayEl.classList.remove("won", "lost");
  scoreEl.textContent = "0";

  const { cell, gap } = metrics();
  const withOne = spawnTile(board);
  spawnNewTile(board, withOne, cell, gap);
  board = withOne;
  const withTwo = spawnTile(board);
  spawnNewTile(board, withTwo, cell, gap);
  board = withTwo;

  scheduleInvite();
}

function attemptMove(direction: Direction) {
  if (ended || animating) return;
  const result = move(board, direction);
  if (!result.moved) return;
  animating = true;
  cancelInvite();

  const { cell, gap } = metrics();
  const mergeGroups = new Map<string, { el: HTMLDivElement; value: number }[]>();
  const nextLiveTiles = new Map<string, LiveTile>();

  for (const tm of result.tileMoves) {
    const live = liveTiles.get(keyOf(tm.from[0], tm.from[1]));
    if (!live) continue;
    placeTile(live.el, tm.to[0], tm.to[1], cell, gap);
    const destKey = keyOf(tm.to[0], tm.to[1]);
    if (tm.merged) {
      const group = mergeGroups.get(destKey) ?? [];
      group.push({ el: live.el, value: tm.value });
      mergeGroups.set(destKey, group);
      nextLiveTiles.set(destKey, { el: group[0].el, value: group[0].value });
    } else {
      nextLiveTiles.set(destKey, live);
    }
  }
  liveTiles = nextLiveTiles;

  window.setTimeout(() => {
    for (const group of mergeGroups.values()) {
      const [survivor, ...doomed] = group;
      for (const d of doomed) d.el.remove();
      survivor.el.dataset.value = String(survivor.value);
      survivor.el.textContent = String(survivor.value);
      survivor.el.classList.remove("merge-pop");
      void survivor.el.offsetWidth;
      survivor.el.classList.add("merge-pop");
    }

    const finish = () => {
      for (const [pr, pc] of result.purged) {
        liveTiles.get(keyOf(pr, pc))?.el.remove();
        liveTiles.delete(keyOf(pr, pc));
      }

      movesMade += 1;

      const spread = spreadGlitches(result.board);
      spread.forEach((row, r) =>
        row.forEach((value, c) => {
          if (value === GLITCH && result.board[r][c] !== GLITCH) {
            const key = keyOf(r, c);
            const old = liveTiles.get(key);
            old?.el.remove();
            const el = createTileEl(GLITCH, r, c, cell, gap, "corrupt");
            liveTiles.set(key, { el, value: GLITCH });
          }
        }),
      );

      const boardAfterSpawn = spawnTile(spread, undefined, movesMade >= GLITCH_INTRODUCE_AFTER_MOVES);
      spawnNewTile(spread, boardAfterSpawn, cell, gap);
      board = boardAfterSpawn;

      if (result.scoreGained > 0) {
        score += result.scoreGained;
        scoreEl.classList.remove("bump");
        void scoreEl.offsetWidth;
        scoreEl.classList.add("bump");
      }
      scoreEl.textContent = String(score);

      if (hasWon(board)) {
        ended = true;
        overlayEl.classList.add("won");
        overlayEl.hidden = false;
      } else if (isGameOver(board)) {
        ended = true;
        overlayEl.classList.add("lost");
        overlayEl.hidden = false;
      }
      if (ended) replayEl.focus();
      animating = false;
    };

    if (result.purged.length > 0) {
      for (const [pr, pc] of result.purged) {
        liveTiles.get(keyOf(pr, pc))?.el.classList.add("purge");
      }
      window.setTimeout(finish, PURGE_MS);
    } else {
      finish();
    }
  }, MOVE_MS);
}

const KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

window.addEventListener("keydown", (event) => {
  const direction = KEYS[event.key];
  if (!direction) return;
  event.preventDefault();
  attemptMove(direction);
});

let touchStart: { x: number; y: number } | null = null;
boardEl.addEventListener("pointerdown", (event) => {
  touchStart = { x: event.clientX, y: event.clientY };
  boardEl.setPointerCapture(event.pointerId);
});
boardEl.addEventListener("pointerup", (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  const threshold = 24;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    attemptMove(dx > 0 ? "right" : "left");
  } else {
    attemptMove(dy > 0 ? "down" : "up");
  }
});

replayEl.addEventListener("click", newGame);
window.addEventListener("resize", repositionAll);

newGame();
