import zlib, re, sys

pdf_path = "c:/Users/Abdullah/.gemini/antigravity-ide/brain/48551099-12e9-498a-9df9-072cae192663/.tempmediaStorage/media_1788657452595.pdf"
with open(pdf_path, 'rb') as f:
    raw = f.read()

streams = re.findall(b'stream[\r\n]+(.*?)[\r\n]+endstream', raw, re.DOTALL)
print(f"Total streams: {len(streams)}")

all_text = []
for i, s in enumerate(streams):
    try:
        decomp = zlib.decompress(s)
        # extract TJ arrays and Tj
        tj_matches = re.findall(rb'\((.*?)\)\s*T[jd]', decomp)
        if tj_matches:
            txt = ' '.join(m.decode('latin1', 'ignore') for m in tj_matches)
            all_text.append(f"--- Stream {i} ---\n" + txt)
    except Exception as e:
        pass

output_file = "c:/Users/Abdullah/Desktop/KISAN_DOST/pdf_dump.txt"
with open(output_file, 'w', encoding='utf-8') as out:
    out.write("\n\n".join(all_text))
print("Wrote text to", output_file)
