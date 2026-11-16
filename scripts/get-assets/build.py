"""Generate the /get/ site from assets.json."""
import json, os, re, shutil, html
from extras import *

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'site')
A = json.load(open(os.path.join(ROOT, 'assets.json')))
BY = {a['keyword']: a for a in A}
e = html.escape

LOGO = '<img src="/6SIGDashboardLogo.png" alt="6 Signal" width="42" height="30">'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">')

def vars_html(text):
    return re.sub(r'(\{[^{}\n]{1,60}\})', r'<span class="v">\1</span>', e(text))

def head(title, desc, kw='hub', canonical=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(desc)}">
<meta name="robots" content="noindex,follow">{f'<link rel="canonical" href="{canonical}">' if canonical else ''}
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">
<link rel="stylesheet" href="/get/assets/get.css"></head><body data-kw="{kw}">
<header class="top"><div class="wrap"><a class="brand" href="https://6signal.co" aria-label="6 Signal home">{LOGO}</a>
<nav><a href="/get">All free assets</a></nav></div></header><main>'''

FOOT = '''</main><footer><div class="wrap"><span>6 SIGNAL · AI visibility and infrastructure for contractors</span>
<span><a href="https://6signal.co">6signal.co</a> · <a href="mailto:hello@6signal.co">hello@6signal.co</a></span></div></footer>
<script src="/get/assets/config.js"></script><script src="/get/assets/get.js"></script>'''

def prompt_block(pid, label, text, note=None):
    return f'''<div class="prompt"><div class="bar"><span>{e(label)}</span><button class="btn small copy" data-copy="#{pid}">Copy</button></div>
<pre id="{pid}">{vars_html(text)}</pre></div>{f'<p class="note">{e(note)}</p>' if note else ''}'''

def editable_table(tid, headers, rows, blank_rows=0, fixed_cols=0, csvname='template.csv'):
    h = ''.join(f'<th>{e(x)}</th>' for x in headers)
    body = ''
    for r in rows:
        cells = ''
        for i in range(len(headers)):
            v = r[i] if i < len(r) else ''
            if i < fixed_cols:
                cells += f'<td>{e(v)}</td>'
            else:
                cells += f'<td contenteditable="true" class="empty">{e(v)}</td>'
        body += f'<tr>{cells}</tr>'
    for _ in range(blank_rows):
        body += '<tr>' + ''.join('<td contenteditable="true" class="empty"></td>' for _ in headers) + '</tr>'
    return f'''<div class="tablewrap"><table data-id="{tid}" id="{tid}"><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table></div>
