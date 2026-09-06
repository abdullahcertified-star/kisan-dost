import urllib.request, urllib.error

pages = [
    "/",
    "/advisor",
    "/crops",
    "/fertilizer",
    "/market",
    "/observability",
    "/pest-doctor",
    "/profile",
    "/profit",
    "/schemes",
    "/weather",
    "/demo"
]

BASE = "https://kisan-dost-beige.vercel.app"

for p in pages:
    url = BASE + p
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req)
        print(f"[STATUS {res.status}] {p} -> {len(res.read())} bytes")
    except urllib.error.HTTPError as e:
        print(f"[HTTP {e.code}] {p} -> {e.read()[:200]}")
    except Exception as e:
        print(f"[ERROR] {p} -> {e}")
