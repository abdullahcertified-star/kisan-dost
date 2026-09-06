# 🌾 Kisan Dost (کسان دوست) — AI Agricultural Operating System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://kisan-dost-beige.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-114%20Passing-brightgreen?style=for-the-badge&logo=pytest)](https://github.com/abdullahcertified-star/kisan-dost)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **Empowering 8.2 million Pakistani smallholder farmers with hyper-localized agronomy, dosage-capped pest diagnostics, verified AMIS Punjab mandi intelligence, and government subsidy financing in English, Urdu (اردو), and Roman Urdu.**

---

### 🌐 Live Production Deployment
* **Live Web App**: [https://kisan-dost-beige.vercel.app](https://kisan-dost-beige.vercel.app)
* **Interactive AI Assistant**: [https://kisan-dost-beige.vercel.app/assistant](https://kisan-dost-beige.vercel.app/assistant)
* **1-Click Hackathon Demo Flow**: [https://kisan-dost-beige.vercel.app/demo](https://kisan-dost-beige.vercel.app/demo)
* **ADK Observability & Trace Visualizer**: [https://kisan-dost-beige.vercel.app/observability](https://kisan-dost-beige.vercel.app/observability)

---

## 🌟 The 5-Pillar Demo Flow

Kisan Dost is purpose-built to solve Pakistan's agricultural productivity gap through our signature **5-Pillar Decision Package**:

```
[ Farmer Inquiry: 5 Acres in Multan, Limited Water ]
                         │
                         ▼
             🛡️ Triage Coordinator
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
🌾 Crop Advisor   ⚖️ Fertilizer    📈 Mandi Rates   💰 Finance/Schemes
   Canola/Mustard    DAP & Urea Bags   Wheat PKR 3,900   PKR 3.8-4.5L Net Profit
   40% Less Water    Prescribed Split  Canola PKR 8,200  CM Kisan Card & Tractors
```

1. **🌾 Crop Suitability**: Evaluates 12+ Pakistani agro-ecological zones, Rabi/Kharif seasons, canal/tubewell water constraints, and soil salinity.
2. **⚖️ Precision Fertilizer Plan**: Soil-specific NPK requirements mathematically converted into DAP, Urea, and SOP bags with cost breakdowns.
3. **📈 Mandi Wholesale Intelligence**: Real-time reference prices synced with Punjab Agriculture Marketing Wing (AMIS).
4. **💰 Net Profitability Engine**: Comprehensive budgeting (land prep, irrigation, fertilizer, harvesting, expected yield, and net margin).
5. **🏛️ Government Subsidy Integration**: Direct eligibility matching for **CM Punjab Kisan Card** (PKR 150,000 interest-free credit) and **CM Green Tractor Scheme** (PKR 1,000,000 flat subsidy).

---

## 🛡️ Multi-Agent Architecture & Safety Guardrails

Kisan Dost utilizes **Google Agent Development Kit (ADK)** design patterns with autonomous specialized agents and strict multi-layered safety guardrails:

| Specialist Agent | Role | Capabilities |
| :--- | :--- | :--- |
| **🛡️ Triage Coordinator** | Central Router | Language detection (Urdu/Roman Urdu/EN), intent parsing, multi-turn conversation memory, and guardrail enforcement. |
| **🌾 Agronomy Specialist** | Crop Planner | Eco-zone crop selection, water-budgeting, seed varieties (e.g. Akbar-19, Dilkash-20, Super Basmati), and planting calendars. |
| **🔬 Pest Doctor** | Safe Diagnostics | IPM pest/disease treatment with **hardcoded lethal dosage caps** (Pyriproxyfen, Diafenthiuron, Chlorantraniliprole). |
| **📈 Mandi Specialist** | Market Pricing | Live spot benchmark prices, 40-kg maund conversions, and 7-day historical trading ranges. |
| **💰 Finance Specialist** | Economics | Farm cash-flow budgeting, tractor market prices (Millat MF-240/385), and government relief matching. |

### 🔒 Safety Guardrails (Zero-Tolerance Policy)
* **Human Medical Intercept**: Automatically detects human symptoms (paracetamol, fever, cough) and redirects users to healthcare professionals.
* **Chemical Weapon / Synthesis Block**: Hardcoded regex and semantic blocks preventing hazardous poison, explosive, or suicide synthesis.
* **Pesticide Overdose Protection**: Intercepts requests for dangerous chemical multipliers (e.g., "triple dose") and enforces Punjab Extension safe limits.
* **Deterministic Fallback Engine**: If cloud LLM API quotas are saturated, the system seamlessly transitions to verified deterministic agricultural algorithms without failing.

---

## 🖥️ Interactive CLI Terminal Assistant

In addition to the Next.js web application, Kisan Dost features an interactive terminal agent:

```bash
# Run interactive CLI
python terminal_agent.py
```

Features:
* Full bilingual chat (Urdu script, Roman Urdu, and English)
* Live ADK trace execution logging
* Quick commands: `demo`, `tractor`, `wheat`, `pest`, `schemes`, `help`, `exit`

---

## 🚀 Local Development Quickstart

### Prerequisites
* Python 3.10+
* Node.js 18+
* Google Gemini API Key (optional, fallback engine included)

### 1. Clone the Repository
```bash
git clone https://github.com/abdullahcertified-star/kisan-dost.git
cd kisan-dost
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # Linux / macOS

# Install Python dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add GEMINI_API_KEY if available

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Comprehensive Automated Test Suite

Kisan Dost includes **114 automated pytest tests** auditing backend endpoints, agronomy calculators, safety guardrails, observability tracers, and bilingual parsing:

```bash
# Run complete test suite
pytest tests/ -v
```

```text
============================== 114 passed in 14.82s ==============================
tests/test_api.py ......................... [ 21%]
tests/test_crop_advisor.py ................ [ 35%]
tests/test_demo_mode.py .................. [ 51%]
tests/test_fertilizer_calculator.py ....... [ 64%]
tests/test_guardrails.py .................. [ 80%]
tests/test_mandi_service.py ............... [ 89%]
tests/test_observability_and_tracing.py ... [ 96%]
tests/test_schemes_and_bilingual.py ....... [100%]
```

---

## 📁 Repository Structure

```text
KISAN_DOST/
├── app/                        # Next.js App Router (Frontend)
│   ├── page.tsx                # Farmer Operations Dashboard
│   ├── assistant/page.tsx      # Multi-Agent Interactive Chatbot
│   ├── demo/page.tsx           # 1-Click Guided Hackathon Flow
│   ├── observability/page.tsx  # ADK Live Trace Monitor
│   ├── advisor/page.tsx        # Crop Advisor Tool
│   ├── fertilizer/page.tsx     # Precision NPK Calculator
│   ├── market/page.tsx         # Mandi Rate Explorer
│   ├── profit/page.tsx         # Farm Profitability Calculator
│   ├── schemes/page.tsx        # Punjab Govt Subsidies Explorer
│   └── api/                    # Native Vercel Serverless Route Handlers
│       ├── chat/route.ts       # Unified Chat API Endpoint
│       └── health/route.ts     # Health Probe
├── backend/                    # Core Python Agricultural Engine
│   └── app/
│       ├── agents/             # Triage, Agronomy, Pest Doctor, Market, Finance
│       ├── guardrails/         # Safety & Input Guardrail Interceptors
│       ├── tools/              # Crop, Fertilizer, Weather, Profit Calculators
│       ├── services/           # Observability Tracer, Context, Weather, Mandi
│       └── database/           # SQLite Persistence Engine
├── components/                 # Reusable React UI Components
├── data/                       # Offline Pakistani Agricultural Catalogues
├── tests/                      # 114 Pytest Verification Test Suites
├── terminal_agent.py           # CLI Interactive Terminal Agent
├── Dockerfile                  # Container definition for 24/7 deployment
├── requirements.txt            # Python Dependencies
├── package.json                # Next.js & Frontend Dependencies
└── README.md                   # Project Documentation
```

---

## 🏆 Hackathon Value Proposition

* **Radically Accessible**: Fully usable by uneducated or semi-literate farmers via natural Urdu script and Roman Urdu voice-to-text.
* **100% Free Hosting Architecture**: Unified deployment on Vercel with zero external hosting bills.
* **Deterministic Ground Truth**: Critical dosages, water budgets, and market benchmarks are anchored in verified agricultural science, completely eliminating LLM hallucinations.
* **Actionable ROI**: Directly connects scientific crop planning to concrete economic output and verified Punjab government subsidies.

---

### 👨‍💻 Author & Acknowledgements
* Developed by **Abdullah** ([@abdullahcertified-star](https://github.com/abdullahcertified-star))
* Built for the **Kisan Dost AI Hackathon** 🇵🇰
