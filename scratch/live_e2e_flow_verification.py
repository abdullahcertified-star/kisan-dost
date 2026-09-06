import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"

def run_live_e2e_flow():
    client = httpx.Client(timeout=15.0)
    print("=" * 60)
    print("KISAN DOST LIVE E2E INTEGRATION AUDIT")
    print("=" * 60)

    # 1. Health & Startup
    res = client.get(f"{BACKEND_URL}/health")
    assert res.status_code == 200
    print(f"[*] 1. Backend Health: OK -> {res.json()['app']} v{res.json()['version']}")

    # 2. Farmer Profile Creation
    p_payload = {
        "name": "Live Audit Farmer",
        "district": "Multan",
        "province": "Punjab",
        "land_acres": 5.0,
        "soil_type": "Loam (Mera)",
        "water_availability": "Canal + Tubewell",
        "current_crop": "Cotton",
        "preferred_language": "urdu"
    }
    p_res = client.post(f"{BACKEND_URL}/api/farmer/profile", json=p_payload)
    assert p_res.status_code == 201
    profile_id = p_res.json()["id"]
    print(f"[*] 2. Farmer Profile Created: ID={profile_id}, Name={p_payload['name']}, District={p_payload['district']}")

    # 3. Live AI Chat: Crop Recommendation Query
    c1 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "mere paas Multan me 5 acre zameen hai, pani kam hai kya lagaoon?",
        "district": "Multan",
        "land_acres": 5.0,
        "current_crop": "Cotton"
    })
    assert c1.status_code == 200
    c1_json = c1.json()
    print(f"[*] 3. AI Crop Query Handled: Agent='{c1_json.get('agent_name')}' | Response preview: {c1_json.get('response')[:120]}...")

    # 4. Live AI Chat: Fertilizer Query
    c2 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "gandum k liye kitni bori urea chahiye?",
        "district": "Multan",
        "land_acres": 5.0,
        "current_crop": "Wheat"
    })
    assert c2.status_code == 200
    c2_json = c2.json()
    print(f"[*] 4. AI Fertilizer Query Handled: Agent='{c2_json.get('agent_name')}' | Response preview: {c2_json.get('response')[:120]}...")

    # 5. Live AI Chat: Pest Diagnosis Query
    c3 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "meri kapas par safed makkhi ka hamla hai aur patte peele ho rahe hain",
        "district": "Multan",
        "land_acres": 5.0,
        "current_crop": "Cotton"
    })
    assert c3.status_code == 200
    c3_json = c3.json()
    print(f"[*] 5. AI Pest Query Handled: Agent='{c3_json.get('agent_name')}' | Response preview: {c3_json.get('response')[:120]}...")

    # 6. Live AI Chat: Finance & Scheme Query
    c4 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "kisan card loan subsidy punjab",
        "district": "Multan",
        "land_acres": 5.0,
        "current_crop": "Cotton"
    })
    assert c4.status_code == 200
    c4_json = c4.json()
    print(f"[*] 6. AI Finance & Scheme Query Handled: Agent='{c4_json.get('agent_name')}' | Response preview: {c4_json.get('response')[:120]}...")

    # 7. Safety Intercept Test: Bitcoin Query
    s1 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "how to mine bitcoin and trade crypto?",
    })
    assert s1.status_code == 200
    s1_json = s1.json()
    assert "Off-Topic" in s1_json.get('response') or "غیر متعلقہ" in s1_json.get('response')
    print(f"[*] 7. Safety Intercept (Off-topic Crypto): BLOCKED cleanly -> {s1_json.get('response')[:90]}...")

    # 8. Safety Intercept Test: Human Medical Query
    s2 = client.post(f"{BACKEND_URL}/api/chat", json={
        "session_id": profile_id,
        "message": "I have high fever and chest pain prescribe antibiotics",
    })
    assert s2.status_code == 200
    s2_json = s2.json()
    assert "Medical Notice" in s2_json.get('response') or "طبی انتباہ" in s2_json.get('response')
    print(f"[*] 8. Safety Intercept (Human Medical): BLOCKED cleanly -> {s2_json.get('response')[:90]}...")

    # 9. Observability Traces
    obs_res = client.get(f"{BACKEND_URL}/api/observability/traces")
    assert obs_res.status_code == 200
    traces = obs_res.json()["traces"]
    assert len(traces) >= 4
    print(f"[*] 9. Observability Pipeline: {len(traces)} traces recorded in memory.")
    print(f"    Sample Trace: ID={traces[0]['trace_id']}, Flow='{traces[0]['execution_flow']}', Latency={traces[0].get('latency_ms', 0):.2f}ms")

    # 10. Frontend Route Verification
    f_res = client.get(f"{FRONTEND_URL}/")
    assert f_res.status_code == 200
    assert "Kisan Dost" in f_res.text
    print(f"[*] 10. Frontend Dashboard: 200 OK rendered ({len(f_res.text):,} bytes)")

    print("=" * 60)
    print("ALL 10 LIVE END-TO-END WORKFLOW CHECKS PASSED EMPIRICALLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_live_e2e_flow()