<div class="tabletools"><button class="btn small" data-csv="#{tid}" data-name="{csvname}">Download CSV</button><button class="btn small" data-reset="{tid}">Clear my edits</button></div>'''

def static_table(headers, rows):
    h = ''.join(f'<th>{e(x)}</th>' for x in headers)
    b = ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="tablewrap"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def block(label, inner, count_id=None):
    c = f'<span class="count" data-count="{count_id}"></span>' if count_id else ''
    return f'<section class="block"><div class="wrap"><div class="label"><span>{e(label)}</span>{c}</div>{inner}</div></section>'

# ---------- section renderers ----------
def render_checklist(a, s, idx):
    kw, items = a['keyword'], s['items']
    cid = f'{kw.lower()}-c{idx}'
    if kw == 'FOOTINGS':
        out = ''
        for it in items:
            title, checks = it.split(' — ', 1)
            lis = ''.join(f'<li><label><input type="checkbox"><span>{e(c.strip()[:1].upper() + c.strip()[1:])}</span></label></li>' for c in checks.split(';'))
            out += f'<div class="footing"><header><h3>{e(title)}</h3><span class="status"></span></header><ul class="check" data-id="{cid}-{title[:2]}">{lis}</ul></div>'
        return block('Self-check · four checks per footing', out)
    lis = ''
    if kw == 'STACK':
        cur = None
        for it in items:
            layer, text = it.split(' — ', 1)
            if layer != cur:
                cur = layer
                owner, breaks = STACK_LAYERS[layer]
                lis += f'<li class="group">{e(layer)} · owner: {e(owner)}<span class="fix"><em>If skipped</em>{e(breaks)}</span></li>'
            lis += f'<li><label><input type="checkbox"><span>{e(text)}</span></label></li>'
        return block('Checklist · tick from the bottom up', f'<ul class="check" data-id="{cid}">{lis}</ul>', cid)
    for i, it in enumerate(items):
        if ' — Fix: ' in it:
            cause, fix = it.split(' — Fix: ', 1)
            week = '(this week)' in fix
            fix = fix.replace(' (this week)', '')
            tags = (f'<span class="tag">This week</span>' if week else '') + (f'<span class="tag">{e(STATIC_OWNERS[i])}</span>' if kw == 'STATIC' else '')
            span = f'<span>{e(cause)}{tags}<span class="fix"><em>Fix</em>{e(fix)}</span></span>'
        else:
            tag = '<span class="tag">Stall</span>' if kw == 'PROFILE' and i < 5 else ''
            span = f'<span>{e(it)}{tag}</span>'
        lis += f'<li><label><input type="checkbox"><span hidden></span>{span}</label></li>'.replace('<span hidden></span>', '')
    label = {'CURVE': 'Twelve questions · one point each', 'PREQUAL': 'Source folder · keep these twelve current',
             'PROFILE': 'Fourteen fields · in priority order', 'STATIC': 'Twelve causes · each with the fix'}.get(kw, 'Checklist')
    html_ = block(label, f'<ul class="check" data-id="{cid}">{lis}</ul>', cid)
    if kw == 'CURVE': html_ = html_.replace('<section class="block">', '<section class="block print-only">', 1)
    return html_

def render_fields(a, s, idx):
    kw = a['keyword']; tid = f'{kw.lower()}-t{idx}'
    rows = s['rows']
    if kw == 'ROADMAP':
        data = [[r[0], r[1], r[2], '', r[3], ''] for r in rows]
        return block('Template · eight quarters', editable_table(tid, TABLE_HEADERS['ROADMAP'], data, 0, 2, 'adoption-roadmap.csv')
                     + '<p class="note">Workflow order is a suggestion. Owner names are the part that matters: replace the roles with people.</p>')
    if kw == 'NODE':
        return block('Template · signal → asset → where → owner → cadence', editable_table(tid, TABLE_HEADERS['NODE'], rows, 3, 1, 'recommendation-content-map.csv'))
    if kw == 'SIGNALS':
        return block('The six signals', static_table(['Signal', 'What it means for a contractor'], [[r[0], r[1]] for r in rows]))
    if kw == 'BID':
        crit = [[re.sub(r'\s*\((\d+)\)$', '', r[0]), re.search(r'\((\d+)\)$', r[0]).group(1)] for r in rows]
        return block('Ten criteria · default weights', static_table(['Criterion', 'Weight'], crit))
    if kw == 'LATER':
        return block('Five inputs', '<ol class="steps">' + ''.join(f'<li><span>{e(r[0])}</span></li>' for r in rows) + '</ol>')
    headers = [r[0] for r in rows]
    names = {'TAKEOFF': 'room-finish-schedule.csv', 'PAYAPP': 'g703-continuation.csv', 'VARIANCE': 'estimate-vs-actual.csv',
             'WALK': 'percent-complete-matrix.csv', 'TICKET': 'delivery-ledger.csv'}
    return block('Template · columns', editable_table(tid, headers, [], 6, 0, names.get(kw, 'template.csv')))

def render_section(a, s, idx):
    t = s['type']; kw = a['keyword']
    if t == 'checklist': return render_checklist(a, s, idx)
    if t == 'fields': return render_fields(a, s, idx)
    if t in ('steps', 'scope'):
        label = {'steps': 'Build steps', 'scope': 'What I deliver'}[t]
        if kw == 'SPEC': label = 'Setup · twenty minutes'
        lis = ''.join(f'<li><span>{e(x)}</span></li>' for x in s['items'])
        return block(label, f'<ol class="steps">{lis}</ol>')
    if t in ('prompt', 'code'):
        label = s['label'] if t == 'prompt' else 'Template · paste in <head>'
        if kw == 'SPEC': label = 'Ten standing questions'
        return block(label, prompt_block(f'{kw.lower()}-p{idx}', label, s['text'], s.get('note')))
    if t == 'scoring':
        return block('Scoring', f'<div class="callout"><b>How to read it</b>{e(s["text"])}</div>')
    raise ValueError(t)

# ---------- per-asset extras ----------
def extras(a):
    kw = a['keyword']; out = ''
    if kw == 'CURVE':
        rows = ''.join(f'<div class="callout" style="margin-bottom:18px"><b>{e(b["range"])} · {e(b["band"])} · {e(b["gap"])}</b>'
                       f'<span class="muted">On site:</span> {e(b["site"])}<br><span class="muted">First move:</span> {e(b["move"])}</div>' for b in CURVE_BANDS)
        out += block('Three bands', rows)
    if kw == 'OVERNIGHT':
        out += block('Tool pairings', static_table(['Automation', 'Source', 'Google Workspace', 'Microsoft 365'], OVERNIGHT_PAIRINGS)
                     + '<p class="note">Build order: easiest first. The 11 PM daily report is the one to start with.</p>')
    if kw == 'SCHEMA':
        out += block('Every field, and the signal it feeds', static_table(['Field', 'What to put there', 'Signal'], SCHEMA_FIELDS)
                     + '<p class="note">Validation: paste the block at validator.schema.org, fix every error, then check Google Search Console → Enhancements a week after publishing.</p>')
    if kw == 'PROFILE':
        out += block('Thirty-minute fix session', static_table(['When', 'What'], PROFILE_PLAN))
    if kw == 'PROPOSAL':
        out += block('Source folder structure', prompt_block('proposal-tree', 'Folder layout', PROPOSAL_TREE))
    if kw == 'TALK':
        for i, (name, text) in enumerate(TALK_EXAMPLES):
            out += block(f'Example output · {name}', prompt_block(f'talk-ex{i}', f'Example · {name}', text))
    if kw == 'SIXAM':
        out += block('What to measure', '<div class="callout"><b>Days open, by sub</b>Average days-open per responsible company, before the digest and every week after. Chart it and share it at the OAC.</div>')
    return out

def audit_form(a):
    kw = a['keyword']
    return block('Request your audit', f'''<form class="f" data-lead="audit_request" data-done="Request received. Results within 48 hours.">
