"""Test Phase 9 (Government Schemes), Phase 10 (Bilingual English/Urdu/Roman Urdu),
and Phase 11 (Observability & Tracing).
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("."))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from pprint import pprint

from backend.app.services.schemes_service import SchemesService
from backend.app.agents.triage_agent import handle_query
from backend.app.services.tracer import tracer
from backend.app.services.context_service import clear_context, get_context


async def test_phases():
    print("\n" + "=" * 60)
    print("TESTING PHASE 9: GOVERNMENT SCHEMES SERVICE")
    print("=" * 60)

    # 1. Fetch Punjab Schemes
    punjab_res = SchemesService.get_schemes(province="Punjab")
    print(f"Punjab Schemes Found: {punjab_res['total_count']}")
    assert punjab_res["total_count"] >= 3, "Expected at least 3 Punjab schemes"
    for s in punjab_res["schemes"]:
        print(f" - {s['name']} | Province: {s['province']} | Verified: {s['last_verified_date']}")
        assert s["source"], "Each scheme must have a source"
        assert s["last_verified_date"], "Each scheme must have a last_verified_date"
        assert s["is_reference"], "Each scheme must be marked as reference information"

    # 2. Filter by crop = wheat
    wheat_res = SchemesService.get_schemes(province="Punjab", crop="wheat")
    print(f"\nPunjab + Wheat Schemes Found: {wheat_res['total_count']}")
    assert wheat_res["total_count"] >= 1, "Expected wheat schemes"

    # 3. Test fallback handling with non-existent localized filter
    fallback_res = SchemesService.get_schemes(province="Gilgit-Baltistan", crop="dragonfruit")
    print(f"\nFallback Test (Gilgit-Baltistan + dragonfruit):")
    print(f" - Fallback Used: {fallback_res['fallback_used']}")
    print(f" - Total Schemes: {fallback_res['total_count']}")
    print(f" - Message: {fallback_res['message']}")
    assert fallback_res["fallback_used"] is True, "Fallback should be triggered"
    assert fallback_res["total_count"] > 0, "Nationwide schemes should be returned as fallback"

    print("\n" + "=" * 60)
    print("TESTING PHASE 10: BILINGUAL AGENTS (ENGLISH, URDU, ROMAN URDU)")
    print("=" * 60)

    test_session = "farmer_bilingual_test_101"
    clear_context(test_session)

    # Prompt 1: "mere paas Multan mein 5 acre zameen hai"
    print("\n[Query 1 - Roman Urdu Context Establishment]")
    q1 = "mere paas Multan mein 5 acre zameen hai"
    r1 = await handle_query(q1, test_session)
    print(f"Query: {q1}")
    print(f"Agent: {r1['agent']}")
    print(f"Response: {r1['response']}")
    ctx = get_context(test_session)
    print(f"Stored Context: {ctx}")
    assert ctx.get("district") == "Multan", "District must be stored in context"
    assert ctx.get("acreage") == 5.0, "Acreage must be stored in context"

    # Prompt 2: "pani kam hai, kya lagaoon?"
    print("\n[Query 2 - Roman Urdu Crop Advisor with Drought Constraint]")
    q2 = "pani kam hai, kya lagaoon?"
    r2 = await handle_query(q2, test_session)
    print(f"Query: {q2}")
    print(f"Agent: {r2['agent']}")
    print(f"Category: {r2.get('category')}")
    print(f"Response: {r2['response']}")
    assert r2["agent"] == "agronomy", "Must route to agronomy agent"
    assert any(c in r2["response"].lower() for c in ["sarson", "chana", "mustard", "cotton", "kapas"]), "Must recommend drought-resilient crops"

    # Prompt 3: "gandum ka rate kya hai?"
    print("\n[Query 3 - Roman Urdu Market Price Lookup]")
    q3 = "gandum ka rate kya hai?"
    r3 = await handle_query(q3, test_session)
    print(f"Query: {q3}")
    print(f"Agent: {r3['agent']}")
    print(f"Category: {r3.get('category')}")
    print(f"Response: {r3['response']}")
    assert r3["agent"] == "market", "Must route to market agent"
    assert "maund" in r3["response"].lower() or "40 kg" in r3["response"].lower(), "Must mention unambiguous units"

    # Prompt 4: "kitni urea chahiye?"
    print("\n[Query 4 - Roman Urdu Fertilizer Calculation]")
    q4 = "kitni urea chahiye?"
    r4 = await handle_query(q4, test_session)
    print(f"Query: {q4}")
    print(f"Agent: {r4['agent']}")
    print(f"Category: {r4.get('category')}")
    print(f"Response: {r4['response']}")
    assert r4["agent"] == "agronomy", "Must route to agronomy agent"
    assert "15" in r4["response"], "Must calculate 15 bags of urea for 5 acres"

    # Prompt 5: "kisan card ke fayde kya hain?" (Finance Agent schemes tool)
    print("\n[Query 5 - Roman Urdu Government Schemes via Finance Agent]")
    q5 = "kisan card ke fayde kya hain?"
    r5 = await handle_query(q5, test_session)
    print(f"Query: {q5}")
    print(f"Agent: {r5['agent']}")
    print(f"Category: {r5.get('category')}")
    print(f"Tool Used: {r5.get('tool_used')}")
    print(f"Response: {r5['response']}")
    assert r5["agent"] == "finance", "Must route to finance agent"
    assert "150,000" in r5["response"] or "kisan card" in r5["response"].lower(), "Must explain Kisan Card benefit"

    # Prompt 6: Urdu Script Query
    print("\n[Query 6 - Pure Urdu Script Query]")
    q6 = "ملتان میں گندم کا ریٹ کیا ہے؟"
    r6 = await handle_query(q6, test_session)
    print(f"Query: {q6}")
    print(f"Agent: {r6['agent']}")
    print(f"Response: {r6['response']}")
    assert r6["agent"] == "market", "Must route to market agent"
    assert "روپے" in r6["response"] or "من" in r6["response"], "Must respond in natural Urdu script"

    print("\n" + "=" * 60)
    print("TESTING PHASE 11: TRACING & OBSERVABILITY")
    print("=" * 60)

    traces = tracer.get_traces(limit=10)
    print(f"Total Recorded Traces: {len(traces)}")
    assert len(traces) >= 6, "Expected at least 6 recorded execution traces"
    summary = tracer.get_telemetry_summary()
    print("Telemetry Summary:")
    pprint(summary)
    assert summary["total_requests"] >= 6, "Total request count must match"
    assert summary["agent_distribution"]["agronomy"] >= 2, "Agronomy routes tracked"
    assert summary["agent_distribution"]["market"] >= 2, "Market routes tracked"
    assert summary["agent_distribution"]["finance"] >= 1, "Finance routes tracked"

    print("\nALL PHASES 9, 10, AND 11 UNIT TESTS PASSED SUCCESSFULLY! 🎉")


if __name__ == "__main__":
    asyncio.run(test_phases())
