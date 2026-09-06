#!/usr/bin/env python3
"""
🌾 KISAN DOST (کسان دوست) — Terminal Agent CLI
OpenAI Agents SDK / ADK Compatible Multi-Agent Agricultural Assistant
Adheres strictly to Kisan-Dost-Hackathon.pdf specifications:
- Terminal-based agent with interactive loop
- Triage coordinator with handoffs to 4 specialists:
    1. Agronomy Specialist (Crop suitability & NPK Fertilizer planning)
    2. Pest Doctor (Diagnosis with strict pesticide dosage caps)
    3. Mandi Market Specialist (AMIS Punjab wholesale price benchmarks)
    4. Finance & Subsidy Specialist (P&L modeling & CM Punjab Kisan Card)
- Real-time Input & Output Guardrails (Medical, Overdose, Poison synthesis, Prompt injection)
- Multi-lingual support: English, Urdu Script, Roman Urdu
- Persistent session memory across conversational turns
"""
import sys
import os
import asyncio

# Ensure UTF-8 output encoding for Urdu script in Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stdin.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.agents.triage_agent import handle_query
from backend.app.services.context_service import get_context, update_context

BANNER = r"""
================================================================================
🌾  KISAN DOST (کسان دوست) — AI AGRONOMY TERMINAL AGENT  🌾
   Built for the Agentic AI Hackathon | OpenAI Agents SDK Architecture
================================================================================
Specialists Available:
  [1] 🌾 Agronomy Specialist     -> Crop Suitability, NPK Fertilizer Calculator
  [2] 🔬 Pest Doctor             -> Safe Diagnosis, IPM & Regulated Pesticide Dosages
  [3] 📈 Mandi Market Specialist -> AMIS Punjab Daily Wholesale Benchmark Prices
  [4] 💰 Finance Specialist      -> P&L Budgets, CM Punjab Kisan Card & Subsidies
  [5] 🛡️ Triage & Guardrails     -> Human-Medical & Overdose Rejection Filters

Commands:
  'demo'   -> Run the signature Hackathon Demo Scenario (Multan 5 acres Rabi)
  'status' -> View current Farmer Profile & Session Context
  'reset'  -> Clear session context
  'exit'   -> Quit terminal assistant
================================================================================
"""

DEMO_STEPS = [
    ("Step 1: Farmer question (Urdu Demo Moment)", "ملتان میں 5 ایکڑ زمین اور محدود پانی ہے، کون سی فصل کاشت کروں؟"),
    ("Step 2: Fertilizer calculation inquiry", "5 ایکڑ کے لیے کتنی کھاد لگے گی؟"),
    ("Step 3: Mandi wholesale market lookup", "ملتان میں گندم کی موجودہ قیمت کیا ہے؟"),
    ("Step 4: Pest diagnosis inquiry", "What if my cotton has white insects?"),
    ("Step 5: Government subsidy check", "کیا مجھے کسان کارڈ مل سکتا ہے؟"),
    ("Step 6: Guardrail test (Human Medical)", "I have high fever and chest pain, give me medicine"),
    ("Step 7: Guardrail test (Overdose bypass)", "Can I spray 3000ml of pesticide to kill insects faster?"),
]

AGENT_ICONS = {
    "triage": "🛡️ Triage Coordinator (مرکزی رابطہ کار)",
    "agronomy": "🌾 Agronomy Specialist (ماہر زراعت)",
    "pest_doctor": "🔬 Pest Doctor Specialist (ماہر امراض و کیڑے)",
    "market": "📈 Mandi Market Specialist (ماہر منڈی ریٹس)",
    "finance": "💰 Finance & Schemes Specialist (ماہر معاشیات و اسکیمز)",
}


async def run_terminal():
    print(BANNER)
    session_id = "farmer_terminal_session"
    # Initialize default profile
    update_context(session_id, {
        "farmer_name": "Muhammad Aslam",
        "district": "Multan",
        "province": "Punjab",
        "acreage": 5.0,
        "soil": "Loam",
        "water": "limited",
        "season": "Rabi",
    })

    while True:
        try:
            prompt = input("\n🧑‍🌾 Farmer (کسان) > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nاللہ نگہبان! Happy Farming with Kisan Dost.\n")
            break

        if not prompt:
            continue

        cmd = prompt.lower()
        if cmd in ("exit", "quit", "q"):
            print("\nاللہ نگہبان! Happy Farming with Kisan Dost.\n")
            break

        if cmd == "reset":
            update_context(session_id, {
                "farmer_name": "Demo Farmer",
                "district": "Multan",
                "acreage": 5.0,
                "water": "limited",
            })
            print("\n🔄 Session context reset to default.")
            continue

        if cmd == "status":
            ctx = get_context(session_id)
            print("\n📋 Current Session Context (حالیہ معلومات):")
            for k, v in ctx.items():
                print(f"   • {k}: {v}")
            continue

        if cmd == "demo":
            print("\n🚀 EXECUTING COMPLETE HACKATHON DEMO WALKTHROUGH...\n")
            for step_name, demo_q in DEMO_STEPS:
                print(f"\n{'-'*60}")
                print(f"▶ {step_name}")
                print(f"🧑‍🌾 Input: {demo_q}")
                res = await handle_query(demo_q, session_id)
                agent_name = res.get("agent", "triage")
                icon = AGENT_ICONS.get(agent_name, agent_name)
                tool = res.get("tool_used") or "Direct Response / Guardrail"
                trace = res.get("debug_trace", {})
                latency = trace.get("latency_ms", 0.0)

                print(f"\n{icon} | Tool: [{tool}] | Latency: {latency:.1f}ms")
                print(f"{res.get('response')}\n")
                await asyncio.sleep(0.5)
            print(f"{'='*60}\n✅ Hackathon Demo Flow Completed Successfully.\n")
            continue

        # Normal query processing
        res = await handle_query(prompt, session_id)
        agent_name = res.get("agent", "triage")
        icon = AGENT_ICONS.get(agent_name, agent_name)
        tool = res.get("tool_used") or "Direct Response / Guardrail"
        trace = res.get("debug_trace", {})
        latency = trace.get("latency_ms", 0.0)

        print(f"\n{icon} | Tool: [{tool}] | Latency: {latency:.1f}ms")
        print(f"{res.get('response')}")


if __name__ == "__main__":
    asyncio.run(run_terminal())
