"""Normalize parsed assets: pretty labels, DM split, table rows, tool/sheet flags."""
import json, re

A = json.load(open('assets.json'))

TRACK = {'CONCEPTLOOPS': 'Concept Loops', 'DARKMOTION': 'Dark Motion', 'LIGHTMOTION': 'Light Motion',
         'INFRASTRUCTURE': 'Infrastructure', 'CONSTRUCTIONSOFTWARE': 'Construction Software',
         'REALWORKFLOWS': 'Real Workflows'}
FORMAT = {'FREEMINIAUDIT': 'Free mini audit', 'CHECKLIST+TOOL': 'Checklist + tool', 'PROMPTPACK': 'Prompt pack',
          'CHECKLIST': 'Checklist', 'TEMPLATE+TOOL': 'Template + tool', 'AUTOMATIONBLUEPRINT': 'Automation blueprint',
          'FILLABLETEMPLATE': 'Fillable template', 'PROMPTSCRIPT+TOOL': 'Prompt script + tool',
          'TOOL+TEMPLATE': 'Tool + template', 'FILLABLECHECKLIST': 'Fillable checklist',
          'PROMPT+BLUEPRINT': 'Prompt + blueprint', 'PROMPT': 'Prompt', 'PROMPT+TEMPLATE': 'Prompt + template',
          'PROMPT+TOOL': 'Prompt + tool', 'PROMPT+CHECKLIST': 'Prompt + checklist',
          'SETUPGUIDE+PROMPTS': 'Setup guide + prompts'}
TOOLS = {'CURVE', 'SIGNALS', 'AUDIT', 'LATER', 'SCHEMA', 'TALK', 'BID'}
# assets that promise a sheet / spreadsheet download
SHEETS = {'ROADMAP', 'LATER', 'NODE', 'TAKEOFF', 'PAYAPP', 'BID', 'VARIANCE', 'WALK', 'TICKET'}
# "visibility" assets point their CTA at the visibility audit; others at the workflow audit
VISIBILITY = {'RADAR', 'SIGNALS', 'STATIC', 'AUDIT', 'SCHEMA', 'NODE', 'FOOTINGS', 'NAMED', 'PROFILE'}

def title_case(t):
    small = {'a', 'an', 'the', 'of', 'in', 'as', 'to', 'vs', 'and', 'or', 'for', 'you', 'by'}
    words = t.split(' ')
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if w in ('AI', 'RFI', 'GBP', 'OAC', 'G703', 'QA', 'AM', 'DIY', '+', '→', '/', '360') or re.match(r'^\d', w):
            out.append(w)
        elif i and lw in small:
            out.append(lw)
        else:
            out.append(w[:1] + w[1:].lower())
    return ' '.join(out).replace('6-signal', '6-Signal').replace('No-bid', 'No-Bid').replace('Bid / no-bid', 'Bid / No-Bid')

for a in A:
    a['track'] = TRACK[a['track']]
    a['format'] = FORMAT[a['format']]
    a['slug'] = a['keyword'].lower()
    a['url'] = f"https://6signal.co/get/{a['slug']}"
    a['has_tool'] = a['keyword'] in TOOLS
    a['has_sheet'] = a['keyword'] in SHEETS
    a['cta_kind'] = 'visibility' if a['keyword'] in VISIBILITY else 'workflow'
    a['name'] = title_case(a['title'])
    m = re.match(r'(Thanks for the .*?https://\S+)\s+(.*)$', a['dm'])
    a['dm_line1'], a['dm_line2'] = m.group(1), m.group(2)
    for s in a['sections']:
        if s['type'] == 'fields' and a['keyword'] == 'NODE':
            rows, buf = [], ''
            for it in s['items']:
                if re.match(r'^(GEO|AEO|LEO|VEO|PEO|IEO) —', it):
                    if buf: rows.append(buf)
                    buf = it
                else:
                    buf += ' ' + it
            rows.append(buf)
            s['items'] = [re.sub(r'\s+—\s+', ' — ', r).replace('— —', '—').strip() for r in rows]
        if s['type'] == 'fields':
            s['rows'] = [[c.strip() for c in re.split(r'\s+—\s+', it)] for it in s['items']]

