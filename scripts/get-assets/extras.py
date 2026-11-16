"""Content the playbook promises under 'What they get' but does not spell out. Written to match its voice."""

CURVE_BANDS = [
    {'band': 'Late curve', 'range': '0–4', 'gap': '18+ months behind',
     'site': 'Reports typed at night from memory. RFIs answered from a blank field. A few people use free ChatGPT on their phones, with no policy and nobody responsible.',
     'move': 'Write a one-page AI use policy, put every PM on a business-plan assistant seat with data controls on, and start with meeting notes → action items.'},
    {'band': 'Middle curve', 'range': '5–8', 'gap': '6–12 months behind',
     'site': 'Pockets of real use. One or two champions. Nothing is measured, nothing connects to Procore or ACC, and results depend on who is on the job.',
     'move': 'Name one owner, pick one workflow (daily reports or RFI drafts), and measure 30 days before and after. Make the result the standard on every job.'},
    {'band': 'Leader curve', 'range': '9–12', 'gap': 'Setting the pace',
     'site': 'Workflows run with owners and review steps. A monthly review retires what nobody uses. Estimating and safety draw on the firm’s own data.',
     'move': 'Wire the running workflows into project systems through an automation layer, and track your six-signal visibility score every quarter.'},
]

STATIC_OWNERS = ['Web', 'Office manager', 'Office manager', 'PMs at closeout', 'Marketing', 'Precon + marketing',
                 'Principal', 'Web', 'Marketing', 'Office manager', 'Leadership', 'Owner']

STACK_LAYERS = {
    'DATA': ('Ops / document control', 'Assistants answer from the wrong revision, or cannot find the record at all.'),
    'ACCESS': ('Ops lead or IT', 'Company drawings and contracts end up in personal free accounts.'),
    'TOOLS': ('Ops lead', 'People copy and paste between apps, so nothing can be automated.'),
    'WORKFLOWS': ('A named owner per workflow', 'Use stays personal and leaves the firm when the person does.'),
    'GOVERNANCE': ('Principal or executive sponsor', 'Nobody knows what is allowed, so either nothing happens or anything does.'),
    'VISIBILITY': ('Marketing', 'The firm does the work well and stays invisible to the buyer’s first search.'),
}

OVERNIGHT_PAIRINGS = [
    ('11:00 PM · Daily report', 'Procore Daily Log / ACC Daily Reports, photos', 'Zapier or Apps Script → Gmail draft', 'Power Automate → Outlook draft'),
    ('11:30 PM · RFI digest', 'Procore RFIs / ACC RFIs', 'Zapier or Make → Gmail drafts', 'Power Automate → Outlook drafts'),
    ('12:00 AM · Lookahead', 'Schedule export + submittal log', 'Google Sheets + Apps Script', 'Excel Online + Power Automate'),
    ('4:30 AM · Weather and crew', 'Weather API for site coordinates', 'Apps Script → Docs template', 'Power Automate → Word template'),
    ('5:30 AM · Inbox pre-sort', 'Project email', 'Gmail labels + Zapier', 'Outlook categories + Power Automate'),
]

SCHEMA_FIELDS = [
    ('name, url, logo, image', 'Legal firm name exactly as on your GBP; homepage URL; square logo and an HQ or crew photo', 'IEO · GEO'),
    ('telephone, email, address', 'The same NAP as your GBP footer, character for character', 'LEO · VEO'),
    ('geo', 'Latitude and longitude of the office (the generator can look it up)', 'LEO · VEO'),
    ('areaServed', 'The cities you actually work in, one per entry', 'LEO · GEO'),
    ('foundingDate, numberOfEmployees', 'Year founded and headcount: signals of an established firm', 'GEO'),
    ('knowsAbout', 'Delivery methods, building types and specialties, written the way buyers say them', 'PEO · GEO'),
    ('hasOfferCatalog', 'One Service per line item you sell', 'AEO · PEO'),
    ('sameAs', 'GBP, LinkedIn, association member page, YouTube channel', 'LEO · GEO'),
    ('aggregateRating', 'Only if you have five or more public reviews; match the GBP numbers', 'LEO'),
]

