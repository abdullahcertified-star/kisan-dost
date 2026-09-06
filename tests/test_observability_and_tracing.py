import asyncio
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.tracer import tracer, sanitize_data
from backend.app.agents.triage_agent import handle_query


client = TestClient(app)


def test_sanitize_data_redacts_credentials():
    """Verify that secrets, API keys, passwords, and tokens are scrubbed from logs."""
    raw_payload = {
        "api_key": "AIzaSyD-Secret123456",
        "secret_token": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "user_query": "How much DAP for 5 acres cotton?",
        "nested": {
            "password": "super_secret_db_pass",
            "safe_param": "Multan",
        }
    }
    sanitized = sanitize_data(raw_payload)
    assert sanitized["api_key"] == "[REDACTED_SECRET]"
    assert sanitized["secret_token"] == "[REDACTED_SECRET]"
    assert sanitized["nested"]["password"] == "[REDACTED_SECRET]"
    assert sanitized["nested"]["safe_param"] == "Multan"
    assert sanitized["user_query"] == "How much DAP for 5 acres cotton?"

    # Also test free-text redaction
    text_with_key = "Connected to Gemini with AIzaSy1234567890abcdefghijklmnopqrstuv"
    assert "[REDACTED_SECRET]" in sanitize_data(text_with_key)


def test_full_agent_tracing_pipeline():
    """
    Prompt 12 Test:
    Farmer question -> Triage -> Specialist -> Tool -> Result -> Final response
    Inspect:
      - user request
      - selected agent
      - tool calls
      - tool inputs
      - tool results
      - handoffs
      - errors
      - final response
    """
    async def _run():
        farmer_id = "test_judge_observability_farmer"
        query = "How much urea do I need for 10 acres of wheat in Multan?"

        result = await handle_query(query, farmer_id)
        assert "debug_trace" in result
        trace = result["debug_trace"]

        # 1. User request
        assert trace["user_request"] == query

        # 2. Selected agent
        assert trace["selected_agent"] == "agronomy"

        # 3. Handoffs chain
        assert len(trace["handoffs"]) >= 2
        assert trace["handoffs"][0]["from_agent"] == "farmer"
        assert trace["handoffs"][0]["to_agent"] == "triage"
        assert trace["handoffs"][1]["from_agent"] == "triage"
        assert trace["handoffs"][1]["to_agent"] == "agronomy"

        # 4. Tool calls
        assert len(trace["tool_calls"]) >= 1
        tool_call = trace["tool_calls"][0]
        assert tool_call["tool_name"] == "Fertilizer Calculator"

        # 5. Tool inputs
        assert trace["tool_inputs"]["acres"] == 10.0
        assert trace["tool_inputs"]["crop"] == "wheat"

        # 6. Tool results
        assert "urea_bags" in trace["tool_results"]
        assert trace["tool_results"]["urea_bags"] > 0

        # 7. Errors
        assert trace["errors"] == []

        # 8. Final response
        assert len(trace["final_response"]) > 20
        assert "urea" in trace["final_response"].lower() or "بوری" in trace["final_response"]

    asyncio.run(_run())


def test_observability_api_endpoints():
    """Verify HTTP endpoints for developer mode and trace inspection."""
    # 1. Post a query to trigger tracing via HTTP
    chat_res = client.post(
        "/api/chat",
        json={"message": "Wheat mandi price in Multan", "session_id": "sess_obs_test"}
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "debug_trace" in chat_data
    assert chat_data["debug_trace"]["selected_agent"] == "market"

    # 2. Get recent traces
    traces_res = client.get("/api/observability/traces?limit=10")
    assert traces_res.status_code == 200
    traces_data = traces_res.json()
    assert "traces" in traces_data
    assert len(traces_data["traces"]) >= 1

    # 3. Get telemetry summary
    summary_res = client.get("/api/observability/summary")
    assert summary_res.status_code == 200
    summary_data = summary_res.json()
    assert "total_requests" in summary_data
    assert "agent_distribution" in summary_data
    assert summary_data["total_requests"] >= 1
