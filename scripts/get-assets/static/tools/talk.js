/* TALK · Toolbox Talk Generator (mobile first). Calls the get-ai Netlify Function. */
(function () {
  const root = document.getElementById('tool');
  const D = JSON.parse(document.getElementById('tool-data').textContent);
  const S = SixGet.store, C = SixGet.config;
  const TRADES = ['Concrete', 'Steel', 'Framing', 'Drywall', 'Electrical', 'Mechanical', 'Plumbing', 'Roofing', 'Sitework', 'Paving', 'Masonry', 'Glazing', 'Painting', 'Fire protection'];
  let f = S.get('form', { project: '', incidents: '', activities: '', weather: '', trades: [] });
  let hist = S.get('history', []);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  root.innerHTML = `<form class="f" id="tk-form" onsubmit="return false">
    <label class="fl">Project<input class="t" data-k="project" value="${esc(f.project)}" placeholder="Westside Medical Office"></label>
    <label class="fl">Yesterday's incidents and near misses<textarea class="t" data-k="incidents" placeholder="None, or what happened">${esc(f.incidents)}</textarea></label>
    <label class="fl">Today's scheduled activities<textarea class="t" data-k="activities" placeholder="Steel picks grid C–F, deck pour L2 east">${esc(f.activities)}</textarea></label>
    <label class="fl">Weather<input class="t" data-k="weather" value="${esc(f.weather)}" placeholder="98°F, wind 15 mph gusting 25"></label>
    <div class="fl">Trades on site<div class="chips" id="tk-chips">${TRADES.map((t) => `<button type="button" class="chip" aria-pressed="${f.trades.includes(t)}">${t}</button>`).join('')}</div></div>
    <div class="actions" style="margin-top:4px"><button class="btn primary" type="button" id="tk-go">Generate the talk</button><button class="btn" type="button" id="tk-prompt">Copy prompt instead</button></div>
    <p class="ok" id="tk-msg" aria-live="polite"></p></form>
    <div id="tk-out"></div>
    <div id="tk-hist"></div>`;

  const p = document.createElement('div'); p.id = 'talk-print'; document.body.appendChild(p);

  function prompt() {
    const r = (s, a, b) => s.replace(a, () => b);
    let t = r(D.prompt, '{project}', f.project || 'the project');
    t = r(t, '{date}', today); t = r(t, '{paste or "none"}', f.incidents || 'none');
    t = r(t, '{paste}', f.activities || 'not provided'); t = r(t, '{paste}', f.weather || 'not provided');
    return r(t, '{trades}', f.trades.join(', ') || 'not provided');
  }
  function card(t) {
    const rows = Array.from({ length: 10 }, () => '<tr><td></td><td></td><td></td></tr>').join('');
    return `<div class="talkcard"><h3>Toolbox talk · ${esc(t.project || 'Project')} · ${esc(t.date)}</h3>${esc(t.text)}
      <table class="signin"><thead><tr><th>Name</th><th>Company</th><th>Signature</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function show(t) {
    root.querySelector('#tk-out').innerHTML = card(t) + `<div class="tabletools"><button class="btn small" type="button" id="tk-copy">Copy</button><button class="btn small primary" type="button" id="tk-print">Print / save PDF</button></div>`;
    root.querySelector('#tk-copy').onclick = () => SixGet.copyText(t.text);
    root.querySelector('#tk-print').onclick = () => {
      p.innerHTML = card(t); document.body.classList.add('print-talk');
      const off = () => { document.body.classList.remove('print-talk'); window.removeEventListener('afterprint', off); };
      window.addEventListener('afterprint', off); window.print();
    };
  }
  function renderHist() {
    root.querySelector('#tk-hist').innerHTML = hist.length ? `<div class="label" style="margin-top:28px"><span>Last ${hist.length} talks · saved on this device</span></div>
      <div class="histlist">${hist.map((h, i) => `<button type="button" class="chip" data-h="${i}">${esc(h.date)}</button>`).join('')}</div>` : '';
  }
  root.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { f[k] = e.target.value; S.set('form', f); } });
  root.querySelector('#tk-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const t = b.textContent; f.trades = f.trades.includes(t) ? f.trades.filter((x) => x !== t) : [...f.trades, t];
    b.setAttribute('aria-pressed', String(f.trades.includes(t))); S.set('form', f);
  });
  root.querySelector('#tk-hist').addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (b) show(hist[b.dataset.h]); });
  root.querySelector('#tk-prompt').addEventListener('click', () => SixGet.copyText(prompt()));
  root.querySelector('#tk-go').addEventListener('click', async () => {
    const msg = root.querySelector('#tk-msg'), btn = root.querySelector('#tk-go');
    if (!f.activities.trim()) { msg.textContent = 'Add today’s activities first.'; return; }
    btn.disabled = true; msg.textContent = 'Writing the talk…';
    try {
      const r = await fetch(C.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'talk', project: f.project, date: today, incidents: f.incidents, activities: f.activities, weather: f.weather, trades: f.trades }) });
      const j = await r.json();
      if (!r.ok || !j.text) throw new Error(j.error || 'No text');
      const t = { project: f.project, date: today, text: j.text.trim() };
      hist = [t, ...hist].slice(0, 7); S.set('history', hist);
      show(t); renderHist(); msg.textContent = '';
      document.getElementById('result-field').value = 'Generated talk for ' + (f.project || 'project') + ' on ' + today;
    } catch (err) {
      msg.textContent = 'The generator is offline right now. Use "Copy prompt instead" and paste it into Claude or ChatGPT.';
    } finally { btn.disabled = false; }
  });
  renderHist();
})();
