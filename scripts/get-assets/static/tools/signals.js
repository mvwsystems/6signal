/* SIGNALS · Six Signals Self-Rating */
(function () {
  const root = document.getElementById('tool');
  const D = JSON.parse(document.getElementById('tool-data').textContent);
  const S = SixGet.store;
  let v = S.get('ratings', D.rows.map(() => 0));
  const bands = [[10, 'Invisible'], [20, 'Emerging'], [26, 'Visible'], [30, 'Dominant']];
  const rubric = '0 absent · 1 exists, unmanaged · 3 managed quarterly · 5 owned, measured monthly';

  root.innerHTML = `<div class="result"><div><div class="big" id="s-total">0</div><div class="muted">out of 30</div><div class="band" id="s-band" style="margin-top:8px"></div></div>
    <div class="bars" id="s-bars"></div></div>
    <p class="muted" style="margin:0 0 6px;font-size:12px">${rubric}</p>
    ${D.rows.map((r, i) => `<div class="slider"><div class="top2"><span>${r[0]}</span><span id="s-v${i}">0</span></div>
      <input type="range" min="0" max="5" step="1" value="${v[i]}" data-i="${i}" aria-label="${r[0]} rating"><small>${r[1]}</small></div>`).join('')}
    <div style="margin-top:16px"><button class="btn small" type="button" id="s-png">Download chart (PNG)</button></div>`;

  function render() {
    const total = v.reduce((a, b) => a + b, 0);
    const band = bands.find((b) => total <= b[0])[1];
    root.querySelector('#s-total').textContent = total;
    root.querySelector('#s-band').textContent = band;
    root.querySelector('#s-bars').innerHTML = D.rows.map((r, i) =>
      `<div class="barrow"><span>${r[0]}</span><div class="bartrack"><div class="barfill" style="width:${v[i] * 20}%"></div></div><span>${v[i]}</span></div>`).join('');
    D.rows.forEach((r, i) => { root.querySelector('#s-v' + i).textContent = v[i]; });
    document.getElementById('result-field').value = `Total ${total}/30 (${band}). ` + D.rows.map((r, i) => `${r[0]} ${v[i]}`).join(', ');
    S.set('ratings', v);
  }
  root.addEventListener('input', (e) => { if (e.target.type === 'range') { v[e.target.dataset.i] = Number(e.target.value); render(); } });

  root.querySelector('#s-png').addEventListener('click', () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
    const x = c.getContext('2d');
    x.fillStyle = '#0A0A0A'; x.fillRect(0, 0, 1080, 1080);
    x.fillStyle = '#9A9A9A'; x.font = '500 26px "JetBrains Mono", monospace'; x.fillText('SIX SIGNALS SELF-RATING', 80, 120);
    const total = v.reduce((a, b) => a + b, 0);
    x.fillStyle = '#E6FF00'; x.font = '600 120px "JetBrains Mono", monospace'; x.fillText(String(total), 80, 260);
    x.fillStyle = '#EAEAEA'; x.font = '500 30px "JetBrains Mono", monospace'; x.fillText('/ 30 · ' + bands.find((b) => total <= b[0])[1].toUpperCase(), 80 + x.measureText(String(total)).width * 0 + 220, 255);
    D.rows.forEach((r, i) => {
      const y = 360 + i * 105;
      x.fillStyle = '#EAEAEA'; x.font = '600 30px "JetBrains Mono", monospace'; x.fillText(r[0], 80, y + 34);
      x.fillStyle = '#1B1B1B'; x.fillRect(200, y + 8, 720, 34);
      x.fillStyle = '#E6FF00'; x.fillRect(200, y + 8, 720 * v[i] / 5, 34);
      x.fillStyle = '#EAEAEA'; x.fillText(String(v[i]), 950, y + 34);
    });
    x.fillStyle = '#6B6B6B'; x.font = '400 22px "JetBrains Mono", monospace'; x.fillText('6signal.co/get/signals', 80, 1020);
    c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'six-signals.png'; a.click(); });
  });
  render();
})();
