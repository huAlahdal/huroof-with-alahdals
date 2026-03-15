import { NextRequest, NextResponse } from "next/server";
import {
  getSyncState,
  updateSyncState,
  buzz,
  resetBuzzer,
  openBuzzer,
  passToOtherTeam,
  setPendingAction,
  clearPendingAction,
  resetFullState,
} from "@/lib/buzzerState";

export const dynamic = "force-dynamic";

/**
 * GET /api/game-sync  — returns current sync state (used for polling)
 */
export function GET() {
  return NextResponse.json(getSyncState());
}

/**
 * POST /api/game-sync — perform actions
 *
 * Body: { action: string, ...params }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    // ─── Buzzer ────────────────────────────────────────
    case "buzz": {
      const team = body.team as "team1" | "team2";
      if (!team) return NextResponse.json({ error: "missing team" }, { status: 400 });
      const result = buzz(team, body.playerName);
      return NextResponse.json({ success: result.success, state: result.state });
    }

    case "reset-buzzer": {
      const state = resetBuzzer();
      return NextResponse.json({ state });
    }

    case "open-buzzer": {
      const state = openBuzzer();
      return NextResponse.json({ state });
    }

    case "pass-to-other-team": {
      const state = passToOtherTeam();
      return NextResponse.json({ state });
    }

    // ─── Presenter controls ───────────────────────────
    case "show-question": {
      const state = updateSyncState({ showQuestion: true });
      return NextResponse.json({ state });
    }

    case "hide-question": {
      const state = updateSyncState({ showQuestion: false });
      return NextResponse.json({ state });
    }

    case "award-team1":
    case "award-team2":
    case "skip":
    case "random-cell":
    case "refresh-question":
    case "next-round":
    case "reset-game": {
      const state = setPendingAction(action);
      return NextResponse.json({ state });
    }

    // ─── Game page sync (push state from game page) ──
    case "sync": {
      const {
        team1Name,
        team2Name,
        team1Score,
        team2Score,
        currentRound,
        totalRounds,
        selectedLetter,
        questionText,
        answerText,
        category,
        difficulty,
        gameActive,
      } = body;

      const partial: Record<string, unknown> = {};
      if (team1Name !== undefined) partial.team1Name = team1Name;
      if (team2Name !== undefined) partial.team2Name = team2Name;
      if (team1Score !== undefined) partial.team1Score = team1Score;
      if (team2Score !== undefined) partial.team2Score = team2Score;
      if (currentRound !== undefined) partial.currentRound = currentRound;
      if (totalRounds !== undefined) partial.totalRounds = totalRounds;
      if (selectedLetter !== undefined) partial.selectedLetter = selectedLetter;
      if (questionText !== undefined) partial.questionText = questionText;
      if (answerText !== undefined) partial.answerText = answerText;
      if (category !== undefined) partial.category = category;
      if (difficulty !== undefined) partial.difficulty = difficulty;
      if (gameActive !== undefined) partial.gameActive = gameActive;

      const state = updateSyncState(partial);
      return NextResponse.json({ state });
    }

    // ─── Acknowledge a pending action ────────────────
    case "ack": {
      const state = clearPendingAction();
      return NextResponse.json({ state });
    }

    // ─── Full reset ──────────────────────────────────
    case "full-reset": {
      const state = resetFullState();
      return NextResponse.json({ state });
    }

    // ─── Timer configuration ─────────────────────────
    case "set-timer-config": {
      const partial: Record<string, unknown> = {};
      if (typeof body.buzzerTimerFirst === "number") partial.buzzerTimerFirst = body.buzzerTimerFirst;
      if (typeof body.buzzerTimerSecond === "number") partial.buzzerTimerSecond = body.buzzerTimerSecond;
      const state = updateSyncState(partial);
      return NextResponse.json({ state });
    }

    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
