// Pure 2048 board logic --- no DOM, no randomness baked in beyond an
// injectable `rng`, so the rules are testable on their own (spec/2048.test.ts).

export const SIZE = 4;

export type Board = number[][];
export type Direction = "up" | "down" | "left" | "right";

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

// Slides one row left, merging equal neighbours at most once each.
function slideLeft(row: number[]): { row: number[]; gained: number } {
  const values = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === values[i + 1]) {
      const sum = values[i] * 2;
      merged.push(sum);
      gained += sum;
      i++;
    } else {
      merged.push(values[i]);
    }
  }
  while (merged.length < row.length) merged.push(0);
  return { row: merged, gained };
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

export function move(
  board: Board,
  direction: Direction,
): { board: Board; moved: boolean; scoreGained: number } {
  const oriented = orient(board, direction);
  let scoreGained = 0;
  const slid = oriented.map((row) => {
    const result = slideLeft(row);
    scoreGained += result.gained;
    return result.row;
  });
  const next = unorient(slid, direction);
  return { board: next, moved: !boardsEqual(board, next), scoreGained };
}

export function spawnTile(board: Board, rng: () => number = Math.random): Board {
  const empties: [number, number][] = [];
  board.forEach((row, r) => row.forEach((v, c) => v === 0 && empties.push([r, c])));
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  const next = board.map((row) => [...row]);
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

export function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return false;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v >= 2048));
}
