import { describe, expect, it } from "vitest";
import { hasWon, isGameOver, move, type Board } from "../game.ts";

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
