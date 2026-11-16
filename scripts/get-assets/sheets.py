"""Build the .xlsx templates promised by ROADMAP, LATER, NODE, TAKEOFF, PAYAPP, BID, VARIANCE, WALK, TICKET."""
import os, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
AR = 'Arial'
HFILL = PatternFill('solid', fgColor='0A0A0A')
INFILL = PatternFill('solid', fgColor='FFFF00')
EXFILL = PatternFill('solid', fgColor='F4F2EC')
thin = Side(style='thin', color='D8D5CC')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
BLUE = Font(name=AR, size=10, color='0000FF')
BLACK = Font(name=AR, size=10)
BOLD = Font(name=AR, size=10, bold=True)

def sheet_head(ws, title, sub):
    ws['A1'] = title; ws['A1'].font = Font(name=AR, size=14, bold=True)
    ws['A2'] = sub; ws['A2'].font = Font(name=AR, size=9, color='555555')
    ws.sheet_view.showGridLines = False

def headers(ws, row, cols, widths):
    for i, (h, w) in enumerate(zip(cols, widths), 1):
        c = ws.cell(row=row, column=i, value=h)
        c.font = Font(name=AR, size=10, bold=True, color='FFFFFF'); c.fill = HFILL
        c.alignment = Alignment(wrap_text=True, vertical='center'); c.border = BOX
        ws.column_dimensions[c.column_letter].width = w
    ws.row_dimensions[row].height = 30
    ws.freeze_panes = ws.cell(row=row + 1, column=1)

def put(ws, r, c, v, font=None, fmt=None, fill=None, wrap=False):
    cell = ws.cell(row=r, column=c, value=v)
    cell.font = font or (BLACK if isinstance(v, str) and str(v).startswith('=') else BLUE)
    cell.border = BOX
    if fmt: cell.number_format = fmt
    if fill: cell.fill = fill
    cell.alignment = Alignment(wrap_text=wrap, vertical='top')
    return cell

def legend(ws, row, text):
    ws.cell(row=row, column=1, value='How to use').font = BOLD
    ws.cell(row=row + 1, column=1, value=text).font = Font(name=AR, size=9, color='555555')
    ws.cell(row=row + 2, column=1, value='Blue text = your inputs · black = formulas · yellow = fill these in · shaded row = example, overwrite or delete it. 6signal.co/get').font = Font(name=AR, size=9, color='555555')

def dv_list(ws, rng, options):
    dv = DataValidation(type='list', formula1='"' + ','.join(options) + '"', allow_blank=True)
    ws.add_data_validation(dv); dv.add(rng)

def save(wb, name):
    p = os.path.join(OUT, name); wb.save(p); print(p)

# ---------- ROADMAP ----------
wb = Workbook(); ws = wb.active; ws.title = 'Roadmap'
sheet_head(ws, '24-Month AI Adoption Roadmap', 'Eight quarters, one workflow per quarter. Replace each owner role with a person’s name.')
cols = ['Quarter', 'Workflow', 'Owner (name)', 'Tool', 'Metric', 'Baseline', 'Target', 'Status']
headers(ws, 4, cols, [10, 34, 22, 22, 36, 12, 12, 14])
rows = [('Q1', 'Meeting notes → action items', 'Ops lead', 'hours of PM typing saved'), ('Q2', 'Daily report autopilot', 'Field ops', 'reports submitted before 5 PM, %'),
        ('Q3', 'RFI draft responses', 'PM lead', 'median days open'), ('Q4', 'Spec book Q&A', 'Precon', 'lookups per week, time per lookup'),
        ('Q5', 'Submittal pre-review', 'PM lead', 'review cycle days'), ('Q6', 'Inbox risk triage', 'Project exec', 'change orders caught before notice deadline'),
        ('Q7', 'Schema, GBP, AI visibility baseline', 'Marketing', 'six-signal total'), ('Q8', 'Estimate vs actual review', 'Estimating', 'variance %')]
for i, (q, w, o, m) in enumerate(rows, 5):
    put(ws, i, 1, q, BLACK); put(ws, i, 2, w, BLACK); put(ws, i, 3, o, BLUE, fill=INFILL); put(ws, i, 4, '', fill=INFILL)
    put(ws, i, 5, m, BLACK); put(ws, i, 6, '', fill=INFILL); put(ws, i, 7, '', fill=INFILL); put(ws, i, 8, 'Not started')
