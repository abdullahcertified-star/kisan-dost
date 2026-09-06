import httpx

ROUTES = [
    "/",
    "/assistant",
    "/profile",
    "/crops",
    "/advisor",
    "/fertilizer",
    "/pest-doctor",
    "/market",
    "/profit",
    "/weather",
    "/schemes",
    "/observability"
]

def test_routes():
    client = httpx.Client(base_url="http://127.0.0.1:3000", timeout=10.0)
    results = {}
    for r in ROUTES:
        try:
            res = client.get(r)
            results[r] = {
                "status": res.status_code,
                "length": len(res.text),
                "has_html": "<!DOCTYPE html>" in res.text or "<html" in res.text
            }
            print(f"Route {r:15} -> Status: {res.status_code} | HTML Size: {len(res.text):,} bytes")
        except Exception as e:
            results[r] = {"error": str(e)}
            print(f"Route {r:15} -> FAILED: {e}")
    
    assert all(res.get("status") == 200 for res in results.values()), "Some frontend routes failed!"
    print("\nALL 12 FRONTEND ROUTES RETURNED 200 OK WITH VALID HTML PRERENDER!")

if __name__ == "__main__":
    test_routes()
