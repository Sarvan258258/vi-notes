# Vi-Notes

Vi-Notes is an authenticity verification platform for human writing.

It analyzes both:
- What a user writes (content)
- How a user writes (behavioral signals like typing rhythm and paste activity)

The goal is to improve confidence in distinguishing genuine human writing from AI-generated or heavily assisted text.

## Features
- User authentication (register/login/logout)
- Writing editor with live session tracking
- Keystroke timing capture (hold and gap metrics)
- Paste event detection and character counts
- Session library to view saved writing sessions
- CSV export for model training and analysis workflows

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB

## Project Structure
```text
backend/   API, auth, persistence, export scripts
frontend/  Web UI and writing-behavior capture
packages/  Shared workspace package(s)
```

## Prerequisites
- Node.js 18+
- MongoDB running locally or remotely

## Setup
1. npm install
2. Create backend/.env with MONGO_URI=mongodb://localhost:27017/vi-notes

## Run (Development)
Start in two terminals from the repository root:

1. npm run dev:backend
2. npm run dev:web

Open the web app at http://localhost:5173/

## Build
1. npm run build:backend
2. npm run build:web

## Scripts
- npm run dev:web: Start frontend dev server
- npm run dev:frontend: Alias for frontend dev server
- npm run dev:backend: Start backend in watch mode
- npm run build:web: Build frontend for production
- npm run build:frontend: Alias for frontend build
- npm run build:backend: Build backend TypeScript

## Export training data
Export writing sessions for ML training (CSV by default):

1. npm --workspace backend run export:sessions -- --format csv --out exports/sessions.csv

Optional flags:
- --format csv
- --limit 100
- --label human
- --labelField label

## Core Data Collections
- users: account records and credentials metadata
- sessions: auth session tokens (login state)
- writingSessions: writing content + behavior summaries

## Notes on Privacy
- Vi-Notes focuses on behavioral metadata (timing and paste patterns)
- It is designed to avoid storing raw key-by-key secret input streams

## Contributing
Contributions are welcome. Please open an issue first for major changes or feature discussions.


