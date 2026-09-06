import urllib.request, re

req = urllib.request.Request('https://kisan-dost-beige.vercel.app/schemes', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
print('HTML length:', len(html))

scripts = re.findall(r'src="(/_next/[^"]+\.js)"', html)
print('Scripts found:', len(scripts))

for s in scripts:
    js_url = 'https://kisan-dost-beige.vercel.app' + s
    try:
        js = urllib.request.urlopen(js_url).read().decode('utf-8', errors='ignore')
        if 'localhost:8000' in js or '127.0.0.1:8000' in js:
            print('CRITICAL: FOUND LOCALHOST:8000 IN JS:', s)
        if 'api/schemes' in js:
            print('Found api/schemes in:', s)
            # Find surrounding context
            idx = js.find('api/schemes')
            print('Context around api/schemes:', js[max(0, idx-50):min(len(js), idx+80)])
    except Exception as e:
        print('Error fetching', s, e)
