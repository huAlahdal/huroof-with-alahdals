"use client";

import { motion } from "framer-motion";
import { Team } from "@/lib/gameStore";

interface ScoreBoardProps {
  teams: [Team, Team];
  currentRound: number;
  totalRounds: number;
  phase: string;
}

export default function ScoreBoard({ teams, currentRound, totalRounds, phase }: ScoreBoardProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Round info */}
      <div className="glass-card px-4 py-3 text-center">
        <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1">الجولة</p>
        <p className="text-white font-black text-2xl">
          {currentRound} / {totalRounds}
        </p>
      </div>

      {/* Team scores */}
      {teams.map((team, idx) => (
        <motion.div
          key={team.color}
          className="glass-card px-4 py-4 text-center"
          style={{ borderColor: team.color === "team1" ? "#f97316" : "#22c55e" }}
          whileHover={{ scale: 1.02 }}
          animate={
            phase === "win" || phase === "between_rounds"
              ? { boxShadow: ["0 0 0px transparent", `0 0 24px ${team.color === "team1" ? "#f97316" : "#22c55e"}`, "0 0 0px transparent"] }
              : {}
          }
          transition={{ duration: 1.5, repeat: 3, ease: "easeInOut", type: "tween" }}
        >
          {/* Team color indicator */}
          <div
            className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-white text-base"
            style={{
              background: team.color === "team1"
                ? "linear-gradient(135deg, #f97316, #ea580c)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: `0 0 14px ${team.color === "team1" ? "rgba(249,115,22,0.5)" : "rgba(34,197,94,0.5)"}`,
            }}
          >
            {idx + 1}
          </div>

          <p
            className="font-black text-base truncate"
            style={{ color: team.color === "team1" ? "#fb923c" : "#4ade80" }}
          >
            {team.name}
          </p>

          <p className="text-white font-black text-3xl mt-1">{team.score}</p>

          <p className="text-white/40 text-xs mt-1">
            {team.color === "team1" ? "← أفقي →" : "↕ عمودي ↕"}
          </p>
        </motion.div>
      ))}

      {/* Win condition legend */}
      <div className="glass-card px-4 py-3">
        <p className="text-white/40 text-xs text-center font-semibold mb-2">كيفية الفوز</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm bg-orange-500 flex-shrink-0" />
            <span className="text-white/60">يربط يميناً ويساراً</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm bg-green-500 flex-shrink-0" />
            <span className="text-white/60">يربط أعلى وأسفل</span>
          </div>
        </div>
      </div>
    </div>
  );
}