# hand corrections the parser cannot know
by = {a['keyword']: a for a in A}
by['RADAR']['name'] = '6-Signal Radar Scorecard'
by['SIXAM']['name'] = '6 AM Punch Digest'
by['STATIC']['name'] = '12 Reasons You Render as Static'
by['ROADMAP']['name'] = '24-Month Adoption Roadmap'
by['TAKEOFF']['name'] = 'Takeoff QA + Room Finish Schedule'
by['PAYAPP']['name'] = 'G703 Percent-Complete Fill'
by['NOTES']['name'] = 'OAC Meeting → Action Items'
by['WALK']['name'] = '360 Walk → Percent Complete'
by['TICKET']['name'] = 'Delivery Ticket → Ledger Line'
by['PROFILE']['name'] = 'GBP Gap Fix Guide'
by['NAMED']['name'] = 'Who AI Names Instead of You'
by['AUDIT']['name'] = 'DIY AI Visibility Audit'
by['STAKES']['name'] = 'AI Table Stakes Checklist'
by['STACK']['name'] = 'AI Infrastructure Stack Checklist'
by['RFI']['name'] = 'RFI Response Drafter'
by['BID']['name'] = 'Bid / No-Bid Scorecard'

for k,v in {'CURVE':'Adoption Curve Self-Score','SIGNALS':'Six Signals Self-Rating','FOOTINGS':'Six Footings Self-Check',
  'STAMP':'Submittal Pre-Review Prompt','PUNCH':'Photo-to-Punch Prompt','INBOX':'Change-Order Risk Inbox Triage'}.items():
    by[k]['name']=v

# Schema template: rebuild cleanly (PDF wrapping broke the JSON)
for s in by['SCHEMA']['sections']:
    if s['type'] == 'code':
        s['text'] = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  "name": "{Firm legal name}",
  "url": "https://{domain}",
  "logo": "https://{domain}/logo.png",
  "image": "https://{domain}/hq.jpg",
  "telephone": "{+1-xxx-xxx-xxxx}",
  "email": "{contact@domain}",
  "address": {"@type": "PostalAddress", "streetAddress": "{street}", "addressLocality": "{city}", "addressRegion": "{state}", "postalCode": "{zip}", "addressCountry": "US"},
  "geo": {"@type": "GeoCoordinates", "latitude": {lat}, "longitude": {lng}},
  "areaServed": [{"@type": "City", "name": "{city 1}"}, {"@type": "City", "name": "{city 2}"}],
  "foundingDate": "{YYYY}",
  "numberOfEmployees": {"@type": "QuantitativeValue", "value": {count}},
  "knowsAbout": ["{design-build}", "{tenant improvement}", "{tilt-up}", "{healthcare construction}"],
  "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Services", "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": "{Service 1}"}}]},
  "sameAs": ["{GBP URL}", "{LinkedIn URL}", "{AGC/ABC member page}", "{YouTube channel}"],
  "aggregateRating": {"@type": "AggregateRating", "ratingValue": "{4.8}", "reviewCount": "{37}"}
}
</script>'''
        s['note'] = 'Validate at validator.schema.org, then in Google Search Console → Enhancements. Remove aggregateRating if you have fewer than five public reviews.'

json.dump(A, open('assets.json', 'w'), indent=1, ensure_ascii=False)
for a in A:
    print(a['keyword'].ljust(10), a['name'].ljust(40), a['format'].ljust(22), 'tool' if a['has_tool'] else '    ', 'sheet' if a['has_sheet'] else '')
print(by['NODE']['sections'][0]['rows'])
