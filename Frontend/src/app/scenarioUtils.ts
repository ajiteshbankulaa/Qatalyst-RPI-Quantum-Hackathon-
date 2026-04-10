import type { CellState } from "./types";

export const CELL_OPTIONS: CellState[] = [
  "empty",
  "dry_brush",
  "tree",
  "water",
  "protected",
  "intervention",
  "ignition",
];

export function blankGrid(fill: CellState = "tree"): CellState[][] {
  return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => fill));
}

export function stateTone(state: CellState) {
  switch (state) {
    case "ignition":
      return "warn";
    case "protected":
    case "intervention":
      return "accent";
    case "water":
      return "good";
    default:
      return "neutral";
  }
}
