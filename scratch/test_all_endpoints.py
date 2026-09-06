import urllib.request, urllib.error, json

BASE_URL = "https://kisan-dost-beige.vercel.app"

endpoints = [
    ("GET", "/health", None),
    ("GET", "/api/health", None),
    ("POST", "/api/chat", {"message": "Wheat fertilizer requirement in Multan", "session_id": "test"}),
    ("GET", "/api/weather/Multan", None),
    ("GET", "/api/tools/weather/Multan", None),
    ("GET", "/api/schemes?province=Punjab&district=Multan", None),
    ("GET", "/api/tools/govt-schemes?province=Punjab&acres=5", None),
    ("GET", "/api/market/prices?crop=Wheat", None),
    ("GET", "/api/market/prices?crop=All%20Crops&market=All%20Markets", None),
    ("GET", "/api/tools/mandi-prices?commodity=Wheat", None),
    ("POST", "/api/fertilizer/calculate", {"crop": "Wheat", "acres": 5, "soil_type": "Loam"}),
    ("POST", "/api/tools/fertilizer-calculator", {"crop": "Wheat", "acres": 5}),
    ("POST", "/api/agriculture/recommend", {"district": "Multan", "land_acres": 5, "season": "Rabi", "soil_type": "Loam", "water_availability": "Adequate"}),
    ("POST", "/api/pest-doctor/diagnose", {"crop": "Cotton", "symptoms": "yellow curling leaves and white flies"}),
    ("POST", "/api/tools/pest-doctor", {"crop": "Cotton", "symptoms": "whitefly", "acres": 5}),
    ("GET", "/api/pest-doctor/database", None),
    ("POST", "/api/profit/calculate", {"crop": "Wheat", "acres": 5, "expected_yield_maunds": 40, "expected_sale_price": 3900}),
    ("POST", "/api/tools/profit-estimator", {"crop": "Wheat", "acres": 5}),
    ("GET", "/api/farmer/profile/demo_farmer", None),
    ("POST", "/api/farmer/profile", {"name": "Test Farmer", "district": "Multan", "province": "Punjab", "land_acres": 5, "soil_type": "Loam", "water_availability": "Canal", "current_crop": "Wheat", "preferred_language": "ur"}),
    ("GET", "/api/observability/summary", None),
    ("GET", "/api/observability/traces", None),
]

print("=== TESTING ALL VERCEL API ENDPOINTS ===")
for method, path, body in endpoints:
    url = BASE_URL + path
    try:
        data = json.dumps(body).encode('utf-8') if body else None
        headers = {"Content-Type": "application/json"} if body else {}
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        res = urllib.request.urlopen(req, timeout=15)
        resp_data = res.read().decode('utf-8')
        print(f"[SUCCESS {res.status}] {method} {path} -> {len(resp_data)} bytes")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')[:200]
        print(f"[HTTP {e.code}] {method} {path} -> {err_body}")
    except Exception as e:
        print(f"[ERROR] {method} {path} -> {e}")
