# Vi-Notes

Authenticity verification platform for human writing. This repo includes a web app and a backend API.

## Prerequisites
- Node.js 18+
- MongoDB running locally or remotely

## Setup
1. npm install
2. Create apps/backend/.env with MONGO_URI=mongodb://localhost:27017/vi-notes

## Run (two terminals)
1. npm run dev:backend
2. npm run dev:web

Open the web app at http://localhost:5173/

## Build
1. npm run build:backend
2. npm run build:web

## Export training data
Export writing sessions for ML training (CSV by default):

1. npm --workspace apps/backend run export:sessions -- --format csv --out exports/sessions.csv

Optional flags:
- --format csv
- --limit 100
- --label human
- --labelField label
