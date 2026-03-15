"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { GameSettings } from "@/lib/gameStore";

interface SetupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SetupModal({ open, onClose }: SetupModalProps) {
  const router = useRouter();
  const { teams, setTeamName, startGame } = useGameStore();
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [totalRounds, setTotalRounds] = useState(1);
  const [name0, setName0] = useState(teams[0].name);
  const [name1, setName1] = useState(teams[1].name);

  function handleStart() {
    setTeamName(0, name0.trim() || "الفريق الأول");
    setTeamName(1, name1.trim() || "الفريق الثاني");
    const settings: GameSettings = { timerSeconds, totalRounds };
    startGame(settings);
    onClose();
    router.push("/game");
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative glass-card w-full max-w-lg p-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Title */}
            <h2 className="text-2xl font-black text-white text-center mb-6">
              ⚙️ إعدادات اللعبة
            </h2>

            {/* Team names */}
            <div className="space-y-4 mb-6">
              <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wider">
                أسماء الفريقين
              </h3>

              {/* Team 1 */}
              <div className="relative">
                <label className="block text-xs text-orange-400 font-semibold mb-1">
                  🟠 الفريق الأول (يربط أفقياً ←→)
                </label>
                <input
                  type="text"
                  value={name0}
                  onChange={(e) => setName0(e.target.value)}
                  maxLength={24}
                  placeholder="اسم الفريق الأول"
                  className="w-full bg-orange-950/30 border-2 border-orange-600/50 focus:border-orange-500 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 outline-none transition-colors text-right"
                />
              </div>

              {/* Team 2 */}
              <div className="relative">
                <label className="block text-xs text-green-400 font-semibold mb-1">
                  🟢 الفريق الثاني (يربط عمودياً ↑↓)
                </label>
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  maxLength={24}
                  placeholder="اسم الفريق الثاني"
                  className="w-full bg-green-950/30 border-2 border-green-600/50 focus:border-green-500 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/30 outline-none transition-colors text-right"
                />
              </div>
            </div>

            {/* Timer setting */}
            <div className="mb-6">
              <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wider mb-3">
                مؤقت السؤال
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[0, 20, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTimerSeconds(sec)}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${
                      timerSeconds === sec
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {sec === 0 ? "بلا وقت" : `${sec}ث`}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds setting */}
            <div className="mb-8">
              <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wider mb-3">
                عدد الجولات
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTotalRounds(r)}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${
                      totalRounds === r
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {r === 1 ? "جولة" : `${r} جولات`}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <motion.button
              className="w-full py-4 rounded-2xl font-black text-white text-xl"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                boxShadow: "0 6px 24px rgba(168,85,247,0.45)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(168,85,247,0.6)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
            >
              🎮 ابدأ اللعبة
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
