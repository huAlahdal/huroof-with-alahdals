"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { useEffect, useState } from "react";

interface WinScreenProps {
  onNextRound: () => void;
  onRestart: () => void;
}

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ["#f97316", "#22c55e", "#a855f7", "#f59e0b", "#3b82f6"][Math.floor(Math.random() * 5)],
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 8 + Math.random() * 10,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "0%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: 720 }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeIn", repeat: Infinity, repeatDelay: 0.5 }}
        />
      ))}
    </div>
  );
}

export default function WinScreen({ onNextRound, onRestart }: WinScreenProps) {
  const { phase, winner, teams, currentRound, totalRounds } = useGameStore();
  const [showDetails, setShowDetails] = useState(false);

  const isRoundEnd = phase === "between_rounds";
  const isFinalEnd = phase === "win";

  // Tiebreaker: between_rounds but we've already played all planned rounds and scores are tied
  const isTiebreaker = isRoundEnd && currentRound >= totalRounds && teams[0].score === teams[1].score;

  useEffect(() => {
    if (isRoundEnd || isFinalEnd) {
      const t = setTimeout(() => setShowDetails(true), 800);
      return () => clearTimeout(t);
    }
    setShowDetails(false);
  }, [isRoundEnd, isFinalEnd]);

  if (!isRoundEnd && !isFinalEnd) return null;

  const winnerTeam = winner === "team1" ? teams[0] : winner === "team2" ? teams[1] : null;
  const isDraw = winner === "draw";

  // Determine overall game winner (for final screen)
  const finalWinner =
    isFinalEnd
      ? teams[0].score > teams[1].score
        ? teams[0]
        : teams[1].score > teams[0].score
        ? teams[1]
        : null
      : null;

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center px-4">
        <motion.div
          className="glass-card w-full max-w-lg p-8 text-center shadow-2xl"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 22 }}
        >
          {/* Trophy / Emoji */}
          <motion.div
            className="text-7xl mb-4"
            animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut", type: "tween" }}
          >
            {isTiebreaker ? "⚔️" : isDraw ? "🤝" : "🏆"}
          </motion.div>

          {/* Title */}
          {isTiebreaker ? (
            <>
              <h1 className="text-3xl font-black text-yellow-400 mb-2">تعادل! ⚡</h1>
              <p className="text-white/70 text-lg font-semibold mb-1">
                النتيجة {teams[0].score} - {teams[1].score}
              </p>
              <p className="text-white/50 text-base">
                نحتاج جولة فاصلة لتحديد الفائز!
              </p>
            </>
          ) : isDraw ? (
            <h1 className="text-3xl font-black text-white mb-2">تعادل!</h1>
          ) : (
            <>
              <p className="text-purple-300 font-semibold text-lg">
                {isRoundEnd ? `الجولة ${currentRound}` : "اللعبة انتهت!"}
              </p>
              <h1
                className="text-4xl font-black mb-1 mt-1"
                style={{
                  color: winnerTeam?.color === "team1" ? "#f97316" : "#22c55e",
                  textShadow: `0 0 20px ${winnerTeam?.color === "team1" ? "#f97316" : "#22c55e"}`,
                }}
              >
                {isFinalEnd && finalWinner ? finalWinner.name : winnerTeam?.name}
              </h1>
              <p className="text-white/70 text-xl font-semibold mb-4">
                {isRoundEnd ? "فاز بهذه الجولة! 🎉" : "يفوز باللعبة! 🎊"}
              </p>
            </>
          )}

          {/* Scores */}
          {showDetails && (
            <motion.div
              className="flex justify-center gap-6 my-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {teams.map((team) => (
                <div key={team.color} className="flex flex-col items-center gap-2">
                  <div
                    className="score-badge text-white"
                    style={{ color: team.color === "team1" ? "#f97316" : "#22c55e" }}
                  >
                    {team.score}
                  </div>
                  <span className="text-white/70 text-sm font-semibold">{team.name}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Direction reminder */}
          {showDetails && (
            <motion.div
              className="flex justify-center gap-8 mb-6 text-xs text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span>🟠 {teams[0].name} ← أفقي →</span>
              <span>🟢 {teams[1].name} ↑ عمودي ↓</span>
            </motion.div>
          )}

          {/* Buttons */}
          {showDetails && (
            <motion.div
              className="flex gap-3 justify-center flex-wrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isTiebreaker && (
                <motion.button
                  className="px-6 py-3 rounded-xl font-black text-white text-base"
                  style={{
                    background: "linear-gradient(135deg, #eab308, #ca8a04)",
                    boxShadow: "0 4px 20px rgba(234,179,8,0.4)",
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextRound}
                >
                  ⚔️ الجولة الفاصلة
                </motion.button>
              )}
              {isRoundEnd && !isTiebreaker && currentRound < totalRounds && (
                <motion.button
                  className="px-6 py-3 rounded-xl font-black text-white text-base"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextRound}
                >
                  الجولة التالية ▶
                </motion.button>
              )}
              <motion.button
                className="px-6 py-3 rounded-xl font-black text-white text-base bg-white/10 hover:bg-white/15 transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRestart}
              >
                🔄 العب مجدداً
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
