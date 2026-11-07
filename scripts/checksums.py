from pathlib import Path
import hashlib
files=sorted(p for p in Path('artifacts').iterdir() if p.is_file() and p.name.endswith(('.ipa','.zip','.apk','.aab')))
if not files: raise SystemExit('No distributable artifact found')
Path('artifacts/SHA256SUMS').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in files))
