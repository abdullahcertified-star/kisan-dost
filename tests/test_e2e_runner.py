import sqlite3
import httpx

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"

def main():
    print("=== 1. TEST PROFILE CREATION (POST) ===")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    payload = {
        "name": "Test Farmer",
        "district": "Multan",
        "province": "Punjab",
        "land_acres": 5.0,
        "soil_type": "Loamy",
        "water_availability": "Limited",
        "current_crop": "None",
        "preferred_language": "Urdu"
    }

    res = client.post("/api/farmer/profile", json=payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    created = res.json()
    profile_id = created["id"]
    print(f"Created Profile ID: {profile_id}")
    print(f"Name: {created['name']}, District: {created['district']}, Acres: {created['land_acres']}")
    print(f"Water: {created['water_availability']}, Soil: {created['soil_type']}")

    print("\n=== 2. VERIFY IN SQLITE DATABASE DIRECTLY ===")
    conn = sqlite3.connect("kisan_dost.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, district, province, land_acres, soil_type, water_availability, current_crop, preferred_language FROM farmer_profiles WHERE id = ?",
        (profile_id,)
    )
    row = cursor.fetchone()
    conn.close()
    assert row is not None, "Profile row not found in SQLite table!"
    print(f"SQLite Row in 'farmer_profiles': {row}")
    assert row[1] == "Test Farmer"
    assert row[2] == "Multan"
    assert row[3] == "Punjab"
    assert row[4] == 5.0
    assert row[5] == "Loamy"
    assert row[6] == "Limited"
    assert row[7] == "None"
    assert row[8] == "urdu"
    print("SUCCESS: Profile is confirmed persistent in SQLite database!")

    print("\n=== 3. TEST GET PROFILE BY ID ===")
    get_res = client.get(f"/api/farmer/profile/{profile_id}")
    assert get_res.status_code == 200, f"Expected 200, got {get_res.status_code}"
    get_data = get_res.json()
    assert get_data["id"] == profile_id
    assert get_data["name"] == "Test Farmer"
    assert get_data["district"] == "Multan"
    assert get_data["land_acres"] == 5.0
    assert get_data["water_availability"] == "Limited"
    print("SUCCESS: GET /api/farmer/profile/{id} returned exact matching profile.")

    print("\n=== 4. TEST PUT PROFILE UPDATE ===")
    update_payload = {
        "land_acres": 8.0,
        "current_crop": "Wheat",
        "water_availability": "Canal + Tubewell"
    }
    put_res = client.put(f"/api/farmer/profile/{profile_id}", json=update_payload)
    assert put_res.status_code == 200, f"Expected 200, got {put_res.status_code}"
    put_data = put_res.json()
    assert put_data["land_acres"] == 8.0
    assert put_data["current_crop"] == "Wheat"
    assert put_data["water_availability"] == "Canal + Tubewell"
    assert put_data["name"] == "Test Farmer"  # preserved
    print(f"SUCCESS: PUT updated acreage to {put_data['land_acres']} and crop to {put_data['current_crop']}")

    print("\n=== 5. TEST INVALID ACREAGE REJECTION ===")
    # 0.0 acres
    inv_res = client.post("/api/farmer/profile", json={**payload, "land_acres": 0.0})
    assert inv_res.status_code == 422, f"Expected 422, got {inv_res.status_code}"
    print("SUCCESS: land_acres: 0.0 was rejected with HTTP 422 Unprocessable Entity.")

    # negative acres
    inv_neg = client.post("/api/farmer/profile", json={**payload, "land_acres": -5.0})
    assert inv_neg.status_code == 422, f"Expected 422, got {inv_neg.status_code}"
    print("SUCCESS: land_acres: -5.0 was rejected with HTTP 422 Unprocessable Entity.")

    print("\n=== 6. TEST MISSING DISTRICT REJECTION ===")
    missing_district = {k: v for k, v in payload.items() if k != "district"}
    miss_res = client.post("/api/farmer/profile", json=missing_district)
    assert miss_res.status_code == 422, f"Expected 422, got {miss_res.status_code}"
    print("SUCCESS: Missing district field was rejected with HTTP 422.")

    empty_district = {**payload, "district": ""}
    empty_res = client.post("/api/farmer/profile", json=empty_district)
    assert empty_res.status_code == 422, f"Expected 422, got {empty_res.status_code}"
    print("SUCCESS: Empty district string was rejected with HTTP 422.")

    print("\n=== 7. TEST FRONTEND SERVING & PERSISTENCE ===")
    front_res = httpx.get(f"{FRONTEND_URL}/profile", timeout=10.0)
    assert front_res.status_code == 200
    print(f"SUCCESS: Frontend /profile responded with HTTP {front_res.status_code}")

    # Simulate browser refresh fetching stored profile ID
    reload_res = client.get(f"/api/farmer/profile/{profile_id}")
    assert reload_res.status_code == 200
    reloaded = reload_res.json()
    assert reloaded["id"] == profile_id
    assert reloaded["name"] == "Test Farmer"
    print(f"SUCCESS: Browser reload simulated fetch preserved profile ID: {reloaded['id']}")
    print(f"Saved state: {reloaded['name']} | {reloaded['district']}, {reloaded['province']} | {reloaded['land_acres']} Acres | Crop: {reloaded['current_crop']}")

    print("\n============================================================")
    print("ALL 7 END-TO-END CRITERIA VERIFIED AND PASSED SUCCESSFULLY!")
    print("============================================================")

if __name__ == "__main__":
    main()