put(ws, 5, 4, 'Claude Team + Otter', BLUE, fill=INFILL)
dv_list(ws, 'H5:H12', ['Not started', 'In progress', 'Running', 'Retired'])
legend(ws, 14, 'Reorder rows if your firm needs a different sequence. The roadmap is done when every Owner cell holds a real name.')
save(wb, 'roadmap-6signal.xlsx')

# ---------- LATER ----------
wb = Workbook(); ws = wb.active; ws.title = 'Cost of Later'
sheet_head(ws, 'Cost of Later Calculator', 'What waiting costs, in hours and dollars. Change the blue inputs.')
ws.column_dimensions['A'].width = 48; ws.column_dimensions['B'].width = 16; ws.column_dimensions['C'].width = 50
headers(ws, 4, ['Input', 'Value', 'Note'], [48, 16, 50]); ws.freeze_panes = None
ins = [('PMs and supers (count)', 12, '0', 'Your headcount'), ('Admin hours per person per week', 11, '0.0', 'Reports, RFIs, notes, email. Typical 9–14'),
       ('Share recoverable with current tools', 0.35, '0%', 'Default 35%'), ('Loaded hourly rate ($)', 85, '$#,##0', 'Default $85'),
       ('Months of delay', 6, '0', 'How long "later" lasts')]
for i, (l, v, f, n) in enumerate(ins, 5):
    put(ws, i, 1, l, BLACK); put(ws, i, 2, v, BLUE, f, INFILL); put(ws, i, 3, n, Font(name=AR, size=9, color='555555'))
put(ws, 10, 1, 'Weeks per month', BLACK); put(ws, 10, 2, 4.33, BLUE, '0.00'); put(ws, 10, 3, '52 weeks ÷ 12 months', Font(name=AR, size=9, color='555555'))
put(ws, 12, 1, 'Recoverable hours per month', BOLD); put(ws, 12, 2, '=B5*B6*B7*B10', BLACK, '#,##0')
put(ws, 13, 1, 'Recoverable hours over the delay', BOLD); put(ws, 13, 2, '=B12*B9', BLACK, '#,##0')
put(ws, 14, 1, 'Cost of later ($)', Font(name=AR, size=12, bold=True)); put(ws, 14, 2, '=B13*B8', Font(name=AR, size=12, bold=True), '$#,##0')
put(ws, 15, 1, 'Formula', BLACK); put(ws, 15, 2, 'people × hours/week × recoverable share × rate × 4.33 × months', BLACK)
ws.merge_cells('B15:C15')
put(ws, 17, 1, 'Months of delay', BOLD); put(ws, 17, 2, 'Cost ($)', BOLD); put(ws, 17, 3, 'Hours', BOLD)
for i, m in enumerate([3, 6, 9, 12, 18, 24], 18):
    put(ws, i, 1, m, BLUE, '0'); put(ws, i, 2, f'=$B$12*A{i}*$B$8', BLACK, '$#,##0'); put(ws, i, 3, f'=$B$12*A{i}', BLACK, '#,##0')
legend(ws, 25, 'Defaults reproduce the worked example: 12 people, 11 hours, 35%, $85, 6 months ≈ $102,000.')
save(wb, 'later-6signal.xlsx')

