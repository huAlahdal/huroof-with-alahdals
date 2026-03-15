"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GridLayout, hexPoints, ROWS, COLS } from "@/lib/hexUtils";

interface HexGridProps {
  grid: GridLayout;
  onCellClick?: (id: string) => void;
  interactive?: boolean;
  size?: number;
}

const TEAM_COLORS = {
  team1: { fill: "#f97316", stroke: "#ea580c", text: "#fff" },
  team2: { fill: "#22c55e", stroke: "#16a34a", text: "#fff" },
  empty: { fill: "#1e1b3a", stroke: "#6d28d9", text: "#c4b5fd" },
  selected: { fill: "#7c3aed", stroke: "#a855f7", text: "#fff" },
};

/* ── Hex center that handles negative rows/cols ─────────────── */
function hexCenterExt(row: number, col: number, size: number) {
  const w = Math.sqrt(3) * size;
  const h = 2 * size;
  const isOdd = ((row % 2) + 2) % 2 === 1;
  return {
    cx: col * w + (isOdd ? w / 2 : 0) + w / 2,
    cy: row * (h * 0.75) + size,
  };
}

/* ── Border hex positions ───────────────────────────────────── */
interface BorderHex {
  row: number;
  col: number;
  team: "team1" | "team2";
}

function buildBorderHexes(): BorderHex[] {
  const out: BorderHex[] = [];
  // Left column (team1/orange) — grid rows only
  for (let r = 0; r < ROWS; r++) out.push({ row: r, col: -1, team: "team1" });
  // Right column (team1/orange) — grid rows only
  for (let r = 0; r < ROWS; r++) out.push({ row: r, col: COLS, team: "team1" });
  // Top row (team2/green) — exclude right corner (col=COLS) to avoid overlap with orange
  for (let c = -1; c < COLS; c++) out.push({ row: -1, col: c, team: "team2" });
  // Bottom row (team2/green) — exclude right corner (col=COLS)
  for (let c = -1; c < COLS; c++) out.push({ row: ROWS, col: c, team: "team2" });
  return out;
}

export default function HexGrid({
  grid,
  onCellClick,
  interactive = true,
  size = 52,
}: HexGridProps) {
  const borderHexes = useMemo(() => buildBorderHexes(), []);

  const viewBox = useMemo(() => {
    const allCenters = [
      ...grid.flat().map((c) => hexCenterExt(c.row, c.col, size)),
      ...borderHexes.map((b) => hexCenterExt(b.row, b.col, size)),
    ];
    const pad = size + 6;
    const xs = allCenters.map((p) => p.cx);
    const ys = allCenters.map((p) => p.cy);
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const maxX = Math.max(...xs) + pad;
    const maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [grid, borderHexes, size]);

  const innerSize = size - 3;
  const borderSize = size - 2;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={viewBox}
        width="100%"
        style={{ maxWidth: 900, display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="selected-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* ─── Border hexagons (behind main grid) ──────────── */}
        {borderHexes.map((bh, i) => {
          const { cx, cy } = hexCenterExt(bh.row, bh.col, size);
          const fill = bh.team === "team1" ? "#f97316" : "#22c55e";
          const stroke = bh.team === "team1" ? "#ea580c" : "#16a34a";
          return (
            <polygon
              key={`b-${i}`}
              points={hexPoints(cx, cy, borderSize)}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
              opacity={0.8}
            />
          );
        })}

        {/* ─── Main grid hexagons ──────────────────────────── */}
        {grid.flat().map((cell) => {
          const { cx, cy } = hexCenterExt(cell.row, cell.col, size);
          const points = hexPoints(cx, cy, innerSize);
          const isOwned = cell.owner !== null;
          const colors = cell.isSelected
            ? TEAM_COLORS.selected
            : isOwned
            ? TEAM_COLORS[cell.owner!]
            : TEAM_COLORS.empty;
          const canClick = interactive && !isOwned && !cell.isSelected;

          return (
            <motion.g
              key={cell.id}
              className={canClick ? "hex-cell" : ""}
              onClick={() => canClick && onCellClick?.(cell.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: (cell.row * 5 + cell.col) * 0.04,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={canClick ? { scale: 1.08 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
              style={{ cursor: canClick ? "pointer" : "default" }}
            >
              <polygon
                points={hexPoints(cx, cy, innerSize + 4)}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={cell.isSelected ? 3 : 1.5}
                opacity={0.6}
                filter={cell.isSelected ? "url(#selected-glow)" : undefined}
              />
              <polygon
                points={points}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={cell.isSelected ? 2.5 : 1.5}
                filter={isOwned || cell.isSelected ? "url(#shadow)" : undefined}
              />
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={colors.text}
                fontSize={size * 0.5}
                fontFamily="Cairo, Arial"
                fontWeight="900"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {cell.letter}
              </text>
              {isOwned && (
                <circle
                  cx={cx}
                  cy={cy - innerSize * 0.55}
                  r={4}
                  fill={colors.stroke}
                  opacity={0.9}
                />
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
