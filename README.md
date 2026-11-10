# SpeakSmart AI

SpeakSmart AI is a presentation practice app. Upload your presentation document, record yourself speaking, and get an AI transcript with feedback on how you spoke.

**Live app:** https://speak-smart-ai-sigma.vercel.app
**Backend API:** https://speaksmart-backend-0ine.onrender.com

> The backend runs on a free Render plan and sleeps when idle, so the first load can take up to 50 seconds.

## Features

- Upload a PDF or DOCX and extract its text
- Record your speech in the browser
- Speech-to-text transcription with Groq Whisper (`whisper-large-v3-turbo`)
- Feedback on filler words, speaking pace and sentence length
- Results dashboard for each practice session
- Practice history saved in the browser

## Tech Stack

| Part | Technology |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express, Multer |
| Document parsing | pdf-parse, mammoth |
| AI | Groq API (Whisper) |
| Hosting | Vercel (frontend), Render (backend) |

## Project Structure

```
SpeakSmart-AI/
  backend/    Express API (document upload, transcription, feedback)
  frontend/   React app (Home, Upload, Practice, Results, History)
```

## Run Locally

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key
```

Start it:

```bash
node server.js
```

The API runs at http://localhost:5000.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173. To point it at a
