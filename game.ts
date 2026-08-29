// Pure 2048 board logic --- no DOM, no randomness baked in beyond an
// injectable `rng`, so the rules are testable on their own (spec/2048.test.ts).

export const SIZE = 4;

// A hazard tile: it slides like any other, but never merges with anything
// (not even another glitch), and spreads to a neighbor if left off-corner.
export const GLITCH = -1;

const GLITCH_SPAWN_CHANCE = 0.05;
const GLITCH_SPREAD_CHANCE = 0.15;

export type Board = number[][];
export type Direction = "up" | "down" | "left" | "right";

// Where a surviving tile came from and landed this move, for the DOM layer
// to animate --- a slide, or two sources folding into one merged tile.
export interface TileMove {
  from: [number, number];
  to: [number, number];
  merged: boolean;
  value: number;
}

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function transpose(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[c]));
}

function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

function boardsEqual(a: Board, b: Board): boolean {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

// Maps a coordinate within the oriented (left-sliding) grid back to the
// original board --- the same transform serves both a pre-slide "from" and
// a post-slide "to", since orient/unorient are inverse reshuffles of the
// same grid positions, independent of what's sitting in them.
function toOriginal(row: number, col: number, direction: Direction): [number, number] {
  if (direction === "right") return [row, SIZE - 1 - col];
  if (direction === "up") return [col, row];
  if (direction === "down") return [SIZE - 1 - col, row];
  return [row, col];
}

// Slides one row left, merging equal neighbours at most once each, and
// records where every surviving value came from within the row.
function slideLeft(
  row: number[],
): { row: number[]; gained: number; moves: { from: number; to: number; merged: boolean; value: number }[] } {
  const entries = row.map((value, index) => ({ value, index })).filter((e) => e.value !== 0);
  const result: number[] = [];
  const moves: { from: number; to: number; merged: boolean; value: number }[] = [];
  let gained = 0;
  let i = 0;
  while (i < entries.length) {
    const current = entries[i];
    const next = entries[i + 1];
    if (next && current.value === next.value && current.value !== GLITCH) {
      const sum = current.value * 2;
      moves.push({ from: current.index, to: result.length, merged: true, value: sum });
      moves.push({ from: next.index, to: result.length, merged: true, value: sum });
      result.push(sum);
      gained += sum;
      i += 2;
    } else {
      moves.push({ from: current.index, to: result.length, merged: false, value: current.value });
      result.push(current.value);
      i += 1;
    }
  }
  while (result.length < row.length) result.push(0);
  return { row: result, gained, moves };
}

// Every direction reduces to slideLeft under the right rotation.
function orient(board: Board, direction: Direction): Board {
  if (direction === "right") return reverseRows(board);
  if (direction === "up") return transpose(board);
  if (direction === "down") return reverseRows(transpose(board));
  return board;
}

function unorient(board: Board, direction: Direction): Board {
  if (direction === "right") return reverseRows(board);
  if (direction === "up") return transpose(board);
  if (direction === "down") return transpose(reverseRows(board));
  return board;
}

// A merge landing next to a glitch purges it --- the player's existing
// "chase merges" habit doubles as the way to actually get rid of a hazard,
// not just contain it.
function purgeGlitchesNearMerges(board: Board, tileMoves: TileMove[]): [number, number][] {
  const purged: [number, number][] = [];
  const mergeDestinations = new Set(
    tileMoves.filter((m) => m.merged).map((m) => `${m.to[0]},${m.to[1]}`),
  );
  for (const key of mergeDestinations) {
    const [r, c] = key.split(",").map(Number);
    const neighbors: [number, number][] = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === GLITCH) {
        board[nr][nc] = 0;
        purged.push([nr, nc]);
      }
    }
  }
  return purged;
}

export function move(
  board: Board,
  direction: Direction,
): { board: Board; moved: boolean; scoreGained: number; tileMoves: TileMove[]; purged: [number, number][] } {
  const oriented = orient(board, direction);
  let scoreGained = 0;
  const tileMoves: TileMove[] = [];
  const slid = oriented.map((row, r) => {
    const result = slideLeft(row);
    scoreGained += result.gained;
    for (const m of result.moves) {
      tileMoves.push({
        from: toOriginal(r, m.from, direction),
        to: toOriginal(r, m.to, direction),
        merged: m.merged,
        value: m.value,
      });
    }
    return result.row;
  });
  const next = unorient(slid, direction);
  const purged = purgeGlitchesNearMerges(next, tileMoves);
  return { board: next, moved: !boardsEqual(board, next), scoreGained, tileMoves, purged };
}

export function spawnTile(
  board: Board,
  rng: () => number = Math.random,
  allowGlitch = false,
): Board {
  const empties: [number, number][] = [];
  board.forEach((row, r) => row.forEach((v, c) => v === 0 && empties.push([r, c])));
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = allowGlitch && rng() < GLITCH_SPAWN_CHANCE ? GLITCH : rng() < 0.9 ? 2 : 4;
  return next;
}

const isCorner = (r: number, c: number) =>
  (r === 0 || r === SIZE - 1) && (c === 0 || c === SIZE - 1);

// A glitch left anywhere but a corner has a chance each move to corrupt one
// adjacent normal tile too --- parking it in a corner is how a player
// neutralizes it, discoverable from the same "keep your big tile cornered"
// instinct 2048 already teaches.
export function spreadGlitches(board: Board, rng: () => number = Math.random): Board {
  const next = board.map((row) => [...row]);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== GLITCH || isCorner(r, c)) continue;
      if (rng() >= GLITCH_SPREAD_CHANCE) continue;
      const candidates: [number, number][] = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      const neighbors = candidates.filter(
        ([nr, nc]) => nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] > 0,
      );
      if (neighbors.length === 0) continue;
      const [nr, nc] = neighbors[Math.floor(rng() * neighbors.length)];
      next[nr][nc] = GLITCH;
    }
  }
  return next;
}

export function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false;
      if (board[r][c] === GLITCH) continue;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return false;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v >= 2048));
}
