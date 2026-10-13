#!/usr/bin/env python3 -I
# Turn each docs/source/parity/*.json (structured capture) into a compact indented outline *.outline.txt
import json, glob, os, sys
OUT = '/Users/romitsoley/Work/apps/skills-checklist/docs/source/parity'
def css(c):
    if not c: return ''
    keys=['display','cols','gap','dir','jc','ai','pad','fs','fw','color','bg','border','radius','shadow','pos','tt','ls']
    return ' '.join(f"{k}={c[k]}" for k in keys if k in c)
def walk(n, d, out, maxd=14):
    kids = n.get('kids', [])
    interesting = n.get('text') or n['t'] in ('aside','nav','header','main','table','thead','tbody','tr','th','td','button','a','input','select','textarea','label','h1','h2','h3','h4','p','form','dialog') or len(kids) > 1 or n.get('role') or n.get('css',{}).get('pos')
    if interesting:
        b = n['box']
        line = '  ' * d + n['t'] + (f"[{n['role']}]" if n.get('role') else '')
        if n.get('aria'): line += f' aria="{n["aria"]}"'
        if n.get('text'): line += f' "{n["text"]}"'
        if n.get('type'): line += f" type={n['type']}"
        if n.get('ph'): line += f' ph="{n["ph"]}"'
        if 'value' in n and n['value']: line += f' val="{n["value"]}"'
        if n.get('checked') is not None: line += f" checked={n['checked']}"
        if n.get('disabled'): line += ' DISABLED'
        line += f" @{b[0]},{b[1]} {b[2]}x{b[3]}"
        c = css(n.get('css'))
        if c: line += ' | ' + c
        out.append(line)
        d += 1
    if d <= maxd:
        for k in kids: walk(k, d, out, maxd)
for f in sorted(glob.glob(OUT + '/*.json')):
    if os.path.basename(f).startswith('manifest'): continue
    d = json.load(open(f)); out = []
    out.append(f"# {d['name']}: {d['desc']}  (doc {d['scroll'][0]}x{d['scroll'][1]}, fullPage={d['fullPage']})")
    out.append('## headings: ' + ' | '.join(f"{h['t']}:{h['text']}({h['fs']}/{h['fw']})" for h in d['headings']))
    out.append('## buttons: ' + ' | '.join(f"{b['text']}{'*FILLED*' if b['filled'] else ''}{'(dis)' if b.get('disabled') else ''}" for b in d['buttons'] if b['text']))
    for t in d['tables']: out.append(f"## table rows={t['rows']} rowH={t['rowHeight']} box={t['box']} headers={t['headers']}")
    for o in d['overlays']: out.append(f"## overlay {o['box']} z={o['z']} bg={o['bg']} cls={o['cls'][:70]}")
    out.append('## tree'); walk(d['tree'], 0, out)
    open(f.replace('.json', '.outline.txt'), 'w').write('\n'.join(out))
print('outlines written')
