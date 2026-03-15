"use client";

import { create } from "zustand";
import {
  GridLayout,
  HexCell,
  createInitialGrid,
  checkWin,
  getRandomCell,
} from "@/lib/hexUtils";
import { Question, getAllQuestions, getQuestionsByLetter } from "@/lib/questions";

export interface Team {
  name: string;
  color: "team1" | "team2";
  score: number;
}

export type GamePhase =
  | "setup"         // Entering team names
  | "idle"          // Waiting to pick a letter
  | "selected"      // Letter chosen, question shown
  | "answered"      // Team answered, awarding cell
  | "win"           // Game over
  | "between_rounds"; // Round summary

export interface GameSettings {
  timerSeconds: number; // 0 = no timer
  totalRounds: number;
}

export interface GameState {
  phase: GamePhase;
  grid: GridLayout;
  teams: [Team, Team];
  currentRound: number;
  totalRounds: number;
  selectedCell: HexCell | null;
  currentQuestion: Question | null;
  timerSeconds: number;
  winner: "team1" | "team2" | "draw" | null;
  questionHistory: { question: Question; winner: "team1" | "team2" | "skip" }[];

  // Actions
  startSetup: () => void;
  setTeamName: (index: 0 | 1, name: string) => void;
  startGame: (settings: GameSettings) => void;
  pickRandomCell: () => void;
  selectCell: (id: string) => void;
  awardCell: (team: "team1" | "team2" | "skip") => void;
  nextRound: () => void;
  resetGame: () => void;
  refreshQuestion: () => void;
}

const DEFAULT_TEAMS: [Team, Team] = [
  { name: "الفريق الأول", color: "team1", score: 0 },
  { name: "الفريق الثاني", color: "team2", score: 0 },
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: "setup",
  grid: createInitialGrid(),
  teams: structuredClone(DEFAULT_TEAMS),
  currentRound: 1,
  totalRounds: 1,
  selectedCell: null,
  currentQuestion: null,
  timerSeconds: 30,
  winner: null,
  questionHistory: [],

  startSetup: () =>
    set({ phase: "setup", grid: createInitialGrid(), teams: structuredClone(DEFAULT_TEAMS), currentRound: 1, winner: null, selectedCell: null, currentQuestion: null, questionHistory: [] }),

  setTeamName: (index, name) =>
    set((state) => {
      const teams = [...state.teams] as [Team, Team];
      teams[index] = { ...teams[index], name };
      return { teams };
    }),

  startGame: (settings) =>
    set((state) => ({
      phase: "idle",
      grid: createInitialGrid(),
      totalRounds: settings.totalRounds,
      timerSeconds: settings.timerSeconds,
      teams: state.teams.map((t) => ({ ...t, score: 0 })) as [Team, Team],
      currentRound: 1,
      winner: null,
      selectedCell: null,
      currentQuestion: null,
      questionHistory: [],
    })),

  pickRandomCell: () => {
    const { grid } = get();
    const cell = getRandomCell(grid);
    if (!cell) return;
    const questions = getAllQuestions();
    const letterQuestions = getQuestionsByLetter(cell.letter, questions);
    const question =
      letterQuestions.length > 0
        ? letterQuestions[Math.floor(Math.random() * letterQuestions.length)]
        : null;

    set((state) => ({
      phase: "selected",
      selectedCell: cell,
      currentQuestion: question,
      grid: state.grid.map((row) =>
        row.map((c) => ({ ...c, isSelected: c.id === cell.id }))
      ),
    }));
  },

  selectCell: (id) => {
    const { grid } = get();
    const cell = grid.flat().find((c) => c.id === id);
    if (!cell || cell.owner !== null) return;

    const questions = getAllQuestions();
    const letterQuestions = getQuestionsByLetter(cell.letter, questions);
    const question =
      letterQuestions.length > 0
        ? letterQuestions[Math.floor(Math.random() * letterQuestions.length)]
        : null;

    set((state) => ({
      phase: "selected",
      selectedCell: cell,
      currentQuestion: question,
      grid: state.grid.map((row) =>
        row.map((c) => ({ ...c, isSelected: c.id === id }))
      ),
    }));
  },

  awardCell: (team) => {
    const { selectedCell, grid, teams, currentQuestion, questionHistory, totalRounds, currentRound } = get();
    if (!selectedCell) return;

    let newGrid = grid.map((row) =>
      row.map((c) =>
        c.id === selectedCell.id
          ? { ...c, owner: team === "skip" ? null : team, isSelected: false }
          : { ...c, isSelected: false }
      )
    );

    const newHistory = currentQuestion
      ? [...questionHistory, { question: currentQuestion, winner: team }]
      : questionHistory;

    // Check win for the awarded team
    let winner: "team1" | "team2" | "draw" | null = null;
    let newTeams = [...teams] as [Team, Team];

    if (team !== "skip") {
      if (checkWin(newGrid, team)) {
        winner = team;
        newTeams = newTeams.map((t) =>
          t.color === team ? { ...t, score: t.score + 1 } : t
        ) as [Team, Team];
      }
    }

    // Check if all cells are claimed (draw for this round)
    const allClaimed = newGrid.flat().every((c) => c.owner !== null);
    if (!winner && allClaimed) {
      winner = "draw";
    }

    if (winner) {
      // End of round
      if (currentRound >= totalRounds) {
        // Check if scores are tied → need tiebreaker
        if (newTeams[0].score === newTeams[1].score) {
          set({ grid: newGrid, phase: "between_rounds", winner, teams: newTeams, selectedCell: null, currentQuestion: null, questionHistory: newHistory });
        } else {
          set({ grid: newGrid, phase: "win", winner, teams: newTeams, selectedCell: null, currentQuestion: null, questionHistory: newHistory });
        }
      } else {
        set({ grid: newGrid, phase: "between_rounds", winner, teams: newTeams, selectedCell: null, currentQuestion: null, questionHistory: newHistory });
      }
    } else {
      set({ grid: newGrid, phase: "idle", selectedCell: null, currentQuestion: null, questionHistory: newHistory });
    }
  },

  nextRound: () =>
    set((state) => ({
      phase: "idle",
      grid: createInitialGrid(),
      currentRound: state.currentRound + 1,
      selectedCell: null,
      currentQuestion: null,
      winner: null,
      questionHistory: [],
    })),

  resetGame: () =>
    set({
      phase: "setup",
      grid: createInitialGrid(),
      teams: structuredClone(DEFAULT_TEAMS),
      currentRound: 1,
      totalRounds: 1,
      selectedCell: null,
      currentQuestion: null,
      winner: null,
      questionHistory: [],
    }),

  refreshQuestion: () => {
    const { selectedCell, currentQuestion } = get();
    if (!selectedCell) return;
    const questions = getAllQuestions();
    const letterQuestions = getQuestionsByLetter(selectedCell.letter, questions).filter(
      (q) => q.id !== currentQuestion?.id
    );
    if (letterQuestions.length === 0) return;
    const question = letterQuestions[Math.floor(Math.random() * letterQuestions.length)];
    set({ currentQuestion: question });
  },
}));
