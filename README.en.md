<div align="center">

# حروف مع الاهدل

**An Arabic letter knowledge game played on a hexagonal board**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-latest-ff0055?style=flat-square&logo=framer)](https://www.framer.com/motion/)

*Two teams compete to claim Arabic letters on a honeycomb grid by answering trivia questions. First to connect their edges wins.*

<br/>

<img src="https://i.imgur.com/8NLODGN.png" width="100%" alt="Game Board" />

</div>

---

## Overview

**حروف مع الاهدل** (Huroof with Al-Ahdal) is a multiplayer knowledge game designed for live events, classrooms, and social gatherings. A host controls the game from their laptop while teams buzz in from their phones — everything syncs in real time over a local network.

The game is built on a **5×5 hexagonal grid** where each cell represents an Arabic letter. Answering a question correctly claims that cell for your team. The winning condition is inspired by the board game *Hex*: connect your two opposite sides before the other team connects theirs.

---

## Features

| Feature | Description |
|---------|-------------|
| 🔷 **Hexagonal Grid** | SVG-rendered 5×5 honeycomb with 25 Arabic letters |
| 🟠🟢 **Two Teams** | Orange (horizontal path) vs Green (vertical path) |
| 🧠 **180+ Questions** | Categorized by letter, with Easy / Medium / Hard difficulty |
| 🔔 **Multi-Device Buzzer** | Teams buzz in from their phones — first press wins |
| 🎛 **Presenter Panel** | Host controls questions, answers, awards, and buzzer from a separate device |
| 🔄 **Replace Question** | Swap out a question if neither team can answer |
| 📋 **Question Admin** | Add, edit, and delete custom questions in-browser |
| 🏆 **Multi-Round Play** | Track scores across multiple rounds |
| 📺 **Projector-Ready** | Large display mode with full-width question banner |
| ✨ **Smooth Animations** | Framer Motion transitions throughout |
| 🌐 **Full Arabic UI** | RTL layout with Cairo font |

---

## How It Works — Win Condition

The game uses **Breadth-First Search (BFS)** to detect a winning connection after every cell claim:

- 🟠 **Team Orange** — must form a connected chain from the **left edge** to the **right edge**
- 🟢 **Team Green** — must form a connected chain from the **top edge** to the **bottom edge**

The hexagonal grid makes diagonal paths possible, so both teams can block and outmaneuver each other.

---

## Tech Stack

| Technology | Role |
|-----------|------|
| [Next.js 16](https://nextjs.org/) (App Router) | Full-stack framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe codebase |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Zustand](https://zustand.docs.pmnd.rs/) | Client-side game state |
| SVG | Hexagonal grid rendering |
| Next.js API Route | Server-side buzzer sync (in-memory) |

---

## Requirements

- **Node.js** 18.0 or later
- **npm**, **yarn**, or **pnpm**

---

## Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/hroofwithalahdal.git
cd hroofwithalahdal

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
hroofwithalahdal/
├── app/
│   ├── page.tsx                  # Home / game setup
│   ├── game/page.tsx             # Main game display (projector screen)
│   ├── admin/page.tsx            # Question management
│   ├── presenter/page.tsx        # Host control panel
│   ├── buzz/[team]/page.tsx      # Team buzzer (mobile)
│   └── api/game-sync/route.ts   # Real-time sync API
├── components/
│   ├── HexGrid.tsx               # SVG hexagonal grid + border indicators
│   ├── ScoreBoard.tsx            # Team scores sidebar
│   ├── SetupModal.tsx            # Pre-game configuration modal
│   └── WinScreen.tsx             # Win celebration overlay
└── lib/
    ├── gameStore.ts              # Zustand game state & actions
    ├── hexUtils.ts               # Hex math, BFS win detection
    ├── questions.ts              # Built-in question database (180+)
    └── buzzerState.ts            # Server-side buzzer singleton
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — configure teams and start game |
| `/game` | Game board — display on projector or TV |
| `/presenter` | Host panel — manage questions, buzzer, and awards |
| `/buzz/team1` | Buzzer for Team 1 (open on phone) |
| `/buzz/team2` | Buzzer for Team 2 (open on phone) |
| `/admin` | Question database management |

---

## Multi-Device Setup

The game is designed to run across **four devices simultaneously** on the same local network:

```
┌─────────────────────────────────────────────────────────┐
│                    Same WiFi Network                     │
│                                                         │
│  📺 Projector/TV          💻 Host Laptop               │
│  /game                    /presenter                    │
│  Shows grid + questions   Controls everything           │
│                                                         │
│  📱 Team 1 Phone          📱 Team 2 Phone              │
│  /buzz/team1              /buzz/team2                   │
│  Big buzzer button        Big buzzer button             │
└─────────────────────────────────────────────────────────┘
```

**Steps:**
1. Run the server on one machine: `npm run dev` (or `npm start`)
2. Find that machine's local IP (e.g. `192.168.1.10`)
3. Open `http://[IP]:3000/game` on the display screen
4. Open `http://[IP]:3000/presenter` on the host device
5. Share `/buzz/team1` and `/buzz/team2` links with each team

> **Note:** All sync is done via a lightweight in-memory API route — no database or external services required.

---

## Gameplay

### Setup
1. Go to `/` and press **ابدأ اللعبة** (Start Game)
2. Enter team names and number of rounds
3. Press **ابدأ** (Start)

### Each Turn
1. Click any empty cell on the grid to select a letter
2. The host reveals the question on the presenter panel
3. The host can optionally push the question to the main display (`أظهر السؤال`)
4. Teams buzz in from their phones — first press locks the buzzer
5. Host awards the cell to the answering team, or skips if both fail
6. If neither team can answer, the host can replace the question with `🔄 سؤال بديل`

### Winning
- The game uses BFS after every cell award to check for a winning path
- A win screen with confetti plays automatically

---

## Question Management

Visit `/admin` to manage the question database:

- Browse all questions filtered by Arabic letter
- Add new questions with letter, category, difficulty, and answer
- Edit or delete existing questions
- Custom questions are stored in `localStorage` and persist across sessions

The built-in database ships with **180+ questions** covering all 25 Arabic letters used in the grid.

---

## Screenshots

<table>
  <tr>
    <td><img src="https://i.imgur.com/8NLODGN.png" alt="Game Board" /></td>
    <td><img src="https://i.imgur.com/1NG5rvY.png" alt="Game Board 2" /></td>
  </tr>
  <tr>
    <td align="center"><em>Game Board</em></td>
    <td align="center"><em>Game Board — Question Revealed</em></td>
  </tr>
  <tr>
    <td><img src="https://i.imgur.com/qj0tNWZ.png" alt="Home Setup" /></td>
    <td><img src="https://i.imgur.com/NEQ0i6v.png" alt="Presenter Panel" /></td>
  </tr>
  <tr>
    <td align="center"><em>Home — Team Setup</em></td>
    <td align="center"><em>Presenter Control Panel</em></td>
  </tr>
  <tr>
    <td><img src="https://i.imgur.com/Dpu4ZrO.png" alt="Presenter Panel 2" /></td>
    <td><img src="https://i.imgur.com/g0wUNaV.png" alt="Team Buzzer" /></td>
  </tr>
  <tr>
    <td align="center"><em>Presenter — Answer &amp; Award</em></td>
    <td align="center"><em>Team Buzzer (Mobile)</em></td>
  </tr>
  <tr>
    <td><img src="https://i.imgur.com/4sOYymI.png" alt="Buzzer Pressed" /></td>
    <td><img src="https://i.imgur.com/nKARSkG.png" alt="Admin Panel" /></td>
  </tr>
  <tr>
    <td align="center"><em>Buzzer — Name Entry</em></td>
    <td align="center"><em>Question Admin Panel</em></td>
  </tr>
  <tr>
    <td><img src="https://i.imgur.com/OZgkhUr.png" alt="Win Screen" /></td>
    <td><img src="https://i.imgur.com/iMNwpoM.png" alt="Tiebreaker" /></td>
  </tr>
  <tr>
    <td align="center"><em>Win Screen</em></td>
    <td align="center"><em>Tiebreaker Round</em></td>
  </tr>
</table>

---

## License

This project is intended for educational and entertainment use.

---

<div align="center">
  Made with ❤️ for Arabic trivia nights &nbsp;•&nbsp; <strong>حروف مع الاهدل</strong>
</div>