<input type="hidden" name="keyword" value="{kw}">
<p class="hp" aria-hidden="true"><label>Leave empty <input name="hp" tabindex="-1" autocomplete="off"></label></p>
<div class="row2"><label class="fl">Firm name<input class="t" name="firm" required></label><label class="fl">Website<input class="t" name="website" placeholder="https://"></label></div>
<div class="row2"><label class="fl">City<input class="t" name="city" required></label><label class="fl">Primary trade or project type<input class="t" name="trade" required></label></div>
<label class="fl">Email<input class="t" type="email" name="email" required></label>
<div><button class="btn primary" type="submit">Send my {kw}</button></div><p class="ok" aria-live="polite"></p></form>
<p class="print-only">Request yours at {e(a["url"])}: firm name, city and trade. Delivered within 48 hours.</p>''')

def result_form(a, note):
    kw = a['keyword']
    return f'''<form class="f" id="result-form" data-lead="tool_result" data-done="Sent. Check your inbox." style="margin-top:24px;border-top:1px solid var(--line);padding-top:20px">
<input type="hidden" name="keyword" value="{kw}"><input type="hidden" name="result" id="result-field">
<p class="hp" aria-hidden="true"><label>Leave empty <input name="hp" tabindex="-1" autocomplete="off"></label></p>
<p class="muted" style="margin:0">{e(note)}</p>
<div class="row2"><label class="fl">Email<input class="t" type="email" name="email" required></label><label class="fl">Firm (optional)<input class="t" name="firm"></label></div>
<div><button class="btn primary" type="submit">Send it to me</button> <a class="btn" data-book href="/book">Book a call</a></div><p class="ok" aria-live="polite"></p></form>'''

TOOL_NOTES = {
    'CURVE': 'Send your score and answers to yourself (and me). I will reply with the first move for your band.',
    'SIGNALS': 'Send your six ratings and I will tell you which bar to lift first.',
    'AUDIT': 'Send your scored sheet and I will reply with your top three fixes.',
    'LATER': 'Send the result to yourself, with the one-page summary, to forward to whoever keeps saying later.',
    'SCHEMA': 'Optional: send yourself the finished block and I will check it against your GBP.',
    'TALK': 'Want this wired to your incident log so the talk writes itself each morning? Leave your email.',
    'BID': 'Send your scorecard and weights to yourself for the Monday meeting.',
}
TOOL_TITLES = {'CURVE': 'Score yourself', 'SIGNALS': 'Rate your six signals', 'AUDIT': 'Run the audit', 'LATER': 'Calculate it',
               'SCHEMA': 'Generate your schema', 'TALK': 'Generate today’s talk', 'BID': 'Score an RFP'}

def tool_data(a):
    kw = a['keyword']
    secs = {s['type']: s for s in a['sections']}
    if kw == 'CURVE': d = {'items': secs['checklist']['items'], 'bands': CURVE_BANDS}
    elif kw == 'SIGNALS': d = {'rows': secs['fields']['rows']}
    elif kw == 'AUDIT':
        d = {'prompts': [re.sub(r'^\d+\s+', '', l) for l in secs['prompt']['text'].split('\n') if re.match(r'^\d+\s', l)]}
    elif kw == 'BID':
        d = {'criteria': [[re.sub(r'\s*\((\d+)\)$', '', r[0]), int(re.search(r'\((\d+)\)$', r[0]).group(1))] for r in secs['fields']['rows']]}
    elif kw == 'TALK': d = {'prompt': secs['prompt']['text']}
    else: d = {}
    return '<script type="application/json" id="tool-data">' + json.dumps(d).replace('</', '<\\/') + '</script>'

def tool_block(a):
    kw = a['keyword']
    return tool_data(a) + (f'<section class="block no-print" id="tool-section"><div class="wrap"><div class="label"><span>Live tool</span></div>'
            f'<h2>{e(TOOL_TITLES[kw])}</h2><div class="tool" id="tool" data-tool="{kw}"></div>{result_form(a, TOOL_NOTES[kw])}</div></section>')

CTA = {
    'visibility': ('Want the gaps closed for you?', 'This page shows where the signal breaks. 6 Signal fixes it: schema, profiles, answer pages and the quarterly score, run for you.'),
    'workflow': ('Want this running inside your firm?', 'The prompt is the easy part. 6 Signal builds the automation around it, connects it to Procore or ACC, and trains the people who use it.'),
}

def page(a):
    kw = a['keyword']
    files = []
    acts = []
    if a['has_tool']: acts.append('<a class="btn primary" href="#tool-section">Open the tool</a>')
    acts.append(f'<a class="btn" href="/get/{a["slug"]}/{a["slug"]}-6signal.pdf" download>Download PDF</a>')
    if a['has_sheet']: acts.append(f'<a class="btn" href="/get/{a["slug"]}/{a["slug"]}-6signal.xlsx" download>Download sheet (.xlsx)</a>')
    if kw in ('RADAR', 'NAMED'): acts.insert(0, '<a class="btn primary" href="#request">Request it</a>')
    get = ''.join(f'<li>{e(g)}</li>' for g in a['get'])
    body = head(f'{a["name"]} · 6 Signal', a['sub'], kw, a['url'])
    body += f'''<section class="hero"><div class="wrap">
