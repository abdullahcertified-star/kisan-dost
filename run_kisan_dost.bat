@echo off
title Kisan Dost - AI Agricultural Assistant
echo ======================================================================
echo                🌾 KISAN DOST - AI AGRONOMY PLATFORM
echo ======================================================================
echo.

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "Kisan Dost - Backend (FastAPI)" cmd /k ".venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on http://localhost:3000 ...
cd frontend
start "Kisan Dost - Frontend (Next.js)" cmd /k "npm start"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo [✔] Both services are running!
echo.
echo  - Dashboard:          http://localhost:3000
echo  - 🎯 Hackathon Demo:  http://localhost:3000/demo
echo  - 💬 AI Assistant:    http://localhost:3000/assistant
echo  - 🔍 Observability:   http://localhost:3000/observability
echo  - 📚 Backend Docs:    http://127.0.0.1:8000/docs
echo ======================================================================
echo.
pause
