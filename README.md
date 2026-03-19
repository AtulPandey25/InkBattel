# Ink Battle

Ink Battle is a real-time multiplayer drawing and guessing game. One player draws, others race to guess the word, and points are awarded based on speed and accuracy.

## Deployed App

https://ink-battle.vercel.app

## Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=111827)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=ffffff)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=ffffff)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=ffffff)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=ffffff)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2-764ABC?logo=redux&logoColor=ffffff)
![Zustand](https://img.shields.io/badge/Zustand-State%20Store-000000?logo=react&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=ffffff)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=ffffff)

## Screenshots

Home Screen:

![Home Screen](./screenshots/home-screen.png)

Ground Screen:

![Ground Screen](./screenshots/ground-screen.png)

## Game Overview

Ink Battle is built around quick rounds and fun social competition:

1. The host creates a room and invites players.
2. On each round, one player becomes the drawer.
3. The drawer selects a word from choices and starts sketching.
4. Other players guess in chat while hints reveal gradually.
5. Faster correct guesses get higher scores.
6. Roles rotate each round until the match ends.
7. Final scoreboard shows the winner.

## Features

- Real-time room and game state sync with Socket.IO.
- Multiplayer drawing board with live strokes.
- Word-choice rounds with hint reveal support.
- Score tracking, round flow, and final ranking.
- Host controls, room sharing, and replay support.

## Run Locally

Requirements:

- Node.js 18+ (Node.js 22 recommended)
- npm

1. Clone the repository.
2. Open two terminals.

Terminal 1: Backend

```bash
cd backend
npm install
npm run dev
```

Terminal 2: Frontend

```bash
cd scribble
npm install
npm run dev
```

Open the frontend URL shown by Vite (typically http://localhost:5173).

## Environment Setup

Frontend can use:

- VITE_SOCKET_URL (defaults to http://localhost:8000)

Backend can use:

- CLIENT_URL (defaults to http://localhost:5173)

## Play Online

Use the deployed app here:

https://ink-battle.vercel.app