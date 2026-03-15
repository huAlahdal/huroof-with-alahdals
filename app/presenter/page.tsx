"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncState {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  currentRound: number;
  totalRounds: number;
  selectedLetter: string | null;
  questionText: string | null;
  answerText: string | null;
  category: string | null;
  difficulty: string | null;
  showQuestion: boolean;
  buzzedTeam: "team1" | "team2" | null;
  buzzedPlayerName: string | null;
  buzzerLocked: boolean;
  pendingAction: { type: string; timestamp: number } | null;
  version: number;
  gameActive: boolean;
  buzzerTimerFirst: number;
  buzzerTimerSecond: number;
  passedToOtherTeamAt: number | null;
  buzzerIsOpenMode: boolean;
}

export default function PresenterPage() {
  const [sync, setSync] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Poll
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/game-sync");
        if (!active) return;
        setSync(await res.json());
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 300);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const sendAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setLoading(action);
      try {
        await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
      } catch {
        /* ignore */
      }
      setLoading(null);
    },
    []
  );

  const diffLabel = (d: string | null) =>
    d === "easy" ? "سهل" : d === "medium" ? "متوسط" : d === "hard" ? "صعب" : "";
  const diffColor = (d: string | null) =>
    d === "easy"
      ? "bg-green-900/40 text-green-300"
      : d === "medium"
      ? "bg-yellow-900/40 text-yellow-300"
      : "bg-red-900/40 text-red-300";

  const buzzerTeamName =
    sync?.buzzedTeam === "team1"
      ? sync.team1Name
      : sync?.buzzedTeam === "team2"
      ? sync.team2Name
      : null;

  const otherTeamNamePresenter =
    sync?.buzzedTeam === "team1"
      ? sync.team2Name
      : sync?.buzzedTeam === "team2"
      ? sync.team1Name
      : null;

  return (
    <div className="game-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            ح
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">لوحة المقدم</p>
            <p className="text-purple-400 text-xs">
              الجولة {sync?.currentRound ?? 1} من {sync?.totalRounds ?? 1}
            </p>
          </div>
        </div>
        <a
          href="/"
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold transition-colors"
        >
          🏠
        </a>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
          {/* Scores - full width */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 glass-card py-2 sm:py-3 px-3 sm:px-4 text-center">
              <div className="text-[10px] sm:text-xs font-semibold" style={{ color: "#fb923c" }}>
                🟠 {sync?.team1Name ?? "الفريق 1"}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{sync?.team1Score ?? 0}</div>
            </div>
            <div className="flex-1 glass-card py-2 sm:py-3 px-3 sm:px-4 text-center">
              <div className="text-[10px] sm:text-xs font-semibold" style={{ color: "#4ade80" }}>
                🟢 {sync?.team2Name ?? "الفريق 2"}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">{sync?.team2Score ?? 0}</div>
            </div>
          </div>

          {/* Two-column layout on desktop */}
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            {/* ── Left column: Question & cell controls ── */}
            <div className="space-y-3 sm:space-y-4">
              {/* Current question card */}
              <div className="glass-card p-3 sm:p-5 space-y-3 sm:space-y-4">
                {sync?.selectedLetter ? (
                  <>
                    {/* Letter badge */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                          boxShadow: "0 0 20px rgba(168,85,247,0.5)",
                        }}
                      >
                        {sync.selectedLetter}
                      </div>
                      <div>
                        <p className="text-white font-black text-base sm:text-lg">الحرف: «{sync.selectedLetter}»</p>
                        <div className="flex gap-2 mt-1">
                          {sync.category && (
                            <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full text-xs font-semibold">
                              {sync.category}
                            </span>
                          )}
                          {sync.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${diffColor(sync.difficulty)}`}
                            >
                              {diffLabel(sync.difficulty)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <p className="text-white/40 text-xs font-semibold mb-1">📝 السؤال</p>
                      <p className="text-white text-base font-semibold leading-relaxed">
                        {sync.questionText ?? "—"}
                      </p>
                    </div>

                    {/* Answer (always visible to presenter) */}
                    <div
                      className="rounded-xl p-3 sm:p-4 border border-purple-700/40"
                      style={{ background: "rgba(124,58,237,0.15)" }}
                    >
                      <p className="text-purple-400 text-xs font-semibold mb-1">✅ الإجابة</p>
                      <p className="text-purple-200 font-black text-lg leading-relaxed">
                        {sync.answerText ?? "—"}
                      </p>
                    </div>

                    {/* Show/hide question on game screen */}
                    <div className="flex gap-2">
                      <motion.button
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                          sync.showQuestion
                            ? "bg-purple-600 text-white"
                            : "bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          sendAction(sync.showQuestion ? "hide-question" : "show-question")
                        }
                      >
                        {sync.showQuestion ? "👁 السؤال ظاهر" : "👁‍🗨 أظهر السؤال"}
                      </motion.button>
                      <motion.button
                        className="py-3 px-4 rounded-xl bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 font-bold text-sm transition-colors"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => sendAction("refresh-question")}
                      >
                        🔄 سؤال بديل
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎲</div>
                    <p className="text-white/50 text-sm font-semibold">لم يتم اختيار حرف بعد</p>
                    <p className="text-white/30 text-xs mt-1">اختر من الشبكة أو اضغط الزر أدناه</p>
                  </div>
                )}
              </div>

              {/* Cell selection controls */}
              <motion.button
                className="w-full py-3 rounded-xl font-black text-white text-base"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
                  boxShadow: "0 4px 20px rgba(168,85,247,0.4)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => sendAction("random-cell")}
                disabled={loading === "random-cell"}
              >
                🎲 حرف عشوائي
              </motion.button>
            </div>

            {/* ── Right column: Buzzer, Award, Controls, Links ── */}
            <div className="space-y-3 sm:space-y-4">
              {/* Buzzer section */}
              <div className="glass-card p-3 sm:p-5 space-y-2 sm:space-y-3">
                <h3 className="text-white font-black text-sm sm:text-base">🔔 الجرس</h3>

                <AnimatePresence mode="wait">
                  {sync?.buzzedTeam ? (
                    <motion.div
                      key="buzzed"
                      className="rounded-xl p-4 text-center"
                      style={{
                        background:
                          sync.buzzedTeam === "team1"
                            ? "rgba(249,115,22,0.2)"
                            : "rgba(34,197,94,0.2)",
                        border: `2px solid ${sync.buzzedTeam === "team1" ? "#f97316" : "#22c55e"}`,
                      }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <p className="text-2xl font-black mb-1" style={{ color: sync.buzzedTeam === "team1" ? "#fb923c" : "#4ade80" }}>
                        🔔 {buzzerTeamName}
                      </p>
                      {sync.buzzedPlayerName && (
                        <p className="text-white font-bold text-base">🎮 {sync.buzzedPlayerName}</p>
                      )}
                      <p className="text-white/50 text-sm">ضغط الجرس أولاً!</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      className="rounded-xl p-4 text-center bg-white/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-white/40 text-sm">⏳ بانتظار ضغط الجرس...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold transition-colors"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendAction("reset-buzzer")}
                >
                  🔄 إعادة تعيين الجرس
                </motion.button>

                {/* Open to all button */}
                <motion.button
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
                  style={{
                    background: sync?.buzzerIsOpenMode
                      ? "rgba(234,179,8,0.25)"
                      : "rgba(234,179,8,0.1)",
                    border: "1px solid rgba(234,179,8,0.4)",
                    color: "#facc15",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendAction("open-buzzer")}
                >
                  {sync?.buzzerIsOpenMode ? "🔓 مفتوح للجميع" : "🔓 فتح للجميع"}
                </motion.button>

                {/* Pass to other team button — only when buzzed and not yet passed */}
                {sync?.buzzedTeam && !sync?.passedToOtherTeamAt && (
                  <motion.button
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
                    style={{
                      background: sync.buzzedTeam === "team1"
                        ? "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.3))"
                        : "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,88,12,0.3))",
                      border: `1px solid ${sync.buzzedTeam === "team1" ? "#22c55e" : "#f97316"}60`,
                      color: sync.buzzedTeam === "team1" ? "#4ade80" : "#fb923c",
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendAction("pass-to-other-team")}
                  >
                    ➡️ تمرير إلى {otherTeamNamePresenter}
                  </motion.button>
                )}
              </div>

              {/* Award / Skip controls */}
              <div className="glass-card p-3 sm:p-5 space-y-2 sm:space-y-3">
                <h3 className="text-white font-black text-sm sm:text-base">⚖️ من أجاب صحيحاً؟</h3>
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 py-2.5 sm:py-3.5 rounded-xl font-black text-white text-sm sm:text-base"
                    style={{
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      boxShadow: "0 3px 14px rgba(249,115,22,0.4)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendAction("award-team1")}
                  >
                    ✅ {sync?.team1Name ?? "فريق 1"}
                  </motion.button>
                  <motion.button
                    className="flex-1 py-2.5 sm:py-3.5 rounded-xl font-black text-white text-sm sm:text-base"
                    style={{
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      boxShadow: "0 3px 14px rgba(34,197,94,0.4)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendAction("award-team2")}
                  >
                    ✅ {sync?.team2Name ?? "فريق 2"}
                  </motion.button>
                </div>
                <motion.button
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm font-bold transition-colors"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendAction("skip")}
                >
                  ⏭ تخطي
                </motion.button>
              </div>

              {/* Game controls */}
              <div className="glass-card p-3 sm:p-5 space-y-2 sm:space-y-3">
                <h3 className="text-white font-black text-sm sm:text-base">⚙️ التحكم</h3>
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold transition-colors"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendAction("next-round")}
                  >
                    ⏭ الجولة التالية
                  </motion.button>
                  <motion.button
                    className="flex-1 py-2.5 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-bold transition-colors"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendAction("reset-game")}
                  >
                    🔄 إعادة اللعبة
                  </motion.button>
                </div>
              </div>

              {/* Timer configuration */}
              <div className="glass-card p-3 sm:p-5 space-y-2 sm:space-y-3">
                <h3 className="text-white font-black text-sm sm:text-base">⏱ إعدادات المؤقت</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-white/50 text-xs font-semibold block mb-1">وقت الفريق الضاغط (ثواني)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={sync?.buzzerTimerFirst ?? 5}
                      onChange={(e) =>
                        sendAction("set-timer-config", { buzzerTimerFirst: Number(e.target.value) || 5 })
                      }
                      className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-sm font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-white/50 text-xs font-semibold block mb-1">وقت الفريق الآخر (ثواني)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={sync?.buzzerTimerSecond ?? 10}
                      onChange={(e) =>
                        sendAction("set-timer-config", { buzzerTimerSecond: Number(e.target.value) || 10 })
                      }
                      className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-sm font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <p className="text-white/30 text-[10px]">المؤقت الأول يبدأ تلقائياً، المؤقت الثاني يبدأ عند الضغط على "تمرير"</p>
              </div>

              {/* Team page links */}
              <div className="glass-card p-3 sm:p-5 space-y-2 sm:space-y-3">
                <h3 className="text-white font-black text-sm sm:text-base">📱 روابط الفرق</h3>
                <p className="text-white/40 text-xs">شارك هذه الروابط مع الفرق ليفتحوها على هواتفهم</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <span className="text-orange-400 font-black text-sm">🟠 {sync?.team1Name ?? "فريق 1"}:</span>
                    <code className="text-white/60 text-xs flex-1 dir-ltr text-left" dir="ltr">
                      /buzz/team1
                    </code>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                    <span className="text-green-400 font-black text-sm">🟢 {sync?.team2Name ?? "فريق 2"}:</span>
                    <code className="text-white/60 text-xs flex-1 dir-ltr text-left" dir="ltr">
                      /buzz/team2
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
