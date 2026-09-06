# Kisan Dost (Farmer's Friend) - AI Agricultural Assistant

Production-quality full-stack AI agronomy platform for Pakistani farmers, built with FastAPI, Google Gemini / ADK, Next.js, Tailwind CSS, and Open-Meteo.

## Project Structure
```
KISAN-DOST/
  ├── backend/               # FastAPI Python Backend
  │   ├── app/
  │   │   ├── main.py        # FastAPI app & routing
  │   │   ├── config.py      # App configuration & settings
  │   │   ├── agents/        # AI multi-agent orchestration
  │   │   ├── tools/         # Agricultural calculation & lookup tools
  │   │   ├── models/        # Pydantic & SQLAlchemy data schemas
  │   │   ├── services/      # External integrations (Gemini, Open-Meteo)
  │   │   ├── database/      # SQLite async persistence
  │   │   ├── guardrails/    # Input & pesticide safety guardrails
  │   │   └── utils/         # Helpers & logging
  │   └── requirements.txt   # Backend dependencies
  ├── frontend/              # Next.js TypeScript Frontend
  │   ├── app/               # App router pages & layouts
  │   ├── components/        # Reusable UI components
  │   ├── lib/               # Utility functions & API client
  │   ├── types/             # TypeScript types
  │   └── public/            # Static assets
  ├── tests/                 # Automated tests (Pytest)
  ├── data/                  # Offline agricultural datasets & SQLite db
  ├── docs/                  # Architectural & API documentation
  ├── .env.example           # Environment template
  └── README.md
```

## Quick Start

### 1. Backend Setup
```bash
# Activate virtual environment
.\.venv\Scripts\Activate.ps1   # Windows PowerShell

# Install dependencies
pip install -r backend/requirements.txt

# Run backend API
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend Swagger API documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The web dashboard runs at `http://localhost:3000`.

### 3. Run Automated Tests
```bash
python -m pytest tests
```
