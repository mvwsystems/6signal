/* LATER · Cost of Later Calculator */
(function () {
  const root = document.getElementById('tool');
  const S = SixGet.store;
  const F = [['people', 'PMs and supers', 12, 1], ['hours', 'Admin hours / person / week', 11, 0.5], ['share', 'Recoverable share %', 35, 1],
    ['rate', 'Loaded hourly rate $', 85, 1], ['months', 'Months of delay', 6, 1]];
  let v = S.get('inputs', Object.fromEntries(F.map((f) => [f[0], f[2]])));
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  root.innerHTML = `<div class="row2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${F.map(([k, l, d, st]) =>
      `<label class="fl">${l}<input class="t" type="number" min="0" step="${st}" data-k="${k}" value="${v[k]}" inputmode="decimal"></label>`).join('')}</div>
    <div style="margin-top:28px"><div class="muted" style="font-size:12px;letter-spacing:.14em;text-transform:uppercase">The cost of later</div>
    <div class="big" id="l-dollars">$0</div><div class="band" id="l-hours" style="margin-top:6px"></div></div>
    <svg class="beam" id="l-beam" viewBox="0 0 600 120" role="img" aria-label="Load-bearing meter"></svg>
    <div class="formula" id="l-formula"></div>
    <div style="margin-top:14px"><button class="btn small" type="button" data-print>Save one-page PDF</button></div>`;

  function render() {
    const hours = v.people * v.hours * (v.share / 100) * 4.33 * v.months;
    const dollars = hours * v.rate;
    root.querySelector('#l-dollars').textContent = money(dollars);
    root.querySelector('#l-hours').textContent = Math.round(hours).toLocaleString('en-US') + ' hours · ' + v.months + ' month' + (v.months == 1 ? '' : 's');
    root.querySelector('#l-formula').textContent =
      `Cost of later = people × hours/week × recoverable share × rate × 4.33 × months = ${v.people} × ${v.hours} × ${v.share}% × $${v.rate} × 4.33 × ${v.months} = ${money(dollars)}`;
    const load = Math.min(dollars / 250000, 1), snapped = dollars > 250000, sag = (load * 34).toFixed(1);
    const beam = snapped
      ? `<path d="M40 50 L292 50 L300 92 L292 66 L40 66 Z" fill="#EAEAEA"/><path d="M560 50 L308 50 L300 92 L308 66 L560 66 Z" fill="#EAEAEA"/>
         <text x="300" y="114" fill="#E6FF00" text-anchor="middle" font-family="JetBrains Mono" font-size="12">PAST $250K · THE BEAM SNAPS</text>`
      : `<path d="M40 50 Q300 ${50 + sag * 2} 560 50 L560 66 Q300 ${66 + sag * 2} 40 66 Z" fill="#EAEAEA"/>
         <text x="300" y="114" fill="#9A9A9A" text-anchor="middle" font-family="JetBrains Mono" font-size="11">LOAD ${Math.round(load * 100)}% OF $250K</text>`;
    root.querySelector('#l-beam').innerHTML = `<rect x="20" y="40" width="20" height="60" fill="#333"/><rect x="560" y="40" width="20" height="60" fill="#333"/>${beam}`;
    document.getElementById('result-field').value = `Cost of later ${money(dollars)} (${Math.round(hours)} h). Inputs: ${F.map((f) => f[0] + '=' + v[f[0]]).join(', ')}`;
    S.set('inputs', v);
  }
  root.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { v[k] = Math.max(0, Number(e.target.value) || 0); render(); } });
  root.querySelector('[data-print]').addEventListener('click', () => SixGet.printTool());
  render();
})();
