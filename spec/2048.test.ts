import { describe, expect, it } from "vitest";
import { GLITCH, hasWon, isGameOver, move, spreadGlitches, type Board } from "../game.ts";

// A focused slice of the game's own rules --- the contracts a player relies on,
// not how the board happens to be implemented.

describe("the merge rule", () => {
  it("combines two equal tiles into one, doubling the value", () => {
    const board: Board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: next, scoreGained } = move(board, "left");
    expect(next[0]).toEqual([4, 0, 0, 0]);
    expect(scoreGained).toBe(4);
  });

  it("merges each tile at most once per move", () => {
    const board: Board = [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: next } = move(board, "left");
    expect(next[0]).toEqual([4, 4, 0, 0]);
  });

  it("reports no move made when nothing can slide or merge", () => {
    const board: Board = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { moved } = move(board, "left");
    expect(moved).toBe(false);
  });
});

describe("tileMoves (for animating the board)", () => {
  it("reports each tile's source and destination on a plain slide", () => {
    const board: Board = [
      [0, 2, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { tileMoves } = move(board, "left");
    expect(tileMoves).toEqual([
      { from: [0, 1], to: [0, 0], merged: false, value: 2 },
      { from: [0, 3], to: [0, 1], merged: false, value: 4 },
    ]);
  });

  it("reports both source tiles landing on the merged destination", () => {
    const board: Board = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { tileMoves } = move(board, "up");
    expect(tileMoves).toHaveLength(2);
    expect(tileMoves).toEqual(
      expect.arrayContaining([
        { from: [0, 0], to: [0, 0], merged: true, value: 4 },
        { from: [1, 0], to: [0, 0], merged: true, value: 4 },
      ]),
    );
  });
});

describe("the game-over rule", () => {
  it("is not over while an empty cell remains", () => {
    const board: Board = [
      [2, 4, 8, 16],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 0],
    ];
    expect(isGameOver(board)).toBe(false);
  });

  it("is not over while an adjacent merge is still possible", () => {
    const board: Board = [
      [2, 4, 8, 16],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 2, 4],
    ];
    expect(isGameOver(board)).toBe(false);
  });

  it("is over once the board is full and no merge remains", () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isGameOver(board)).toBe(true);
  });
});

describe("the glitch rule", () => {
  it("never merges, even with another glitch", () => {
    const board: Board = [
      [GLITCH, GLITCH, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: next } = move(board, "left");
    expect(next[0]).toEqual([GLITCH, GLITCH, 0, 0]);
  });

  it("spreads into an adjacent normal tile when off-corner", () => {
    const board: Board = [
      [0, 0, 0, 0],
      [0, GLITCH, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const next = spreadGlitches(board, () => 0);
    expect(next[1][2]).toBe(GLITCH);
  });

  it("does not spread while parked in a corner", () => {
    const board: Board = [
      [GLITCH, 2, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const next = spreadGlitches(board, () => 0);
    expect(next[0][1]).toBe(2);
    expect(next[1][0]).toBe(2);
  });

  it("is purged by a merge that lands next to it", () => {
    const board: Board = [
      [2, 2, GLITCH, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: next, purged } = move(board, "left");
    expect(next[0]).toEqual([4, 0, 0, 0]);
    expect(purged).toEqual([[0, 1]]);
  });

  it("is left alone by a merge that isn't adjacent to it", () => {
    const board: Board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [GLITCH, 0, 0, 0],
    ];
    const { board: next, purged } = move(board, "left");
    expect(next[3][0]).toBe(GLITCH);
    expect(purged).toEqual([]);
  });

  it("counts a glitch-glitch neighbor pair as game over, not an escape hatch", () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, GLITCH, GLITCH],
    ];
    expect(isGameOver(board)).toBe(true);
  });
});

describe("the win rule", () => {
  it("is won once a 2048 tile exists", () => {
    const board: Board = [
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(hasWon(board)).toBe(true);
  });

  it("is not won while every tile is below 2048", () => {
    const board: Board = [
      [1024, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(hasWon(board)).toBe(false);
  });
});
