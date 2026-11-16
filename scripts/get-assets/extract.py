"""Parse the Lead Magnet Playbook PDF into assets.json."""
import json, re, sys
import pymupdf as fitz

SRC = sys.argv[1]
OUT = sys.argv[2]
d = fitz.open(SRC)

LABELS = {
    'WHATTHEYGET': ('get', None),
    'CHECKLIST': ('checklist', 'Checklist'),
    'PROMPT': ('prompt', 'Prompt'),
    'PROMPTINSIDETHEAUTOMATION': ('prompt', 'Prompt inside the automation'),
    'BUILDSTEPS': ('steps', 'Build steps'),
    'TEMPLATEFIELDS': ('fields', 'Template fields'),
    'TEMPLATE—PASTEIN<HEAD>': ('code', 'Template: paste in <head>'),
    'AUDITSCOPE—WHATYOUDELIVER': ('scope', 'What I deliver'),
    'DMREPLY': ('dm', None),
    'LOOMSCRIPT·45S': ('loom', None),
}

def norm(t):
    return re.sub(r'\s+', '', t)

assets = []
cur = None
sec = None
last = None  # (page, y) of last text line in section

def new_section(kind, label):
    global sec, last
    sec = {'type': kind, 'label': label, 'items': [], 'lines': []}
    cur['sections'].append(sec)
    last = None

for pno in range(3, len(d)):
    p = d[pno]
    boxes = [dr['rect'].y0 for dr in p.get_drawings()
             if 7 < dr['rect'].width < 10 and 7 < dr['rect'].height < 10 and dr['rect'].x0 < 66]
    lines = []
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            spans = l['spans']
            t = ''.join(s['text'] for s in spans)
            if not t.strip():
                continue
            lines.append(dict(x=l['bbox'][0], y=l['bbox'][1], font=spans[0]['font'],
                              size=round(spans[0]['size'], 1), color=spans[0]['color'],
                              text=t, spans=spans))
    lines.sort(key=lambda r: (round(r['y']), r['x']))
    i = 0
    while i < len(lines):
        L = lines[i]
        t = L['text']
        if L['y'] > 740:  # footer
            i += 1; continue
        # asset header: small grey spaced text at y~66 followed by yellow keyword
        if 60 < L['y'] < 75 and L['color'] == 0x555555 and any(60 < r['y'] < 75 and r['color'] == 0xe6ff00 for r in lines):
            kw_line = next(r for r in lines if 60 < r['y'] < 75 and r['color'] == 0xe6ff00)
            hdr = norm(t)  # e.g. 2A·DARKMOTION·AUTOMATIONBLUEPRINT
            parts = t.split('·')
            cur = {'id': norm(parts[0]).lower(), 'track': ' '.join(w.replace(' ', '') for w in re.split(r'\s{2,}', parts[1].strip())).strip(),
                   'format': ' '.join(w.replace(' ', '') for w in re.split(r'\s{2,}', parts[2].strip())).strip(),
                   'keyword': norm(kw_line['text']), 'title': '', 'sub': '', 'post': '',
                   'get': [], 'sections': [], 'dm': [], 'loom': [], 'tool': ''}
            assets.append(cur)
            sec = None; last = None
            i += 1; continue
        if L['color'] == 0xe6ff00 and L['y'] < 75:
            i += 1; continue
        if 'ChakraPetch' in L['font'] and L['size'] > 20:
            cur['title'] = t.strip(); i += 1; continue
        if L['size'] == 11.5:
            cur['sub'] = (cur['sub'] + ' ' + t.strip()).strip(); i += 1; continue
        if t.startswith('POST:') or (L['size'] == 7.5 and L['color'] == 0x777777):
            cur['post'] = (cur['post'] + ' ' + t.strip()).strip(); i += 1; continue
        # section label
        if L['size'] == 8.0 and L['color'] == 0x555555:
            n = norm(t)
            if n.startswith('WEBTOOL'):
                new_section('tool', t)
            elif n in LABELS:
                new_section(*LABELS[n])
            else:
                raise SystemExit(f'unknown label {n!r} p{pno}')
            i += 1; continue
        # scoring line (label span + text)
        if norm(L['spans'][0]['text']).startswith('SCORING'):
            rest = ''.join(s['text'] for s in L['spans'][1:]).strip()
            new_section('scoring', 'Scoring')
            sec['lines'].append(rest)
            last = (pno, L['y'])
            i += 1; continue
        if sec is None:
            raise SystemExit(f'orphan line p{pno}: {t}')
        k = sec['type']
        gap = None if last is None or last[0] != pno else L['y'] - last[1]
        txt = t.rstrip()
        if k == 'checklist':
            is_new = any(abs(by - L['y'] - 2) < 4 for by in boxes)
            if is_new or not sec['items']:
                sec['items'].append(txt.strip())
            else:
                pass
                prev = sec['items'][-1]
                sec['items'][-1] = prev + ('' if prev.endswith('-') else ' ') + txt.strip()
        elif k in ('steps', 'scope', 'loom'):
            m = re.match(r'^\s*(\d+)\.\s+(.*)', txt)
            if m and L['x'] < 65:
                sec['items'].append(m.group(2).strip())
            else:
                prev = sec['items'][-1]
                sec['items'][-1] = prev + ('' if prev.endswith('-') else ' ') + txt.strip()
        elif k in ('get', 'fields'):
            if gap is not None and gap < 15 and k == 'get':
                sec['items'][-1] += ' ' + txt.strip()
            elif k == 'fields' and L['x'] > 67 and sec['items']:
                sec['items'][-1] += ' ' + txt.strip()
            else:
                sec['items'].append(txt.strip())
        elif k in ('dm', 'scoring'):
            sec['lines'].append(txt.strip())
        else:  # prompt, code, tool: preserve structure
            sec['lines'].append({'x': round(L['x']), 'gap': gap, 'text': txt.strip()})
        last = (pno, L['y'])
        i += 1

