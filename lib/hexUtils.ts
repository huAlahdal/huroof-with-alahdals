export interface HexCell {
  id: string;
  row: number;
  col: number;
  letter: string;
  owner: "team1" | "team2" | null; // null = unclaimed
  isSelected: boolean;
}

export type GridLayout = HexCell[][];

// 5×5 grid of Arabic letters - 25 cells
export const GRID_LETTERS = [
  ["أ", "ب", "ت", "ث", "ج"],
  ["ح", "خ", "د", "ر", "ز"],
  ["س", "ش", "ص", "ط", "ع"],
  ["غ", "ف", "ق", "ك", "ل"],
  ["م", "ن", "ه", "و", "ي"],
];

export const ROWS = 5;
export const COLS = 5;

export function createInitialGrid(): GridLayout {
  // Shuffle the letters for random placement
  const allLetters = GRID_LETTERS.flat();
  const shuffled = [...allLetters].sort(() => Math.random() - 0.5);

  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      id: `${row}-${col}`,
      row,
      col,
      letter: shuffled[row * COLS + col],
      owner: null,
      isSelected: false,
    }))
  );
}

/**
 * Pointy-top hexagon adjacency for offset (odd-row shifted right) grids.
 * Returns valid [row, col] neighbors.
 */
export function getNeighbors(row: number, col: number): [number, number][] {
  const isOddRow = row % 2 === 1;
  const directions: [number, number][] = isOddRow
    ? [
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, 0],
        [1, 1],
      ]
    : [
        [-1, -1],
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
      ];

  return directions
    .map(([dr, dc]) => [row + dr, col + dc] as [number, number])
    .filter(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS);
}

/**
 * Check if team1 (orange) has a connected path of their cells from col=0 to col=COLS-1.
 * Check if team2 (green)  has a connected path of their cells from row=0 to row=ROWS-1.
 */
export function checkWin(grid: GridLayout, team: "team1" | "team2"): boolean {
  if (team === "team1") {
    // Horizontal: left column (col=0) → right column (col=COLS-1)
    const startCells = grid.flatMap((row) =>
      row.filter((cell) => cell.col === 0 && cell.owner === "team1")
    );
    return bfsReach(grid, startCells, team, (cell) => cell.col === COLS - 1);
  } else {
    // Vertical: top row (row=0) → bottom row (row=ROWS-1)
    const startCells = grid[0].filter((cell) => cell.owner === "team2");
    return bfsReach(grid, startCells, team, (cell) => cell.row === ROWS - 1);
  }
}

function bfsReach(
  grid: GridLayout,
  starts: HexCell[],
  team: "team1" | "team2",
  goal: (cell: HexCell) => boolean
): boolean {
  const visited = new Set<string>();
  const queue: HexCell[] = [...starts];
  starts.forEach((c) => visited.add(c.id));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (goal(current)) return true;

    for (const [nr, nc] of getNeighbors(current.row, current.col)) {
      const neighbor = grid[nr][nc];
      if (!visited.has(neighbor.id) && neighbor.owner === team) {
        visited.add(neighbor.id);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/**
 * Compute SVG (x, y) center for a hex cell using pointy-top layout.
 * size = circumradius
 */
export function hexCenter(
  row: number,
  col: number,
  size: number,
  padding = 4
): { cx: number; cy: number } {
  const w = Math.sqrt(3) * size;
  const h = 2 * size;
  const cx = col * w + (row % 2 === 1 ? w / 2 : 0) + w / 2 + padding;
  const cy = row * (h * 0.75) + size + padding;
  return { cx, cy };
}

/**
 * SVG polygon points string for a pointy-top hexagon centred at (cx, cy).
 */
export function hexPoints(cx: number, cy: number, size: number): string {
  const angles = [30, 90, 150, 210, 270, 330];
  return angles
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      return `${cx + size * Math.cos(rad)},${cy + size * Math.sin(rad)}`;
    })
    .join(" ");
}

/**
 * Compute total SVG canvas dimensions for the grid.
 */
export function gridSvgSize(size: number, padding = 4): { width: number; height: number } {
  const w = Math.sqrt(3) * size;
  const h = 2 * size;
  const extraOffset = w / 2; // for odd-row offset
  const width = COLS * w + extraOffset + padding * 2;
  const height = ROWS * (h * 0.75) + h * 0.25 + padding * 2;
  return { width, height };
}

/**
 * Get all cells that are unclaimed (available to be selected).
 */
export function getAvailableCells(grid: GridLayout): HexCell[] {
  return grid.flat().filter((c) => c.owner === null);
}

/**
 * Get a random unclaimed cell.
 */
export function getRandomCell(grid: GridLayout): HexCell | null {
  const available = getAvailableCells(grid);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
