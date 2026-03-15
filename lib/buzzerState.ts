/**
 * Server-side in-memory state for cross-device buzzer & game sync.
 * This persists across API calls within the same Node.js process.
 */

export interface SyncState {
  // Team config
  team1Name: string;
  team2Name: string;

  // Scores
  team1Score: number;
  team2Score: number;
  currentRound: number;
  totalRounds: number;

  // Current cell/question
  selectedLetter: string | null;
  questionText: string | null;
  answerText: string | null;
  category: string | null;
  difficulty: string | null;

  // Presenter controls
  showQuestion: boolean;

  // Buzzer
  buzzedTeam: "team1" | "team2" | null;
  buzzedAt: number | null;
  buzzedPlayerName: string | null;
  buzzerLocked: boolean;

  // Timer config (seconds)
  buzzerTimerFirst: number;
  buzzerTimerSecond: number;

  // Passed to other team (presenter triggers manually)
  passedToOtherTeamAt: number | null;

  // Open buzz mode: presenter unlocked buzzer for everyone, no timer
  buzzerIsOpenMode: boolean;

  // Pending action from presenter → game page
  pendingAction: PendingAction | null;

  // Change version (incremented on every mutation)
  version: number;

  // Game active flag
  gameActive: boolean;
}

export interface PendingAction {
  type:
    | "award-team1"
    | "award-team2"
    | "skip"
    | "random-cell"
    | "refresh-question"
    | "next-round"
    | "reset-game";
  timestamp: number;
}

// ─── Singleton state ───────────────────────────────────────────

const state: SyncState = {
  team1Name: "الفريق الأول",
  team2Name: "الفريق الثاني",
  team1Score: 0,
  team2Score: 0,
  currentRound: 1,
  totalRounds: 1,
  selectedLetter: null,
  questionText: null,
  answerText: null,
  category: null,
  difficulty: null,
  showQuestion: false,
  buzzedTeam: null,
  buzzedAt: null,
  buzzedPlayerName: null,
  buzzerLocked: false,
  buzzerTimerFirst: 5,
  buzzerTimerSecond: 10,
  passedToOtherTeamAt: null,
  buzzerIsOpenMode: false,
  pendingAction: null,
  version: 0,
  gameActive: false,
};

export function getSyncState(): SyncState {
  return { ...state };
}

export function updateSyncState(partial: Partial<SyncState>): SyncState {
  Object.assign(state, partial);
  state.version++;
  return { ...state };
}

/**
 * Attempt to buzz for a team. Returns true if this team got the buzz,
 * false if buzzer is already locked.
 */
export function buzz(team: "team1" | "team2", playerName?: string): { success: boolean; state: SyncState } {
  if (state.buzzerLocked) {
    return { success: false, state: { ...state } };
  }
  state.buzzedTeam = team;
  state.buzzedAt = Date.now();
  state.buzzedPlayerName = playerName ?? null;
  state.buzzerLocked = true;
  state.version++;
  return { success: true, state: { ...state } };
}

export function resetBuzzer(): SyncState {
  state.buzzedTeam = null;
  state.buzzedAt = null;
  state.buzzedPlayerName = null;
  state.buzzerLocked = false;
  state.passedToOtherTeamAt = null;
  state.buzzerIsOpenMode = false;
  state.version++;
  return { ...state };
}

/**
 * Open the buzzer to all — resets the lock and marks open mode so the
 * next buzz skips the countdown and just shows team + player name.
 */
export function openBuzzer(): SyncState {
  state.buzzedTeam = null;
  state.buzzedAt = null;
  state.buzzedPlayerName = null;
  state.buzzerLocked = false;
  state.passedToOtherTeamAt = null;
  state.buzzerIsOpenMode = true;
  state.version++;
  return { ...state };
}

export function passToOtherTeam(): SyncState {
  state.passedToOtherTeamAt = Date.now();
  state.version++;
  return { ...state };
}

export function setPendingAction(action: PendingAction["type"]): SyncState {
  state.pendingAction = { type: action, timestamp: Date.now() };
  state.version++;
  return { ...state };
}

export function clearPendingAction(): SyncState {
  state.pendingAction = null;
  state.version++;
  return { ...state };
}

export function resetFullState(): SyncState {
  state.team1Name = "الفريق الأول";
  state.team2Name = "الفريق الثاني";
  state.team1Score = 0;
  state.team2Score = 0;
  state.currentRound = 1;
  state.totalRounds = 1;
  state.selectedLetter = null;
  state.questionText = null;
  state.answerText = null;
  state.category = null;
  state.difficulty = null;
  state.showQuestion = false;
  state.buzzedTeam = null;
  state.buzzedAt = null;
  state.buzzedPlayerName = null;
  state.buzzerLocked = false;
  state.buzzerTimerFirst = 5;
  state.buzzerTimerSecond = 10;
  state.passedToOtherTeamAt = null;
  state.buzzerIsOpenMode = false;
  state.pendingAction = null;
  state.gameActive = false;
  state.version++;
  return { ...state };
}
