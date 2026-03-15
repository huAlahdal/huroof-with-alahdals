"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import HexGrid from "@/components/HexGrid";
import ScoreBoard from "@/components/ScoreBoard";
import WinScreen from "@/components/WinScreen";

interface SyncState {
  buzzedTeam: "team1" | "team2" | null;
  buzzedAt: number | null;
  buzzedPlayerName: string | null;
  buzzerLocked: boolean;
  showQuestion: boolean;
  questionText: string | null;
  selectedLetter: string | null;
  category: string | null;
  difficulty: string | null;
  pendingAction: { type: string; timestamp: number } | null;
  version: number;
  team1Name: string;
  team2Name: string;
  buzzerTimerFirst: number;
  buzzerTimerSecond: number;
  passedToOtherTeamAt: number | null;
  buzzerIsOpenMode: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const {
    phase,
    grid,
    teams,
    currentRound,
    totalRounds,
    selectedCell,
    currentQuestion,
    awardCell,
    pickRandomCell,
    selectCell,
    nextRound,
    resetGame,
    refreshQuestion,
  } = useGameStore();

  const [sync, setSync] = useState<SyncState | null>(null);
  const [buzzerAnnounce, setBuzzerAnnounce] = useState<"team1" | "team2" | null>(null);
  const lastProcessedVersion = useRef(0);

  // Timer state
  const [timerPhase, setTimerPhase] = useState<"first" | "second" | "expired" | "open" | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Redirect if no game
  useEffect(() => {
    if (phase === "setup") router.replace("/");
  }, [phase, router]);

