"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncState {
  team1Name: string;
  team2Name: string;
  buzzedTeam: "team1" | "team2" | null;
  buzzerLocked: boolean;
  gameActive: boolean;
  team1Score: number;
  team2Score: number;
  showQuestion: boolean;
  questionText: string | null;
  selectedLetter: string | null;
}

export default function BuzzPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: teamParam } = use(params);
  const team = teamParam === "team2" ? "team2" : "team1";
  const isTeam1 = team === "team1";

  const [sync, setSync] = useState<SyncState | null>(null);
  const [buzzing, setBuzzing] = useState(false);
  const [buzzResult, setBuzzResult] = useState<"first" | "late" | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [nameSet, setNameSet] = useState(false);

  // Poll server state
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/game-sync");
        if (!active) return;
        const data = await res.json();
        setSync(data);

        // Detect buzz result
        if (data.buzzerLocked && buzzing) {
          setBuzzResult(data.buzzedTeam === team ? "first" : "late");
          setBuzzing(false);
        }
        // Reset when buzzer is cleared
        if (!data.buzzerLocked && buzzResult) {
          setBuzzResult(null);
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 200);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [team, buzzing, buzzResult]);

  const handleBuzz = useCallback(async () => {
    if (sync?.buzzerLocked || buzzing) return;
    setBuzzing(true);
    try {
      const res = await fetch("/api/game-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buzz", team, playerName: playerName || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBuzzResult("first");
      } else {
        setBuzzResult("late");
      }
    } catch {
      /* ignore */
    }
    setBuzzing(false);
  }, [team, sync?.buzzerLocked, buzzing, playerName]);

  const teamName = isTeam1
    ? sync?.team1Name ?? "الفريق الأول"
    : sync?.team2Name ?? "الفريق الثاني";

  const primaryColor = isTeam1 ? "#f97316" : "#22c55e";
  const darkColor = isTeam1 ? "#ea580c" : "#16a34a";
  const bgGradient = isTeam1
    ? "linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)"
    : "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)";

  const isLocked = sync?.buzzerLocked ?? false;
  const iWon = buzzResult === "first";
  const iLost = buzzResult === "late";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6 select-none"
      style={{ background: bgGradient }}
    >
      {/* Header */}
      <div className="w-full text-center pt-4">
        <div
          className="inline-block px-6 py-2 rounded-2xl text-white/80 text-sm font-semibold mb-3"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          حروف مع الاهدل
        </div>
        <h1 className="text-white text-3xl font-black">{teamName}</h1>
        {nameSet && (
          <p className="text-white/70 text-lg font-bold mt-1">🎮 {playerName}</p>
        )}
        <div className="flex justify-center gap-4 mt-3">
          <div className="text-white/60 text-sm">
            🟠 {sync?.team1Name ?? "..."}: <span className="text-white font-black">{sync?.team1Score ?? 0}</span>
          </div>
          <div className="text-white/60 text-sm">
            🟢 {sync?.team2Name ?? "..."}: <span className="text-white font-black">{sync?.team2Score ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Question display (if shown) */}
      {sync?.showQuestion && sync.questionText && (
        <motion.div
          className="w-full max-w-sm rounded-2xl p-5 text-center mx-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {sync.selectedLetter && (
            <div
              className="w-12 h-12 rounded-xl mb-3 text-2xl font-black text-white flex items-center justify-center mx-auto"
              style={{ backgroundColor: primaryColor }}
            >
              {sync.selectedLetter}
            </div>
          )}
          <p className="text-white text-lg font-semibold leading-relaxed">
            {sync.questionText}
          </p>
        </motion.div>
      )}

      {/* Buzzer button area */}
      <div className="flex-1 flex items-center justify-center w-full py-8">
        <AnimatePresence mode="wait">
          {!nameSet ? (
            <motion.div
              key="name-input"
              className="w-full max-w-sm px-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-white text-xl font-black mb-4">أدخل اسمك</p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="اسم اللاعب"
                className="w-full py-4 px-6 rounded-2xl text-center text-xl font-bold bg-black/30 border-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                style={{ borderColor: `${primaryColor}80` }}
                dir="rtl"
                autoFocus
              />
              <motion.button
                className="w-full mt-4 py-4 rounded-2xl text-white text-xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${darkColor})`,
                  boxShadow: `0 4px 20px ${primaryColor}60`,
                  opacity: playerName.trim() ? 1 : 0.4,
                }}
                whileTap={playerName.trim() ? { scale: 0.95 } : {}}
                onClick={() => { if (playerName.trim()) setNameSet(true); }}
                disabled={!playerName.trim()}
              >
                ✅ تأكيد
              </motion.button>
            </motion.div>
          ) : iWon ? (
            <motion.div
              key="won"
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, type: "tween", ease: "easeInOut" }}
              >
                🎉
              </motion.div>
              <p className="text-white text-3xl font-black">أنت الأول!</p>
              <p className="text-white/60 text-lg mt-2">بانتظار قرار المقدم...</p>
            </motion.div>
          ) : iLost ? (
            <motion.div
              key="lost"
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <div className="text-7xl mb-4 opacity-50">😔</div>
              <p className="text-white/60 text-2xl font-black">الفريق الآخر كان أسرع</p>
              <p className="text-white/40 text-base mt-2">انتظر السؤال التالي</p>
            </motion.div>
          ) : (
            <motion.button
              key="buzzer"
              className="relative"
              onClick={handleBuzz}
              disabled={isLocked || buzzing}
              whileTap={!isLocked ? { scale: 0.9 } : {}}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)`,
                  transform: "scale(1.5)",
                }}
                animate={
                  !isLocked
                    ? { opacity: [0.5, 1, 0.5], scale: [1.3, 1.6, 1.3] }
                    : { opacity: 0.2, scale: 1.3 }
                }
                transition={{ duration: 2, repeat: Infinity, type: "tween", ease: "easeInOut" }}
              />

              {/* Main buzzer circle */}
              <div
                className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center"
                style={{
                  background: isLocked
                    ? "linear-gradient(145deg, #555 0%, #333 100%)"
                    : `linear-gradient(145deg, ${primaryColor} 0%, ${darkColor} 100%)`,
                  boxShadow: isLocked
                    ? "0 8px 32px rgba(0,0,0,0.4), inset 0 -4px 12px rgba(0,0,0,0.3)"
                    : `0 8px 48px ${primaryColor}80, inset 0 -4px 12px rgba(0,0,0,0.3), 0 0 100px ${primaryColor}30`,
                  border: `4px solid ${isLocked ? "#666" : primaryColor}`,
                  transition: "all 0.3s ease",
                }}
              >
                <div className="text-center">
                  <span className="text-white text-6xl sm:text-7xl font-black block">
                    {isLocked ? "🔒" : "🔔"}
                  </span>
                  <span className="text-white text-xl sm:text-2xl font-black block mt-2">
                    {isLocked ? "مقفل" : "اضغط!"}
                  </span>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-white/30 text-xs text-center pb-4">
        {isTeam1 ? "← يربط أفقياً →" : "↑ يربط عمودياً ↓"}
      </div>
    </div>
  );
}
