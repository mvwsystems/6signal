/* CURVE · Adoption Curve Self-Score */
(function () {
  const root = document.getElementById('tool');
  const D = JSON.parse(document.getElementById('tool-data').textContent);
  const S = SixGet.store;
  let ans = S.get('answers', D.items.map(() => null));

  const qs = D.items.map((q, i) => `<div class="qrow"><span>${i + 1}. ${q}</span>
    <div class="seg" data-i="${i}"><button type="button" data-v="1">Yes</button><button type="button" data-v="0">No</button></div></div>`).join('');
  root.innerHTML = `<div class="result"><div><div class="big" id="c-score">0</div><div class="muted">out of 12</div></div>
    <div><div class="band" id="c-band"></div><div class="muted" id="c-gap"></div><svg id="c-chart" viewBox="0 0 400 165" role="img" aria-label="Two adoption curves with your position"></svg></div></div>
    <div id="c-move" class="callout" style="margin-bottom:20px"></div>${qs}`;

  const curve = (mid, k) => { let d = ''; for (let x = 0; x <= 360; x += 6) { const t = x / 360 * 24; const y = 1 / (1 + Math.exp(-(t - mid) / k)); d += (x ? 'L' : 'M') + (30 + x) + ' ' + (150 - y * 130).toFixed(1); } return d; };

  function render() {
    root.querySelectorAll('.seg').forEach((s) => {
      const v = ans[s.dataset.i];
      s.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(v !== null && String(v) === b.dataset.v)));
    });
    const score = ans.filter((v) => v === 1).length;
    const answered = ans.filter((v) => v !== null).length;
    const band = score <= 4 ? D.bands[0] : score <= 8 ? D.bands[1] : D.bands[2];
    root.querySelector('#c-score').textContent = score;
    root.querySelector('#c-band').textContent = band.band + ' · ' + band.range;
    root.querySelector('#c-gap').textContent = band.gap + (answered < 12 ? ` · ${12 - answered} unanswered` : '');
    root.querySelector('#c-move').innerHTML = `<b>On site</b>${band.site}<br><br><b>Your first move</b>${band.move}`;
    const yx = 30 + 180, yy = 150 - (score / 12) * 130;
    root.querySelector('#c-chart').innerHTML = `
      <line x1="30" y1="150" x2="390" y2="150" stroke="#333"/><line x1="210" y1="14" x2="210" y2="150" stroke="#333" stroke-dasharray="3 4"/>
      <text x="214" y="12" fill="#6B6B6B" font-size="9" font-family="JetBrains Mono">TODAY</text>
      <path d="${curve(9, 2.4)}" fill="none" stroke="#EAEAEA" stroke-width="2"/>
      <path d="${curve(19, 2.8)}" fill="none" stroke="#6B6B6B" stroke-width="2"/>
      <line x1="30" y1="10" x2="46" y2="10" stroke="#EAEAEA" stroke-width="2"/><text x="52" y="13" fill="#EAEAEA" font-size="9" font-family="JetBrains Mono">LEADERS</text>
      <line x1="110" y1="10" x2="126" y2="10" stroke="#6B6B6B" stroke-width="2"/><text x="132" y="13" fill="#9A9A9A" font-size="9" font-family="JetBrains Mono">LAGGARDS</text>
      <rect x="${yx - 6}" y="${yy - 6}" width="12" height="12" fill="#E6FF00"/>
      <text x="${yx + 10}" y="${yy + 4}" fill="#E6FF00" font-size="10" font-family="JetBrains Mono">YOU</text>`;
    document.getElementById('result-field').value =
      `Score ${score}/12 (${band.band}). ` + D.items.map((q, i) => `${i + 1}:${ans[i] === 1 ? 'Y' : ans[i] === 0 ? 'N' : '-'}`).join(' ');
    S.set('answers', ans);
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button'); if (!b) return;
    ans[b.parentElement.dataset.i] = Number(b.dataset.v); render();
  });
  render();
})();