  // --- Sync game state TO the server ---
  const syncToServer = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await fetch("/api/game-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", ...data }),
        });
      } catch {
        /* network error — ignore */
      }
    },
    []
  );

  // Sync scores & round info
  useEffect(() => {
    syncToServer({
      team1Name: teams[0]?.name,
      team2Name: teams[1]?.name,
      team1Score: teams[0]?.score ?? 0,
      team2Score: teams[1]?.score ?? 0,
      currentRound,
      totalRounds,
      gameActive: phase !== "setup",
    });
  }, [teams, currentRound, totalRounds, phase, syncToServer]);

  // Sync question info when cell is selected
  useEffect(() => {
    if (selectedCell && currentQuestion) {
      syncToServer({
        selectedLetter: selectedCell.letter,
        questionText: currentQuestion.question,
        answerText: currentQuestion.answer,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
      });
    } else if (!selectedCell) {
      syncToServer({
        selectedLetter: null,
        questionText: null,
        answerText: null,
        category: null,
        difficulty: null,
      });
      // Also hide question when cell is deselected
      fetch("/api/game-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide-question" }),
      }).catch(() => {});
    }
  }, [selectedCell, currentQuestion, syncToServer]);

  // --- Poll server state ---
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/game-sync");
        if (!active) return;
        const data: SyncState = await res.json();
        setSync(data);

        // Process pending actions from presenter
        if (
          data.pendingAction &&
          data.version > lastProcessedVersion.current
        ) {
          lastProcessedVersion.current = data.version;
          const actionType = data.pendingAction.type;

          switch (actionType) {
            case "award-team1":
              awardCell("team1");
              break;
            case "award-team2":
              awardCell("team2");
              break;
            case "skip":
              awardCell("skip");
              break;
            case "random-cell":
              pickRandomCell();
              break;
            case "refresh-question":
              refreshQuestion();
              break;
            case "next-round":
              nextRound();
              break;
            case "reset-game":
              resetGame();
              break;
          }

          // Acknowledge
          fetch("/api/game-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "ack" }),
          }).catch(() => {});

          // Also reset buzzer after award/skip
          if (["award-team1", "award-team2", "skip"].includes(actionType)) {
            fetch("/api/game-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "reset-buzzer" }),
            }).catch(() => {});
          }
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 250);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buzzer announcement effect
  useEffect(() => {
    if (sync?.buzzedTeam && !buzzerAnnounce) {
      setBuzzerAnnounce(sync.buzzedTeam);
    }
    if (!sync?.buzzerLocked && buzzerAnnounce) {
      setBuzzerAnnounce(null);
      setTimerPhase(null);
      setTimerSeconds(0);
    }
  }, [sync?.buzzedTeam, sync?.buzzerLocked, buzzerAnnounce]);

  // Timer countdown logic — skipped entirely in open buzz mode
  useEffect(() => {
    if (!sync?.buzzedAt || !sync?.buzzerLocked || sync?.buzzerIsOpenMode) {
      setTimerPhase(null);
      setTimerSeconds(0);
      return;
    }

    const firstDuration = sync.buzzerTimerFirst ?? 5;
    const secondDuration = sync.buzzerTimerSecond ?? 10;
    const passedAt = sync.passedToOtherTeamAt;

    const tick = () => {
      const elapsed = (Date.now() - sync.buzzedAt!) / 1000;
      if (elapsed < firstDuration) {
        // First team's time
        setTimerPhase("first");
        setTimerSeconds(Math.ceil(firstDuration - elapsed));
      } else if (!passedAt) {
        // First timer expired, waiting for presenter to pass
        setTimerPhase("expired");
        setTimerSeconds(0);
      } else {
        // Presenter passed to other team
        const elapsedSincePass = (Date.now() - passedAt) / 1000;
        if (elapsedSincePass < secondDuration) {
          setTimerPhase("second");
          setTimerSeconds(Math.ceil(secondDuration - elapsedSincePass));
        } else {
          setTimerPhase("open");
          setTimerSeconds(0);
        }
      }
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [sync?.buzzedAt, sync?.buzzerLocked, sync?.buzzerTimerFirst, sync?.buzzerTimerSecond, sync?.passedToOtherTeamAt, sync?.buzzerIsOpenMode]);

  // Local answer handler (for direct game-page interaction)
  function handleAnswer(team: "team1" | "team2" | "skip") {
    awardCell(team);
    fetch("/api/game-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-buzzer" }),
    }).catch(() => {});
  }

  const isIdle = phase === "idle";
  const isSelected = phase === "selected";

  const buzzerTeamName =
    buzzerAnnounce === "team1"
      ? teams[0]?.name
      : buzzerAnnounce === "team2"
      ? teams[1]?.name
      : null;
  const buzzerColor = buzzerAnnounce === "team1" ? "#f97316" : "#22c55e";
  const otherTeamName =
    buzzerAnnounce === "team1"
      ? teams[1]?.name
      : buzzerAnnounce === "team2"
      ? teams[0]?.name
      : null;
  const otherTeamColor = buzzerAnnounce === "team1" ? "#22c55e" : "#f97316";

  // Active color changes based on timer phase
  const activeColor =
    timerPhase === "second"
      ? otherTeamColor
      : timerPhase === "expired"
      ? "#ef4444"
      : timerPhase === "open"
      ? "#eab308"
      : buzzerColor;

  return (
    <div className="game-bg min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            ح
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">حروف مع الاهدل</p>
            <p className="text-purple-400 text-xs">
              الجولة {currentRound} من {totalRounds}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold transition-colors"
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/")}
          >
            🏠
          </motion.button>
          <motion.button
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold transition-colors"
            whileTap={{ scale: 0.97 }}
            onClick={resetGame}
          >
            🔄
          </motion.button>
        </div>
      </header>

      {/* Question banner – full-width, visible from far */}
      <AnimatePresence>
        {sync?.showQuestion && sync.questionText && (
          <motion.div
            key="question-banner"
            className="mx-3 lg:mx-5 mt-3 rounded-2xl px-5 py-4 lg:py-5"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "tween", duration: 0.3 }}
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2))",
              border: "2px solid rgba(168,85,247,0.5)",
              boxShadow:
                "0 0 60px rgba(168,85,247,0.3), inset 0 0 40px rgba(168,85,247,0.08)",
            }}
          >
            <div className="flex items-center justify-center gap-4 lg:gap-6">
              {sync.selectedLetter && (
                <div
                  className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-3xl lg:text-5xl font-black text-white shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    boxShadow: "0 0 30px rgba(168,85,247,0.6)",
                  }}
                >
                  {sync.selectedLetter}
                </div>
              )}
              <p className="text-white text-xl sm:text-2xl lg:text-4xl font-black leading-relaxed text-center">
                {sync.questionText}
              </p>
            </div>
            {sync.category && (
              <div className="text-center mt-2">
                <span className="inline-block px-3 py-1 bg-purple-900/60 text-purple-300 rounded-full text-xs lg:text-sm font-semibold">
                  {sync.category}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4 lg:p-5 min-h-0 overflow-hidden">
        {/* Scoreboard (desktop) */}
        <aside className="hidden lg:flex w-44 xl:w-48 shrink-0 flex-col">
          <ScoreBoard
            teams={teams}
            currentRound={currentRound}
            totalRounds={totalRounds}
            phase={phase}
          />
        </aside>

        {/* Center: grid + controls */}
        <main className="flex-1 flex flex-col items-center gap-3 min-w-0">
          {/* Mobile scores */}
          <div className="flex lg:hidden gap-3 w-full">
            {teams.map((team) => (
              <div
                key={team.color}
                className="flex-1 glass-card py-2 px-3 flex items-center justify-between"
              >
                <div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: team.color === "team1" ? "#fb923c" : "#4ade80" }}
                  >
                    {team.name}
                  </div>
                  <div className="text-white/50 text-[10px]">
                    {team.color === "team1" ? "← أفقي →" : "↕ عمودي ↕"}
                  </div>
                </div>
                <div
                  className="text-2xl font-black"
                  style={{ color: team.color === "team1" ? "#fb923c" : "#4ade80" }}
                >
                  {team.score}
                </div>
              </div>
            ))}
          </div>

          {/* Hex grid */}
          <div className="glass-card w-full flex-1 flex items-center justify-center p-3 lg:p-5 min-h-0">
            <HexGrid
              grid={grid}
              onCellClick={isIdle ? selectCell : undefined}
              interactive={isIdle}
            />
          </div>

          {/* Action area */}
          <AnimatePresence mode="wait">
            {isSelected && selectedCell && (
              <motion.div
                key="selected-info"
                className="w-full max-w-lg mx-auto glass-card px-5 py-3 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <p className="text-purple-300 text-sm font-semibold">
                  حرف{" "}
                  <span className="text-white font-black text-lg">
                    «{selectedCell.letter}»
                  </span>{" "}
                  — بانتظار إجابة الفرق
                </p>

                {/* Inline quick controls for direct play */}
                <div className="flex gap-2 mt-3 justify-center">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#f97316" }}
                    onClick={() => handleAnswer("team1")}
                  >
                    ✅ {teams[0].name}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#22c55e" }}
                    onClick={() => handleAnswer("team2")}
                  >
                    ✅ {teams[1].name}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white/50 bg-white/5"
                    onClick={() => handleAnswer("skip")}
                  >
                    ⏭
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-bold text-amber-400 bg-amber-900/30 hover:bg-amber-900/50 transition-colors"
                    onClick={refreshQuestion}
                    title="سؤال بديل"
                  >
                    🔄 بديل
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* ── Buzzer announcement – non-blocking side panel ──── */}
      <AnimatePresence>
        {(buzzerAnnounce || (sync?.buzzerIsOpenMode && !sync?.buzzerLocked)) && (
          <motion.div
            key="buzzer-panel"
            className="fixed bottom-4 left-4 z-50 pointer-events-auto"
            initial={{ opacity: 0, x: -80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div
              className="rounded-2xl px-6 py-5 text-center min-w-[220px] max-w-[280px]"
              style={{
                background: buzzerAnnounce
                  ? `linear-gradient(135deg, ${activeColor}18, ${activeColor}35)`
                  : "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.20))",
                border: `2px solid ${buzzerAnnounce ? activeColor : "#eab308"}`,
                boxShadow: `0 0 40px ${buzzerAnnounce ? activeColor : "#eab308"}30`,
                backdropFilter: "blur(16px)",
                transition: "border-color 0.4s, box-shadow 0.4s, background 0.4s",
              }}
            >
              {/* Open mode – waiting state */}
              {!buzzerAnnounce && sync?.buzzerIsOpenMode && (
                <div>
                  <div className="text-3xl mb-2">🔓</div>
                  <p className="text-yellow-400 font-black text-base">مفتوح للجميع!</p>
                  <p className="text-white/40 text-xs mt-1">بانتظار ضغط الجرس...</p>
                </div>
              )}

              {/* Team info — shown after buzz: always in open mode, or during first timer phase */}
              {buzzerAnnounce && (!timerPhase || timerPhase === "first" || sync?.buzzerIsOpenMode) && (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-3xl">🔔</span>
                    <p
                      className="text-2xl font-black"
                      style={{ color: buzzerColor }}
                    >
                      {buzzerTeamName}
                    </p>
                  </div>
                  {sync?.buzzedPlayerName && (
                    <p className="text-white text-base font-bold mb-1">
                      🎮 {sync.buzzedPlayerName}
                    </p>
                  )}
                  <p className="text-white/50 text-xs font-semibold mb-3">
                    ضغط الجرس أولاً!
                  </p>
                </>
              )}

              {/* Timer display — only in non-open mode */}
              {buzzerAnnounce && !sync?.buzzerIsOpenMode && timerPhase && (
                <div
                  className="rounded-xl py-3 px-4"
                  style={{
                    background: `${activeColor}15`,
                    border: `1px solid ${activeColor}40`,
                    transition: "border-color 0.4s, background 0.4s",
                  }}
                >
                  {timerPhase === "first" && (
                    <>
                      <div
                        className="text-5xl font-black"
                        style={{ color: buzzerColor }}
                      >
                        {timerSeconds}
                      </div>
                      <p className="text-white/70 text-xs font-semibold mt-1">
                        ⏳ وقت {sync?.buzzedPlayerName || buzzerTeamName}
                      </p>
                    </>
                  )}
                  {timerPhase === "expired" && (
                    <>
                      <div className="text-3xl mb-1">⛔</div>
                      <p className="text-red-400 text-xs font-bold">
                        انتهى الوقت!
                      </p>
                    </>
                  )}
                  {timerPhase === "second" && (
                    <>
                      <div
                        className="text-5xl font-black"
                        style={{ color: otherTeamColor }}
                      >
                        {timerSeconds}
                      </div>
                      <p className="text-xs font-semibold mt-1" style={{ color: otherTeamColor }}>
                        ⏳ دور {otherTeamName}
                      </p>
                    </>
                  )}
                  {timerPhase === "open" && (
                    <>
                      <div className="text-3xl mb-1">🔓</div>
                      <p className="text-yellow-400 text-xs font-bold">
                        مفتوح للجميع!
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win screen */}
      <WinScreen onNextRound={nextRound} onRestart={resetGame} />
    </div>
  );
}

