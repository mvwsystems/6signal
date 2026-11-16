/* SCHEMA · Contractor Schema Generator */
(function () {
  const root = document.getElementById('tool');
  const S = SixGet.store;
  const F = [
    ['name', 'Firm legal name'], ['url', 'Website URL', 'https://'], ['logo', 'Logo URL', 'https://…/logo.png'], ['image', 'Office or crew photo URL', 'https://…/hq.jpg'],
    ['telephone', 'Phone', '+1-817-555-0100'], ['email', 'Email'], ['street', 'Street address'], ['city', 'City'], ['state', 'State', 'TX'], ['zip', 'ZIP'],
    ['lat', 'Latitude'], ['lng', 'Longitude'], ['areaServed', 'Cities served (comma separated)', 'Fort Worth, Arlington, Weatherford'],
    ['foundingDate', 'Year founded', '1998'], ['employees', 'Employee count', '45'],
    ['knowsAbout', 'Specialties, up to six (comma separated)', 'design-build, tenant improvement, tilt-up'],
    ['services', 'Services, up to six (comma separated)', 'General contracting, Preconstruction'],
    ['gbp', 'Google Business Profile URL'], ['linkedin', 'LinkedIn URL'], ['assoc', 'AGC/ABC member page URL'], ['youtube', 'YouTube channel URL'],
    ['rating', 'Average rating', '4.8'], ['reviews', 'Review count', '37']];
  let v = S.get('fields', {});

  root.innerHTML = `<div class="grid2"><div><div class="row2">${F.map(([k, l, ph]) =>
      `<label class="fl">${l}<input class="t" data-k="${k}" placeholder="${ph || ''}" value="${(v[k] || '').replace(/"/g, '&quot;')}"></label>`).join('')}</div>
      <div style="margin-top:12px"><button class="btn small" type="button" id="sc-geo">Find lat/lng from address</button> <span class="muted" id="sc-geo-msg" style="font-size:12px"></span></div></div>
    <div><div class="label" style="margin-bottom:10px"><span>Your JSON-LD</span></div><pre class="codeout" id="sc-out"></pre>
      <div class="tabletools"><button class="btn small primary" type="button" id="sc-copy">Copy</button><button class="btn small" type="button" id="sc-dl">Download</button>
      <a class="btn small" href="https://validator.schema.org/" target="_blank" rel="noopener">Validate</a></div>
      <p class="note" id="sc-warn"></p></div></div>`;

  const list = (s, n) => (s || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, n);
  function build() {
    const o = { '@context': 'https://schema.org', '@type': 'GeneralContractor' };
    const set = (k, val) => { if (val !== undefined && val !== '' && !(Array.isArray(val) && !val.length)) o[k] = val; };
    set('name', v.name); set('url', v.url); set('logo', v.logo); set('image', v.image); set('telephone', v.telephone); set('email', v.email);
    if (v.street || v.city) o.address = { '@type': 'PostalAddress', streetAddress: v.street || '', addressLocality: v.city || '', addressRegion: v.state || '', postalCode: v.zip || '', addressCountry: 'US' };
    if (v.lat && v.lng && !isNaN(v.lat) && !isNaN(v.lng)) o.geo = { '@type': 'GeoCoordinates', latitude: Number(v.lat), longitude: Number(v.lng) };
    set('areaServed', list(v.areaServed, 20).map((c) => ({ '@type': 'City', name: c })));
    set('foundingDate', v.foundingDate);
    if (v.employees && !isNaN(v.employees)) o.numberOfEmployees = { '@type': 'QuantitativeValue', value: Number(v.employees) };
    set('knowsAbout', list(v.knowsAbout, 6));
    const sv = list(v.services, 6);
    if (sv.length) o.hasOfferCatalog = { '@type': 'OfferCatalog', name: 'Services', itemListElement: sv.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })) };
    set('sameAs', [v.gbp, v.linkedin, v.assoc, v.youtube].filter(Boolean));
    const warn = [];
    if (v.rating && v.reviews) {
      if (Number(v.reviews) >= 5) o.aggregateRating = { '@type': 'AggregateRating', ratingValue: String(v.rating), reviewCount: String(v.reviews) };
      else warn.push('aggregateRating left out: fewer than five public reviews.');
    }
    if (!v.name) warn.push('Firm name is required.');
    if (!o.address) warn.push('Add the address exactly as it appears on your GBP.');
    return { text: '<script type="application/ld+json">\n' + JSON.stringify(o, null, 2) + '\n</' + 'script>', warn };
  }
  function render() {
    const b = build();
    root.querySelector('#sc-out').textContent = b.text;
    root.querySelector('#sc-warn').textContent = b.warn.join(' ');
    document.getElementById('result-field').value = b.text.slice(0, 3500);
    S.set('fields', v);
  }
  root.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { v[k] = e.target.value.trim(); render(); } });
  root.querySelector('#sc-copy').addEventListener('click', () => SixGet.copyText(build().text));
  root.querySelector('#sc-dl').addEventListener('click', () => SixGet.download(build().text, 'contractor-schema.html', 'text/html'));
  root.querySelector('#sc-geo').addEventListener('click', async () => {
    const msg = root.querySelector('#sc-geo-msg');
    const q = [v.street, v.city, v.state, v.zip].filter(Boolean).join(', ');
    if (!q) { msg.textContent = 'Enter the address first.'; return; }
    msg.textContent = 'Looking up…';
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(q), { headers: { 'Accept': 'application/json' } });
      const j = await r.json();
      if (!j.length) { msg.textContent = 'Not found. Enter it by hand (right-click your office in Google Maps).'; return; }
      v.lat = Number(j[0].lat).toFixed(6); v.lng = Number(j[0].lon).toFixed(6);
      root.querySelector('[data-k=lat]').value = v.lat; root.querySelector('[data-k=lng]').value = v.lng;
      msg.textContent = 'Found. Check the pin matches your office.'; render();
    } catch (err) { msg.textContent = 'Lookup failed. Enter it by hand.'; }
  });
  render();
})();