def flow(lines):
    """Rejoin wrapped mono lines into paragraphs / list lines."""
    out = []
    for ln in lines:
        t = ln['text']
        starts_item = bool(re.match(r'^(\d+ |- |PASSES$|Standing questions:|Run on:|Then:|Return:|Scoring:|Criteria:)', t))
        para = ln['gap'] is not None and ln['gap'] > 17
        if not out:
            out.append(t)
        elif para:
            out.append('')
            out.append(t)
        elif starts_item:
            out.append(t)
        else:
            prev = out[-1]
            out[-1] = prev + ('' if prev.endswith(('-', '"', '{', '[')) and not prev.endswith(' -') else ' ') + t
    return '\n'.join(out).strip()

for a in assets:
    secs = []
    for s in a['sections']:
        if s['type'] == 'get':
            a['get'] = s['items']; continue
        if s['type'] == 'dm':
            a['dm'] = ' '.join(s['lines']); continue
        if s['type'] == 'loom':
            a['loom'] = s['items']; continue
        if s['type'] == 'tool':
            a['tool'] = flow(s['lines']); continue
        if s['type'] in ('prompt', 'code'):
            s['text'] = flow(s['lines'])
        if s['type'] == 'scoring':
            s['text'] = ' '.join(s['lines'])
        s.pop('lines', None)
        if s['type'] not in ('checklist', 'steps', 'scope', 'fields'):
            s.pop('items', None)
        secs.append(s)
    a['sections'] = secs
    m = re.match(r'POST:\s*(.*?)\s*·\s*(MP4/.*)$', a['post'])
    a['post_desc'], a['mp4'] = (m.group(1), m.group(2).replace(' ', '')) if m else (a['post'], '')
    del a['post']

json.dump(assets, open(OUT, 'w'), indent=1, ensure_ascii=False)
print(len(assets), 'assets')
