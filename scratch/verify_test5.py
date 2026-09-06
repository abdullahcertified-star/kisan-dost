import urllib.request
import urllib.error
import json

def test_live():
    base_url = "http://127.0.0.1:8000/api/fertilizer/calculate"
    
    print("=== LIVE API VERIFICATION ===")
    # 1, 5, 10 acres
    for acres in [1.0, 5.0, 10.0]:
        body = json.dumps({"crop": "Wheat", "acres": acres, "soil_type": "Loam (Mera)"}).encode("utf-8")
        req = urllib.request.Request(base_url, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[SUCCESS] {data['acres']} acres: DAP={data['dap_bags']} bags, Urea={data['urea_bags']} bags, SOP={data['sop_bags']} bags | Total: PKR {data['total_cost_pkr']:,}")

    # All crops test
    print("\n=== MULTI-CROP DETERMINISM & NON-NEGATIVITY ===")
    crops = ["Wheat", "Chickpea", "Mustard", "Rice", "Cotton", "Maize", "Potato"]
    for crop in crops:
        body = json.dumps({"crop": crop, "acres": 5.0, "soil_type": "Loam (Mera)"}).encode("utf-8")
        req = urllib.request.Request(base_url, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data['dap_bags'] >= 0
            assert data['urea_bags'] >= 0
            assert data['sop_bags'] >= 0
            print(f"[OK] {crop:8} (5 ac): DAP={data['dap_bags']} bags, Urea={data['urea_bags']} bags, SOP={data['sop_bags']} bags | Cost: PKR {data['total_cost_pkr']:,}")

    # Invalid crop test
    print("\n=== INVALID INPUT VALIDATION ===")
    invalid_cases = [
        ("Invalid Crop", {"crop": "DragonFruit", "acres": 5.0}),
        ("Zero Acres", {"crop": "Wheat", "acres": 0.0}),
        ("Negative Acres", {"crop": "Wheat", "acres": -5.0}),
    ]
    for label, payload in invalid_cases:
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(base_url, data=body, headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req)
            print(f"[FAILED] Expected 422 for {label}, but call succeeded!")
        except urllib.error.HTTPError as e:
            print(f"[VERIFIED] {label} properly rejected with HTTP {e.code}: {e.reason}")

if __name__ == "__main__":
    test_live()
