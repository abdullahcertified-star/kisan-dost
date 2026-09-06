import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("."))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from pprint import pprint

from backend.app.agents.triage_agent import handle_query
from backend.app.services.context_service import clear_context, get_context
from backend.app.services.tracer import tracer


async def test_tracing_pipeline():
    print("=" * 65)
    print("PROMPT 12 VERIFICATION: COMPLETE MULTI-AGENT OBSERVABILITY TRACE")
    print("=" * 65)

    session_id = "hackathon_judge_session_001"
    clear_context(session_id)

    # Question: "How much urea do I need for 5 acres of cotton in Multan?"
    user_q = "How much urea do I need for 5 acres of cotton in Multan?"
    print(f"\n1. Farmer Question: '{user_q}'")
    
    result = await handle_query(user_q, session_id)
    trace = result.get("debug_trace")

    assert trace is not None, "Trace must be present in result"
    print("\n2. Trace Execution Flow:")
    for step in trace["execution_flow"]:
        print(f"   -> {step}")

    print("\n3. Detailed Trace Inspection (Prompt 12 Requirements):")
    print(f" - [user_request]:   {trace['user_request']}")
    print(f" - [selected_agent]: {trace['selected_agent']}")
    print(f" - [handoffs]:       {trace['handoffs']}")
    print(f" - [tool_calls]:     {trace['tool_calls']}")
    print(f" - [tool_inputs]:    {trace['tool_inputs']}")
    print(f" - [tool_results]:   {trace['tool_results']}")
    print(f" - [errors]:         {trace['errors']}")
    print(f" - [final_response]: {trace['final_response'][:80]}...")
    print(f" - [latency_ms]:     {trace['latency_ms']} ms")

    # Assertions for Prompt 12 Requirements
    assert trace["user_request"] == user_q
    assert trace["selected_agent"] == "agronomy"
    assert len(trace["handoffs"]) >= 2, "Handoff from triage to specialist must be recorded"
    assert len(trace["tool_calls"]) >= 1, "Tool execution must be logged"
    assert trace["tool_calls"][0]["tool_name"] == "Fertilizer Calculator"
    assert trace["tool_inputs"] != {}, "Tool inputs must be logged"
    assert trace["tool_results"] != {}, "Tool results must be logged"
    assert trace["final_response"] != "", "Final response must be captured"
    assert trace["latency_ms"] > 0, "Latency must be calculated"

    print("\nSUCCESS: All Prompt 12 inspection requirements verified! 🎉")


if __name__ == "__main__":
    asyncio.run(test_tracing_pipeline())