<div class="kicker"><span class="kw">{kw}</span><span>{e(a["id"].upper())} · {e(a["track"])} · {e(a["format"])}</span></div>
<h1>{e(a["name"])}</h1><p class="lede">{e(a["sub"])}</p>
<div class="actions">{''.join(acts)}</div></div></section>'''
    body += block('What you get', f'<ul class="get">{get}</ul>')
    if kw in ('RADAR', 'NAMED'):
        body += '<div id="request"></div>' + audit_form(a)
    if a['has_tool']:
        body += tool_block(a)
    for i, s in enumerate(a['sections']):
        body += render_section(a, s, i)
    body += extras(a)
    title, text = CTA[a['cta_kind']]
    if a['cta_kind'] == 'visibility':
        cta_btn = '<a class="btn primary" href="/visibility-check">Get the audit</a>'
        cta_print = 'Get the AI Visibility Audit: 6signal.co/visibility-check'
    else:
        cta_btn = '<a class="btn primary" data-book href="/book">Book a call</a>'
        cta_print = 'Book a call: 6signal.co/book'
    body += f'''<section class="cta"><div class="wrap"><div class="label"><span>Next step</span></div><h2>{e(title)}</h2><p>{e(text)}</p>
<div class="actions">{cta_btn}<a class="btn" href="/get">More free assets</a></div>
<p class="print-only">{cta_print}</p></div></section>'''
    body += FOOT
    if a['has_tool']:
        body += f'<script src="/get/assets/tools/{a["slug"]}.js"></script>'
    body += '</body></html>'
    return body

def hub():
    body = head('Free assets for contractors · 6 Signal', 'Checklists, prompts, blueprints and tools for AI adoption in construction.')
    body += '''<section class="hero"><div class="wrap"><div class="kicker"><span class="kw">FREE</span><span>36 assets · AI adoption in AEC</span></div>
