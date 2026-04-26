export type Operator = "+" | "-" | "*" | "/";
export type ClueType = "make-equation" | "equation-answer";
export type Direction = "across" | "down";

export interface Difficulty {
  name: string;
  maxDigits: number;
  operators: Operator[];
  makeEqRatio: number;
  givenDigits: number;
}

export interface BlackCell {
  type: "black";
}
export interface FilledCell {
  type: "digit" | "operator";
  value: string | null;
  given?: boolean;
  crossing?: boolean;
  entryType?: ClueType;
  number?: number;
}
export type Cell = BlackCell | FilledCell;

export interface Entry {
  id: number;
  row: number;
  col: number;
  direction: Direction;
  clueType: ClueType;
  left: number;
  op: Operator;
  right: number;
  result: number;
  cells: string[];
  length: number;
  clue: string;
  number: number | null;
}

export interface Puzzle {
  date: string;
  dayName: string;
  seed: number;
  difficulty: Difficulty;
  grid: Cell[][];
  entries: Entry[];
  size: number;
}

export interface PlayerCell {
  value: string | null;
}
export type PlayerGrid = PlayerCell[][];

export interface ValidationError {
  entryId: number;
  message: string;
}
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ClueLists {
  across: Entry[];
  down: Entry[];
}

export const DIFFICULTY: Difficulty[];
export function generatePuzzle(date?: Date): Puzzle;
export function validatePuzzle(puzzle: Puzzle, playerGrid: PlayerGrid): ValidationResult;
export function buildClueLists(puzzle: Puzzle): ClueLists;
export function createPlayerGrid(puzzle: Puzzle): PlayerGrid;
export function setPlayerCell(playerGrid: PlayerGrid, row: number, col: number, value: string | null): boolean;
export function clearPlayerCell(playerGrid: PlayerGrid, row: number, col: number): void;
export function getEntryCells(entry: Entry): { row: number; col: number }[];
export function getEntriesForCell(puzzle: Puzzle, row: number, col: number): Entry[];
export function buildShareText(puzzle: Puzzle, playerGrid: PlayerGrid, solveTimeSeconds: number): string;
export function getTodayDifficulty(date?: Date): Difficulty;
export function getDayOfWeek(date?: Date): number;
