/* AUDIT · DIY AI Visibility Audit */
(function () {
  const root = document.getElementById('tool');
  const D = JSON.parse(document.getElementById('tool-data').textContent);
  const S = SixGet.store;
  const ENG = ['ChatGPT', 'Claude', 'Perplexity', 'Google'];
  const STATE = ['Absent', 'Named', 'Cited'];
  const FIELDS = [['your firm', 'Your firm'], ['city', 'City'], ['trade', 'Trade'], ['project type', 'Project type'],
    ['competitor', 'Competitor'], ['building type', 'Building type (e.g. medical office)'], ['service', 'Service (e.g. design-build warehouse)'],
    ['AGC chapter or association', 'Association (e.g. AGC Texas Building Branch)']];
  let inp = S.get('inputs', {}); let marks = S.get('marks', D.prompts.map(() => [0, 0, 0, 0]));

  root.innerHTML = `<div class="label"><span>Step 1 · your details</span></div>
    <div class="row2">${FIELDS.map(([k, l]) => `<label class="fl">${l}<input class="t" data-k="${k}" value="${(inp[k] || '').replace(/"/g, '&quot;')}"></label>`).join('')}</div>
    <div class="label" style="margin-top:28px"><span>Step 2 · run each prompt in all four engines</span><span class="count">Click to cycle: absent → named → cited</span></div>
    <div id="a-list"></div>
    <div class="label" style="margin-top:28px"><span>Step 3 · your score</span></div>
    <div class="result" style="border:0;margin:0;padding:0"><svg viewBox="0 0 160 160" width="160" height="160" id="a-ring"></svg>
    <div><div class="band" id="a-band"></div><p class="muted" id="a-detail" style="margin:6px 0 12px"></p><button class="btn small" type="button" data-print>Save scored sheet as PDF</button></div></div>`;

  function fill(p) {
    return p.replace(/\{([^}]+)\}/g, (m, inner) => {
      const key = inner.split(',')[0].trim();
      const v = inp[key]; return v ? v : m;
    });
  }
  function list() {
    root.querySelector('#a-list').innerHTML = D.prompts.map((p, i) => `<div class="prow"><div class="ptext" id="ap${i}">${i + 1}. ${fill(p)}</div>
      <div class="engines">${ENG.map((e, j) => `<button type="button" class="eng" data-i="${i}" data-j="${j}" data-s="${marks[i][j]}">${e}: ${STATE[marks[i][j]]}</button>`).join('')}
      <button class="btn small" type="button" data-cp="${i}">Copy prompt</button></div></div>`).join('');
  }
  function score() {
    const pts = marks.flat().reduce((a, b) => a + b, 0);
    const band = pts < 20 ? 'Invisible' : pts <= 45 ? 'Emerging' : 'Visible';
    const frac = pts / 80, r = 66, c = 2 * Math.PI * r;
    root.querySelector('#a-ring').innerHTML = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="#1b1b1b" stroke-width="14"/>
      <circle cx="80" cy="80" r="${r}" fill="none" stroke="#E6FF00" stroke-width="14" stroke-dasharray="${(c * frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 80 80)"/>
      <text x="80" y="88" text-anchor="middle" fill="#E6FF00" font-family="JetBrains Mono" font-weight="600" font-size="34">${pts}</text>
      <text x="80" y="108" text-anchor="middle" fill="#9A9A9A" font-family="JetBrains Mono" font-size="11">/ 80</text>`;
    root.querySelector('#a-band').textContent = band;
    const named = marks.flat().filter((x) => x === 1).length, cited = marks.flat().filter((x) => x === 2).length;
    root.querySelector('#a-detail').textContent = `${cited} cited · ${named} named · ${40 - cited - named} absent. Under 20 invisible, 20–45 emerging, over 45 visible.`;
    document.getElementById('result-field').value = `Score ${pts}/80 (${band}). Firm: ${inp['your firm'] || '-'}, ${inp.city || '-'}, ${inp.trade || '-'}. ` +
      marks.map((m, i) => `P${i + 1}:${m.join('')}`).join(' ');
    S.set('marks', marks);
  }
  root.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { inp[k] = e.target.value.trim(); S.set('inputs', inp); list(); score(); } });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.eng');
    if (b) { const i = b.dataset.i, j = b.dataset.j; marks[i][j] = (marks[i][j] + 1) % 3; b.dataset.s = marks[i][j]; b.textContent = `${ENG[j]}: ${STATE[marks[i][j]]}`; score(); }
    const c = e.target.closest('[data-cp]');
    if (c) SixGet.copyText(fill(D.prompts[c.dataset.cp]));
  });
  root.querySelector('[data-print]').addEventListener('click', () => SixGet.printTool());
  list(); score();
})();
