/* BID · Bid / No-Bid Scorecard */
(function () {
  const root = document.getElementById('tool');
  const D = JSON.parse(document.getElementById('tool-data').textContent);
  const S = SixGet.store, C = SixGet.config;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let cur = S.get('current', { project: '', weights: D.criteria.map((c) => Number(c[1])), scores: D.criteria.map(() => null), evidence: D.criteria.map(() => '') });
  let saved = S.get('saved', []);

  root.innerHTML = `<div class="result"><div><div class="big" id="b-total">0</div><div class="muted">out of 100</div></div>
      <div><div class="band" id="b-band"></div><p class="muted" id="b-note" style="margin:6px 0 0"></p></div></div>
    <label class="fl">Project name<input class="t" id="b-name" value="${esc(cur.project)}" placeholder="Westside MOB · RFP due Dec 4"></label>
    <div id="b-rows" style="margin-top:10px"></div>
    <div class="tabletools"><button class="btn small primary" type="button" id="b-save">Save scorecard</button><button class="btn small" type="button" id="b-new">New scorecard</button>
      <button class="btn small" type="button" id="b-csv">Download all (CSV)</button></div>
    <details style="margin-top:24px"><summary class="label" style="cursor:pointer;display:list-item">Pre-score from the RFP text (optional)</summary>
      <textarea class="t" id="b-rfp" placeholder="Paste the RFP text here" style="min-height:160px;margin-top:10px"></textarea>
      <div class="tabletools"><button class="btn small" type="button" id="b-ai">Pre-score</button><span class="muted" id="b-ai-msg" style="font-size:12px"></span></div></details>
    <div id="b-saved"></div>`;

  function total() {
    const wsum = cur.weights.reduce((a, b) => a + b, 0) || 1;
    const raw = cur.weights.reduce((a, w, i) => a + w * ((cur.scores[i] || 0) / 5), 0);
    return Math.round(raw / wsum * 100);
  }
  const band = (t) => t >= 70 ? 'Pursue' : t >= 50 ? 'Discuss' : 'Decline';
  function rows() {
    root.querySelector('#b-rows').innerHTML = D.criteria.map((c, i) => `<div class="bidrow"><span>${esc(c[0])}</span>
      <input class="t w" type="number" min="0" max="50" value="${cur.weights[i]}" data-w="${i}" aria-label="Weight">
      <div class="seg" data-i="${i}">${[0, 1, 2, 3, 4, 5].map((n) => `<button type="button" data-v="${n}" aria-pressed="${cur.scores[i] === n}">${n}</button>`).join('')}</div>
      ${cur.evidence[i] ? `<div class="ev">${esc(cur.evidence[i])}</div>` : ''}</div>`).join('');
  }
  function render() {
    const t = total(), wsum = cur.weights.reduce((a, b) => a + b, 0);
    root.querySelector('#b-total').textContent = t;
    root.querySelector('#b-band').textContent = cur.scores.every((s) => s === null) ? 'Not scored yet' : band(t);
    const unscored = cur.scores.filter((s) => s === null).length;
    root.querySelector('#b-note').textContent = `Pursue 70+ · Discuss 50–69 · Decline under 50.` + (unscored ? ` ${unscored} unscored count as 0.` : '') + (wsum !== 100 ? ` Weights total ${wsum}; score is normalized to 100.` : '');
    document.getElementById('result-field').value = `${cur.project || 'RFP'}: ${t}/100 (${band(t)}). ` + D.criteria.map((c, i) => `${c[0].split(' ')[0]} w${cur.weights[i]} s${cur.scores[i] ?? '-'}`).join('; ') +
      (saved.length ? ' | Saved: ' + saved.map((s) => `${s.project} ${s.total}`).join(', ') : '');
    S.set('current', cur);
  }
  function list() {
    if (!saved.length) { root.querySelector('#b-saved').innerHTML = ''; return; }
    const sorted = [...saved].sort((a, b) => b.total - a.total);
    root.querySelector('#b-saved').innerHTML = `<div class="label" style="margin-top:28px"><span>Scored RFPs · top three highlighted</span></div>
      <div class="tablewrap"><table class="saved"><thead><tr><th>Project</th><th>Score</th><th>Call</th><th></th></tr></thead><tbody>${sorted.map((s, i) =>
        `<tr class="${i < 3 && s.total >= 50 ? 'top3' : ''}"><td>${esc(s.project)}</td><td>${s.total}</td><td>${band(s.total)}</td><td><button class="btn small" type="button" data-open="${esc(s.project)}">Open</button> <button class="btn small" type="button" data-del="${esc(s.project)}">×</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button');
    if (b) { const i = b.parentElement.dataset.i; cur.scores[i] = Number(b.dataset.v); b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render(); }
    const o = e.target.closest('[data-open]');
    if (o) { cur = JSON.parse(JSON.stringify(saved.find((s) => s.project === o.dataset.open))); root.querySelector('#b-name').value = cur.project; rows(); render(); }
    const d = e.target.closest('[data-del]');
    if (d && confirm('Delete this scorecard?')) { saved = saved.filter((s) => s.project !== d.dataset.del); S.set('saved', saved); list(); render(); }
  });
  root.addEventListener('input', (e) => {
    if (e.target.dataset.w !== undefined) { cur.weights[e.target.dataset.w] = Math.max(0, Number(e.target.value) || 0); render(); }
    if (e.target.id === 'b-name') { cur.project = e.target.value; render(); }
  });
  root.querySelector('#b-save').addEventListener('click', () => {
    if (!cur.project.trim()) { SixGet.say('Name the project first'); return; }
    saved = saved.filter((s) => s.project !== cur.project); saved.push({ ...JSON.parse(JSON.stringify(cur)), total: total() });
    S.set('saved', saved); list(); render(); SixGet.say('Saved');
  });
  root.querySelector('#b-new').addEventListener('click', () => {
    cur = { project: '', weights: D.criteria.map((c) => Number(c[1])), scores: D.criteria.map(() => null), evidence: D.criteria.map(() => '') };
    root.querySelector('#b-name').value = ''; rows(); render();
  });
  root.querySelector('#b-csv').addEventListener('click', () => {
    const head = ['Project', 'Total', 'Call', ...D.criteria.map((c) => c[0])];
    const lines = [head, ...[...saved].sort((a, b) => b.total - a.total).map((s) => [s.project, s.total, band(s.total), ...s.scores.map((x) => x ?? '')])];
    SixGet.download(lines.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n'), 'bid-no-bid-scorecards.csv', 'text/csv');
  });
  root.querySelector('#b-ai').addEventListener('click', async () => {
    const msg = root.querySelector('#b-ai-msg'), txt = root.querySelector('#b-rfp').value.trim();
    if (txt.length < 200) { msg.textContent = 'Paste more of the RFP first.'; return; }
    msg.textContent = 'Reading the RFP…';
    try {
      const r = await fetch(C.aiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bid', rfp: txt, criteria: D.criteria.map((c, i) => [c[0], cur.weights[i]]) }) });
      const j = await r.json();
      if (!r.ok || !Array.isArray(j.scores)) throw new Error(j.error || 'bad response');
      j.scores.forEach((s, i) => { if (i < D.criteria.length) { cur.scores[i] = s.score === null || s.score === undefined ? null : Math.max(0, Math.min(5, Math.round(s.score))); cur.evidence[i] = s.evidence || ''; } });
      rows(); render(); msg.textContent = 'Pre-scored. Check every number against the evidence before you trust it.';
    } catch (err) { msg.textContent = 'Pre-score is offline right now. Score it by hand above.'; }
  });
  rows(); render(); list();
})();
