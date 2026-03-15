"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SetupModal from "@/components/SetupModal";

const BG_LETTERS = ["أ","ب","ت","ث","ج","ح","خ","د","ر","ز","س","ش","ص","ط","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];
const BG_COLORS = ["#7c3aed","#f97316","#22c55e","#a855f7","#ec4899","#f59e0b"];

export default function Home() {
  const [setupOpen, setSetupOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="game-bg min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Background hexagon decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BG_LETTERS.map((letter, i) => (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center font-black text-base select-none"
            style={{
              left: `${(i * 7.3 + 2) % 94}%`,
              top: `${(i * 11.7 + 4) % 88}%`,
              width: 52,
              height: 60,
              clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              backgroundColor: BG_COLORS[i % BG_COLORS.length],
              color: "#fff",
              opacity: 0,
            }}
            animate={{ opacity: 0.10, scale: [0.85, 1, 0.85] }}
            transition={{ delay: i * 0.06, duration: 3 + i * 0.15, type: "tween", ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          >
            {letter}
          </motion.div>
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 75% 65% at center, transparent 0%, #0f0a1e 75%)" }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full">

        {/* Logo */}
        <motion.div
          className="text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, type: "spring", stiffness: 120 }}
        >
          <motion.div
            className="w-28 h-28 rounded-3xl mx-auto mb-5 flex items-center justify-center text-6xl font-black text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)",
              boxShadow: "0 0 50px rgba(168,85,247,0.7), 0 0 100px rgba(168,85,247,0.3)",
            }}
            animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", type: "tween" }}
          >
            ح
          </motion.div>

          <h1
            className="text-5xl sm:text-6xl font-black leading-tight mb-2"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #a855f7 50%, #22c55e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 2px rgba(168,85,247,0.3))",
            }}
          >
            حروف مع الاهدل
          </h1>
          <p className="text-white/50 text-base sm:text-lg font-medium">
            لعبة ثقافية تفاعلية للفريقين ⚔️
          </p>
        </motion.div>

        {/* Info card */}
        <motion.div
          className="glass-card w-full p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          <h2 className="text-white font-black text-lg text-center mb-5">كيف تلعب؟</h2>
          <div className="space-y-3">
            {[
              { icon: "🎲", text: "اختر حرفاً عشوائياً أو اضغط على خلية في الشبكة" },
              { icon: "❓", text: "المقدم يطرح سؤالاً إجابته تبدأ بذلك الحرف" },
              { icon: "⚡", text: "الفريق الأسرع في الإجابة يمتلك الخلية بلونه" },
              { icon: "🟠", text: "الفريق الأول (برتقالي): يفوز بربط أفقي ← يميناً إلى يساراً" },
              { icon: "🟢", text: "الفريق الثاني (أخضر): يفوز بربط عمودي ↕ أعلى إلى أسفل" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-white/70 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <motion.button
            className="w-full py-5 rounded-2xl font-black text-white text-2xl tracking-wide"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
              boxShadow: "0 8px 32px rgba(168,85,247,0.55)",
            }}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 44px rgba(168,85,247,0.75)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSetupOpen(true)}
          >
            🎮 ابدأ اللعبة
          </motion.button>

          <motion.button
            className="w-full py-4 rounded-2xl font-bold text-white/80 text-lg border border-white/10 hover:bg-white/8 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
            whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/admin")}
          >
            ✏️ إدارة الأسئلة
          </motion.button>

          <motion.button
            className="w-full py-4 rounded-2xl font-bold text-white/80 text-lg border border-white/10 hover:bg-white/8 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
            whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/presenter")}
          >
            🎙️ لوحة المقدم
          </motion.button>

          <div className="flex gap-3 w-full">
            <motion.button
              className="flex-1 py-3 rounded-2xl font-bold text-lg border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
              style={{ background: "rgba(249,115,22,0.06)", color: "#fb923c" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/buzz/team1")}
            >
              🟠 جرس فريق 1
            </motion.button>
            <motion.button
              className="flex-1 py-3 rounded-2xl font-bold text-lg border border-green-500/30 hover:bg-green-500/10 transition-colors"
              style={{ background: "rgba(34,197,94,0.06)", color: "#4ade80" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/buzz/team2")}
            >
              🟢 جرس فريق 2
            </motion.button>
          </div>
        </motion.div>

        <motion.p
          className="text-white/20 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          حروف مع الاهدل — لعبة ثقافية تفاعلية
        </motion.p>
      </div>

      {/* Setup Modal */}
      <SetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
      />
    </div>
  );
}