<h1>Comment the keyword. Get the thing.</h1><p class="lede">Every asset from the series in one place: checklists, prompts, automation blueprints and working tools for contractors.</p></div></section>
<section class="block hub"><div class="wrap">'''
    tracks = []
    for a in A:
        if a['track'] not in tracks: tracks.append(a['track'])
    for t in tracks:
        body += f'<h3>{e(t)}</h3><div class="cards">'
        for a in [x for x in A if x['track'] == t]:
            body += f'<a class="card" href="/get/{a["slug"]}"><span class="k">{e(a["id"].upper())} · {a["keyword"]}</span><span class="n">{e(a["name"])}</span><span class="f">{e(a["format"])}{" · live tool" if a["has_tool"] else ""}</span></a>'
        body += '</div>'
    body += '</div></section>' + FOOT + '</body></html>'
    return body

if __name__ == '__main__':
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'get', 'assets', 'tools'))
    for f in ('get.css', 'get.js', 'config.js'):
        shutil.copy(os.path.join(ROOT, 'static', f), os.path.join(OUT, 'get', 'assets', f))
    shutil.copytree(os.path.join(ROOT, 'static', 'fonts'), os.path.join(OUT, 'get', 'assets', 'fonts'))
    tdir = os.path.join(ROOT, 'static', 'tools')
    if os.path.isdir(tdir):
        for f in os.listdir(tdir): shutil.copy(os.path.join(tdir, f), os.path.join(OUT, 'get', 'assets', 'tools', f))
    open(os.path.join(OUT, 'get', 'index.html'), 'w').write(hub())
    for a in A:
        d = os.path.join(OUT, 'get', a['slug']); os.makedirs(d)
        open(os.path.join(d, 'index.html'), 'w').write(page(a))
        x = os.path.join(ROOT, 'xlsx', f"{a['slug']}-6signal.xlsx")
        if a['has_sheet']: shutil.copy(x, d)
    print('built', len(A), 'pages')
