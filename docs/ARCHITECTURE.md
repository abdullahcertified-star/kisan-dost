# Kisan Dost Architecture Document

## Overview
**Kisan Dost ("Farmer's Friend")** is a production-grade AI agricultural assistant tailored for Pakistani farmers.

## System Architecture

```
                       +-------------------------------+
                       |   Next.js 15+ Frontend (TS)   |
                       |    Tailwind CSS UI Client     |
                       +---------------+---------------+
                                       |
                                HTTP / REST
                                       v
                       +-------------------------------+
                       |        FastAPI Backend        |
                       |          (Port 8000)          |
                       +---------------+---------------+
                                       |
           +---------------------------+---------------------------+
           |                           |                           |
           v                           v                           v
+---------------------+     +--------------------+     +---------------------+
|  Google ADK/Gemini  |     |   SQLite Database  |     |   Open-Meteo API    |
| Multi-Agent System  |     | (Sessions/History) |     |  (Weather/Forecast) |
+---------------------+     +--------------------+     +---------------------+
```

## Backend Modules (`backend/app/`)
1. **`agents/`**: Multi-agent triage and specialist agents (Agronomy, Pest Doctor, Market, Finance).
2. **`tools/`**: Typed tools for crop advisory, fertilizer calculation, mandi prices, and weather.
3. **`guardrails/`**: Input validation, pesticide dosage safety checks, medical advice filtering.
4. **`models/`**: Pydantic schemas and database models.
5. **`services/`**: Integration services (Gemini ADK, Open-Meteo Weather, SQLite DB).
6. **`database/`**: Asynchronous SQLite engine via SQLAlchemy and aiosqlite.

## Safety & Guardrails
- **Input Guardrail**: Detects and rejects off-topic queries.
- **Output Guardrail**: Validates pesticide dosages to ensure safe usage thresholds, and forbids human medical advice.