# ---------- NODE ----------
wb = Workbook(); ws = wb.active; ws.title = 'Content Map'
sheet_head(ws, 'Recommendation Content Map', 'Signal → asset → where it lives → owner → cadence. Fill the Owner column first.')
headers(ws, 4, ['Signal', 'Minimum asset', 'Where it lives', 'Owner (name)', 'Cadence', 'Status', 'Last updated'], [9, 52, 26, 24, 18, 14, 14])
import json as _json
_A = {x['keyword']: x for x in _json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets.json')))}
nrows = [tuple(r) for r in next(sec for sec in _A['NODE']['sections'] if sec['type'] == 'fields')['rows']]
for i, r in enumerate(nrows, 5):
    for j, v in enumerate(r, 1): put(ws, i, j, v, BLUE if j == 4 else BLACK, fill=INFILL if j == 4 else None, wrap=True)
    put(ws, i, 6, 'Not started'); put(ws, i, 7, None, BLUE, 'yyyy-mm-dd', INFILL)
for i in range(11, 15):
    for j in range(1, 8): put(ws, i, j, None, fill=INFILL if j in (2, 4) else None)
dv_list(ws, 'F5:F14', ['Not started', 'In progress', 'Live', 'Needs refresh'])
legend(ws, 16, 'Rows 11–14 are for assets you add. An asset without an owner is a line that never reaches the node.')
save(wb, 'node-6signal.xlsx')

# ---------- TAKEOFF ----------
wb = Workbook(); ws = wb.active; ws.title = 'Room Finish Schedule'
sheet_head(ws, 'Room Finish Schedule + Takeoff QA', 'Paste the assistant’s table in columns A–I, your own takeoff SF in J. Rows over 5% variance flag.')
cols = ['Room number', 'Room name', 'Floor finish', 'Base', 'Wall finish', 'Ceiling finish', 'Ceiling height', 'Area SF (est.)', 'Notes / conflicts', 'My takeoff SF', 'Variance %', 'Flag']
headers(ws, 4, cols, [12, 20, 16, 12, 18, 16, 12, 13, 30, 13, 12, 10])
ex = ['101', 'Lobby', 'LVT-1', 'RB-1', 'PT-1', 'ACT-1', "9'-0\"", 640, 'Schedule says CPT-2; plan tag LVT-1', 610]
for j, v in enumerate(ex, 1): put(ws, 5, j, v, BLUE, '#,##0' if j in (8, 10) else None, EXFILL)
for i in range(5, 105):
    if i > 5:
        for j in range(1, 11): put(ws, i, j, None, BLUE, '#,##0' if j in (8, 10) else None)
    put(ws, i, 11, f'=IF(OR(H{i}="",J{i}="",J{i}=0),"",(H{i}-J{i})/J{i})', BLACK, '0.0%')
    put(ws, i, 12, f'=IF(K{i}="","",IF(ABS(K{i})>0.05,"CHECK",""))', BLACK)
put(ws, 106, 7, 'Total SF', BOLD); put(ws, 106, 8, '=SUM(H5:H104)', BOLD, '#,##0'); put(ws, 106, 10, '=SUM(J5:J104)', BOLD, '#,##0')
ws2 = wb.create_sheet('SF by Floor Finish')
sheet_head(ws2, 'Total SF by floor finish', 'Type each finish code once in column A.')
headers(ws2, 4, ['Floor finish', 'Assistant SF', 'My takeoff SF', 'Variance %'], [16, 16, 16, 14])
for i, code in enumerate(['LVT-1', 'CPT-2', 'SC-1', 'PT-1', '', '', '', ''], 5):
    put(ws2, i, 1, code or None, BLUE, fill=INFILL)
    put(ws2, i, 2, f"=SUMIF('Room Finish Schedule'!$C$5:$C$104,A{i},'Room Finish Schedule'!$H$5:$H$104)", BLACK, '#,##0')
    put(ws2, i, 3, f"=SUMIF('Room Finish Schedule'!$C$5:$C$104,A{i},'Room Finish Schedule'!$J$5:$J$104)", BLACK, '#,##0')
    put(ws2, i, 4, f'=IF(C{i}=0,"",(B{i}-C{i})/C{i})', BLACK, '0.0%')
legend(ws, 108, 'Run it first on a job you have already taken off. The share of rows without a CHECK flag is your confidence number.')
save(wb, 'takeoff-6signal.xlsx')

# ---------- PAYAPP ----------
wb = Workbook(); ws = wb.active; ws.title = 'G703'
sheet_head(ws, 'G703 Continuation Sheet · Percent-Complete Fill', 'Columns follow AIA G703. Paste the assistant’s "This period" values in E; stored materials in F are yours.')
put(ws, 3, 1, 'Retainage rate', BOLD); put(ws, 3, 2, 0.10, BLUE, '0%', INFILL)
cols = ['Item no.', 'Description of work', 'Scheduled value', 'From previous application', 'This period', 'Materials presently stored',
        'Total completed and stored', '%', 'Balance to finish', 'Retainage', 'Points moved this period', 'Flag']
headers(ws, 5, cols, [9, 32, 15, 15, 14, 15, 16, 9, 15, 13, 12, 18])
ex = [('01', 'General conditions', 180000, 90000, 18000, 0), ('03', 'Concrete', 420000, 315000, 105000, 0), ('09', 'Drywall and framing', 260000, 26000, 78000, 12000)]
N = 40
for k in range(N):
    i = 6 + k
    if k < 3:
        for j, v in enumerate(ex[k], 1): put(ws, i, j, v, BLUE, '$#,##0' if j > 2 else None, EXFILL)
    else:
        for j in range(1, 7): put(ws, i, j, None, BLUE, '$#,##0' if j > 2 else None)
    put(ws, i, 7, f'=IF(C{i}="","",D{i}+E{i}+F{i})', BLACK, '$#,##0')
    put(ws, i, 8, f'=IF(OR(C{i}="",C{i}=0),"",G{i}/C{i})', BLACK, '0.0%')
    put(ws, i, 9, f'=IF(C{i}="","",C{i}-G{i})', BLACK, '$#,##0')
    put(ws, i, 10, f'=IF(C{i}="","",G{i}*$B$3)', BLACK, '$#,##0')
    put(ws, i, 11, f'=IF(OR(C{i}="",C{i}=0),"",E{i}/C{i})', BLACK, '0.0%')
    put(ws, i, 12, f'=IF(K{i}="","",IF(K{i}>0.2,"MOVED >20 PTS",IF(AND(E{i}=0,D{i}>0,H{i}<1),"NO MOVEMENT","")))', BLACK)
t = 6 + N
put(ws, t, 2, 'Totals', BOLD)
for col in 'CDEFGIJ':
    c = ws[f'{col}{t}']; c.value = f'=SUM({col}6:{col}{t-1})'; c.font = BOLD; c.number_format = '$#,##0'; c.border = BOX
ws[f'H{t}'] = f'=IF(C{t}=0,"",G{t}/C{t})'; ws[f'H{t}'].font = BOLD; ws[f'H{t}'].number_format = '0.0%'
legend(ws, t + 2, 'Review the flags, not the arithmetic: lines that moved more than 20 points, and lines with no movement. Lines at 100% with open punch items need your punch log.')
save(wb, 'payapp-6signal.xlsx')

# ---------- BID ----------
wb = Workbook(); ws = wb.active; ws.title = 'Scorecards'
sheet_head(ws, 'Bid / No-Bid Scorecard', 'Weights in row 5 (change them). Score each RFP 0–5 per criterion. Pursue 70+, Discuss 50–69, Decline under 50.')
crit = [('Relationship with owner or architect', 15), ('Project type matches last five years', 15), ('Location within normal radius', 10),
        ('Size within 0.5–2× typical contract', 10), ('Competition: number of bidders known', 10), ('Schedule realism', 10),
        ('Contract terms: LDs, retainage, payment', 10), ('Self-perform share', 5), ('Bonding and prequal already in place', 10), ('Team capacity on award date', 5)]
cols = ['Project / RFP', 'Due date'] + [c[0] for c in crit] + ['Total (of 100)', 'Call', 'Notes']
headers(ws, 4, cols, [26, 12] + [14] * 10 + [12, 10, 30]); ws.row_dimensions[4].height = 58
put(ws, 5, 1, 'Weight →', BOLD); put(ws, 5, 2, None, BLACK)
for j, (_, w) in enumerate(crit, 3): put(ws, 5, j, w, BLUE, '0', INFILL)
put(ws, 5, 13, '=SUM(C5:L5)', BOLD, '0'); put(ws, 5, 14, 'weights', BLACK)
ws.freeze_panes = 'C6'
for i in range(6, 46):
    if i == 6:
        put(ws, 6, 1, 'Westside MOB (example)', BLUE, fill=EXFILL); put(ws, 6, 2, '2026-12-04', BLUE, fill=EXFILL)
        for j, s in enumerate([4, 5, 4, 3, 2, 3, 3, 4, 5, 3], 3): put(ws, 6, j, s, BLUE, '0', EXFILL)
    else:
        for j in range(1, 13): put(ws, i, j, None, BLUE, '0' if j > 2 else None)
    put(ws, i, 13, f'=IF(COUNT(C{i}:L{i})=0,"",ROUND(SUMPRODUCT($C$5:$L$5,C{i}:L{i})/5/$M$5*100,0))', BLACK, '0')
    put(ws, i, 14, f'=IF(M{i}="","",IF(M{i}>=70,"Pursue",IF(M{i}>=50,"Discuss","Decline")))', BLACK)
    put(ws, i, 15, None, BLUE)
dv = DataValidation(type='whole', operator='between', formula1='0', formula2='5', allow_blank=True, showErrorMessage=True, errorTitle='0–5', error='Score each criterion 0 to 5.')
ws.add_data_validation(dv); dv.add('C6:L45')
legend(ws, 47, 'Unscored criteria count as 0. Sort by Total before the Monday meeting; decline the bottom of the list and count the estimating hours you got back.')
save(wb, 'bid-6signal.xlsx')

# ---------- VARIANCE ----------
wb = Workbook(); ws = wb.active; ws.title = 'Job Review'
sheet_head(ws, 'Estimate vs Actual Review', 'One sheet per closed job. Codes over 5% variance flag. Approved change orders go in their own column so they are not counted as estimating error.')
put(ws, 3, 1, 'Job', BOLD); put(ws, 3, 2, None, BLUE, fill=INFILL)
cols = ['Cost code', 'Description', 'Estimated', 'Approved COs', 'Actual', 'Variance $', 'Variance %', 'Cause', 'Rate adjustment', 'Applied (date)']
headers(ws, 5, cols, [12, 28, 14, 14, 14, 14, 12, 16, 32, 14])
causes = ['Quantity', 'Unit rate', 'Productivity', 'Scope change', 'Buyout']
for i in range(6, 66):
    if i == 6:
        for j, v in enumerate(['03-300', 'Cast-in-place concrete', 410000, 12000, 468000], 1): put(ws, 6, j, v, BLUE, '$#,##0' if j > 2 else None, EXFILL)
        put(ws, 6, 8, 'Productivity', BLUE, fill=EXFILL); put(ws, 6, 9, 'Raise elevated deck labor factor 0.11 → 0.12 MH/SF', BLUE, fill=EXFILL)
        put(ws, 6, 10, None, BLUE, 'yyyy-mm-dd', EXFILL)
    else:
        for j in (1, 2, 3, 4, 5, 8, 9): put(ws, i, j, None, BLUE, '$#,##0' if j in (3, 4, 5) else None)
        put(ws, i, 10, None, BLUE, 'yyyy-mm-dd')
    put(ws, i, 6, f'=IF(OR(C{i}="",E{i}=""),"",E{i}-C{i}-D{i})', BLACK, '$#,##0;($#,##0);-')
    put(ws, i, 7, f'=IF(OR(C{i}="",C{i}=0,E{i}=""),"",F{i}/(C{i}+D{i}))', BLACK, '0.0%;(0.0%);-')
dv_list(ws, 'H6:H65', causes)
ws2 = wb.create_sheet('Rate Log')
sheet_head(ws2, 'Unit-rate adjustment log', 'Every rate change, with the job that taught it.')
headers(ws2, 4, ['Date', 'Cost code', 'Old rate', 'New rate', 'Change %', 'Unit', 'Source job', 'Reason'], [12, 12, 12, 12, 10, 10, 20, 40])
for i in range(5, 105):
    for j in (1, 2, 3, 4, 6, 7, 8): put(ws2, i, j, None, BLUE, 'yyyy-mm-dd' if j == 1 else ('0.00' if j in (3, 4) else None))
    put(ws2, i, 5, f'=IF(OR(C{i}="",C{i}=0,D{i}=""),"",(D{i}-C{i})/C{i})', BLACK, '0.0%')
legend(ws, 67, 'Variance % = (actual − estimate − approved COs) ÷ (estimate + approved COs). Run at every closeout; log every rate you change on the Rate Log sheet.')
save(wb, 'variance-6signal.xlsx')

# ---------- WALK ----------
wb = Workbook(); ws = wb.active; ws.title = 'Percent Complete'
sheet_head(ws, '360 Walk → Percent Complete', 'Room × trade matrix. Use the stage ladders so the numbers mean the same thing every week.')
put(ws, 3, 1, 'Walk date', BOLD); put(ws, 3, 2, None, BLUE, 'yyyy-mm-dd', INFILL)
cols = ['Room', 'Framing %', 'Drywall %', 'MEP rough %', 'Ceiling %', 'Flooring %', 'Paint %', 'Notes', 'Room avg', 'Last week avg', 'Δ vs last week', 'Flag']
headers(ws, 5, cols, [14, 11, 11, 12, 11, 11, 10, 30, 11, 13, 13, 14])
for i in range(6, 86):
    vals = ['L2-201', 1, 0.6, 0.8, 0.3, 0, 0, '~ partial view at north wall', None, 0.42] if i == 6 else [None] * 10
    for j in (1, 2, 3, 4, 5, 6, 7, 8, 10):
        put(ws, i, j, vals[j - 1], BLUE, '0%' if j in (2, 3, 4, 5, 6, 7, 10) else None, EXFILL if i == 6 else None)
    put(ws, i, 9, f'=IF(COUNT(B{i}:G{i})=0,"",AVERAGE(B{i}:G{i}))', BLACK, '0%')
    put(ws, i, 11, f'=IF(OR(I{i}="",J{i}=""),"",I{i}-J{i})', BLACK, '+0%;-0%;0%')
    put(ws, i, 12, f'=IF(K{i}="","",IF(K{i}<=0,"NO MOVEMENT",""))', BLACK)
ws2 = wb.create_sheet('Stage Ladders')
sheet_head(ws2, 'Stage ladders', 'The fixed percentages behind every estimate.')
headers(ws2, 4, ['Trade', 'Stages'], [16, 80])
for i, (t, s) in enumerate([('Framing', 'layout 10 · top track 30 · studs 60 · blocking 80 · inspected 100'), ('Drywall', 'hung 40 · taped 60 · finished 90 · primed 100'),
                            ('MEP rough', 'sleeves 20 · mains 50 · branches 80 · inspected 100'), ('Ceiling grid', 'wire 30 · main runners 60 · cross tees 90 · tile 100'),
                            ('Flooring', 'prep 30 · installed 90 · base 100'), ('Paint', 'prime 40 · first coat 70 · final 100')], 5):
    put(ws2, i, 1, t, BOLD); put(ws2, i, 2, s, BLACK)
legend(ws, 88, 'Same route, same room labels every week. Copy this week’s Room avg into Last week avg before the next walk.')
save(wb, 'walk-6signal.xlsx')

# ---------- TICKET ----------
wb = Workbook(); ws = wb.active; ws.title = 'Delivery Ledger'
sheet_head(ws, 'Delivery Ticket → Ledger Line', 'One row per ticket line. Accounting approves lines, not piles.')
cols = ['Date', 'Vendor', 'Ticket no.', 'PO no.', 'Item', 'Qty', 'Unit', 'Unit price', 'Extended', 'Cost code', 'Status', 'Reviewed by', 'Status note']
headers(ws, 4, cols, [12, 20, 12, 12, 26, 9, 8, 12, 13, 12, 14, 14, 34])
for i in range(5, 205):
    if i == 5:
        for j, v in enumerate(['2026-11-12', 'Texas Ready Mix', '448812', 'PO-2231', '4000 PSI concrete', 9.5, 'CY', 142], 1):
            put(ws, 5, j, v, BLUE, '$#,##0.00' if j == 8 else ('0.0' if j == 6 else None), EXFILL)
        put(ws, 5, 10, '03-300', BLUE, fill=EXFILL); put(ws, 5, 11, 'Matched', BLUE, fill=EXFILL); put(ws, 5, 12, None, BLUE, fill=EXFILL)
        put(ws, 5, 13, 'Qty within PO balance; signature present', BLUE, fill=EXFILL)
    else:
        for j in (1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13): put(ws, i, j, None, BLUE, '$#,##0.00' if j == 8 else ('0.0' if j == 6 else None))
    put(ws, i, 9, f'=IF(OR(F{i}="",H{i}=""),"",F{i}*H{i})', BLACK, '$#,##0.00')
dv_list(ws, 'K5:K204', ['Matched', 'Over PO', 'No PO', 'Needs review'])
ws['H206'] = 'Total'; ws['H206'].font = BOLD; ws['I206'] = '=SUM(I5:I204)'; ws['I206'].font = BOLD; ws['I206'].number_format = '$#,##0.00'
legend(ws, 208, 'Exception rules: quantity over the PO balance → Over PO; vendor or item not on an open PO → No PO; missing signature or any "?" field → Needs review.')
save(wb, 'ticket-6signal.xlsx')