PROFILE_PLAN = [
    ('Minutes 0–10', 'Fields 1–5: primary and secondary categories, service area, services with descriptions, the business description.'),
    ('Minutes 10–20', 'Fields 6–10: opening date, phone and website match, attributes, upload ten captioned project photos, seed five Q&As.'),
    ('Minutes 20–30', 'Fields 11–14: reply to every unanswered review, publish one post, add project types as Products, point the quote link at a page with schema.'),
]

PROPOSAL_TREE = '''Proposals/
  _Source/
    Winning-proposals/      last three wins, PDF or Word
    Project-list.xlsx       name, owner, contact, value, dates, role, outcome
    Resumes/                one file per key person, updated quarterly
    Safety/                 EMR letters, OSHA 300A, program summary
  {Project name}/
    RFP/                    RFP, addenda, Q&A
    Drafts/                 assistant drafts, one file per section
    Final/'''

TALK_EXAMPLES = [
    ('Fall', '''TOOLBOX TALK · Level 3 deck edge · Tuesday
1. Yesterday: a laborer unclipped to reach past the guardrail at the east stair opening. Nobody fell. It was close.
2. Today's hazards:
 - Leading-edge work while the decking crew finishes bay C [OSHA 1926 Subpart M]
 - Floor openings at the east and west stairs, covers not yet secured [Subpart M]
 - Ladder access to the level 3 deck while materials are being hoisted [Subpart X]
3. Controls:
 - Every worker inside 6 ft of the edge stays tied off to the beam strap. Foreman checks at 10 and 2.
 - Hole covers marked "HOLE" and screwed down before 8 AM. Carpenter foreman.
 - Ladder use pauses during picks. Signal person calls it.
4. Ask the crew: where on this deck would you be tempted to unclip, and why?
5. Sign-in below.'''),
    ('Struck-by', '''TOOLBOX TALK · Steel erection, grid C–F · Thursday
1. Yesterday: a tag line slipped and a beam swung across the north access path. No one was in the path.
2. Today's hazards:
 - Suspended loads over the north access path during steel picks [OSHA 1926 Subpart R]
 - Backing equipment near the laydown yard with two spotters short [Subpart O]
 - Dropped bolts and tools from the level 2 connectors [Subpart R]
3. Controls:
 - North path closed with barricade and a flagger during every pick. Erection foreman.
 - No backing without a spotter. Equipment operators confirm by radio.
 - Tool lanyards on every connector, and the area below taped off. Connector lead checks.
4. Ask the crew: who has the authority to stop a pick, and how do they call it?
5. Sign-in below.'''),
    ('Heat', '''TOOLBOX TALK · Site work and paving · Monday
1. Yesterday: an operator on the roller felt dizzy at 2:30 and sat out the rest of the shift. Heat index hit 104.
2. Today's hazards:
 - Heat index forecast 106 by 2 PM, asphalt surface far hotter [OSHA General Duty Clause; heat illness guidance]
 - Two new crew members not yet acclimatized [General Duty Clause]
 - Hot mix temperatures at the paver and screed [1926 Subpart D]
3. Controls:
 - Water, rest and shade: a 10-minute break every hour after noon. Foreman runs the timer.
 - New workers on a reduced schedule with a buddy. Superintendent assigns pairs.
 - Long sleeves and gloves at the screed. Paving foreman checks.
4. Ask the crew: what does heat exhaustion look like on someone else, before they notice it?
5. Sign-in below.'''),
]

# template column headers for tables that ship blank
TABLE_HEADERS = {
    'ROADMAP': ['Quarter', 'Workflow', 'Owner', 'Tool', 'Metric', 'Status'],
    'NODE': ['Signal', 'Minimum asset', 'Where it lives', 'Owner', 'Cadence'],
}
