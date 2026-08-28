import {
  emptyBoard,
  hasWon,
  isGameOver,
  move,
  spawnTile,
  type Board,
  type Direction,
} from "./game.ts";

const boardEl = document.getElementById("board") as HTMLDivElement;
const scoreEl = document.getElementById("score") as HTMLParagraphElement;
const overlayEl = document.getElementById("overlay") as HTMLDivElement;
const replayEl = document.getElementById("replay") as HTMLButtonElement;

for (let i = 0; i < 16; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  boardEl.appendChild(cell);
}
const tilesEl = document.createElement("div");
tilesEl.id = "tiles";
boardEl.appendChild(tilesEl);

let board: Board = emptyBoard();
let score = 0;
let ended = false;
let inviteTimer: number | undefined;

function scheduleInvite() {
  window.clearTimeout(inviteTimer);
  inviteTimer = window.setTimeout(() => {
    boardEl.classList.remove("invite");
    void boardEl.offsetWidth; // restart the animation
    boardEl.classList.add("invite");
    scheduleInvite();
  }, 1800);
}

function cancelInvite() {
  window.clearTimeout(inviteTimer);
  boardEl.classList.remove("invite");
}

function render() {
  const gap = parseFloat(getComputedStyle(boardEl).columnGap) || 8;
  const cell = (tilesEl.clientWidth - gap * 3) / 4;
  tilesEl.innerHTML = "";
  board.forEach((row, r) => {
    row.forEach((value, c) => {
      if (!value) return;
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.value = String(value);
      tile.textContent = String(value);
      tile.style.width = `${cell}px`;
      tile.style.height = `${cell}px`;
      tile.style.left = `${c * (cell + gap)}px`;
      tile.style.top = `${r * (cell + gap)}px`;
      tilesEl.appendChild(tile);
    });
  });
  scoreEl.textContent = String(score);
}

function newGame() {
  board = spawnTile(spawnTile(emptyBoard()));
  score = 0;
  ended = false;
  overlayEl.hidden = true;
  overlayEl.classList.remove("won", "lost");
  render();
  scheduleInvite();
}

function attemptMove(direction: Direction) {
  if (ended) return;
  const result = move(board, direction);
  if (!result.moved) return;
  cancelInvite();
  board = spawnTile(result.board);
  if (result.scoreGained > 0) {
    score += result.scoreGained;
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
  }
  render();
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
window.addEventListener("resize", render);

newGame();
