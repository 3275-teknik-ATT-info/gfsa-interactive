#!/usr/bin/env python3
"""
GFSA patch utility.
Usage:
  python3 tools/patch.py diagnose <file>
  python3 tools/patch.py replace <file> <old_string> <new_string>
  python3 tools/patch.py insert <file> <after_line_no> <text>
  python3 tools/patch.py delete <file> <start_line> <end_line>
  python3 tools/patch.py clip <file> <old_string>
    (reads new content from stdin/clipboard)
"""
import sys
import os

cmd = sys.argv[1] if len(sys.argv) > 1 else 'diagnose'
filepath = sys.argv[2] if len(sys.argv) > 2 else None

if cmd == 'diagnose':
    with open(filepath) as f:
        lines = f.readlines()
    issues = []
    for i, line in enumerate(lines, 1):
        s = line.strip()
        if s in ('fi','done','}',';;'):
            issues.append((i,'orphan-closer',s))
        if s.startswith('local '):
            issues.append((i,'local-outside-fn',s))
        if any(t in s for t in ['GFSA','gfsa_cop','allow-tool']):
            issues.append((i,'residue',s))
    if not issues:
        print("OK — no issues found")
    for no,tag,content in issues:
        print(f"L{no:3} [{tag}] {content[:72]}")

elif cmd == 'replace':
    old, new = sys.argv[3], sys.argv[4]
    with open(filepath) as f:
        src = f.read()
    if old not in src:
        print(f"ERROR: string not found in {filepath}")
        sys.exit(1)
    with open(filepath,'w') as f:
        f.write(src.replace(old, new, 1))
    print(f"Replaced in {filepath}")

elif cmd == 'delete':
    start, end = int(sys.argv[3]), int(sys.argv[4])
    with open(filepath) as f:
        lines = f.readlines()
    kept = [l for i,l in enumerate(lines,1) if not (start <= i <= end)]
    with open(filepath,'w') as f:
        f.writelines(kept)
    print(f"Deleted lines {start}-{end} from {filepath}")

elif cmd == 'clip':
    old = sys.argv[3]
    new = sys.stdin.read().strip()
    with open(filepath) as f:
        src = f.read()
    if old not in src:
        print(f"ERROR: marker not found")
        sys.exit(1)
    with open(filepath,'w') as f:
        f.write(src.replace(old, new, 1))
    print(f"Clip-replaced in {filepath}")

elif cmd == 'insert':
    after = int(sys.argv[3])
    text = sys.argv[4] + '\n'
    with open(filepath) as f:
        lines = f.readlines()
    lines.insert(after, text)
    with open(filepath,'w') as f:
        f.writelines(lines)
    print(f"Inserted after line {after}")
