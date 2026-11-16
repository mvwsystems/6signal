/* Shared behavior for /get/ asset pages. No dependencies. */
(function () {
  const C = window.SIXGET || {};
  const page = document.body.dataset.kw || 'hub';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('6s:' + page + ':' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('6s:' + page + ':' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // toast
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 1600); }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    say('Copied');
  }

  // copy buttons: data-copy="#id" copies that element's text
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const el = document.querySelector(b.dataset.copy);
    if (el) copyText(el.innerText.trim());
  });

  // book links
  document.querySelectorAll('[data-book]').forEach((a) => { if (C.bookUrl) a.href = C.bookUrl; });

  // print
  document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  // checklists: persist + count
  document.querySelectorAll('.check[data-id]').forEach((ul) => {
    const id = ul.dataset.id;
    const boxes = [...ul.querySelectorAll('input[type=checkbox]')];
    const saved = store.get('chk-' + id, []);
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    const counter = document.querySelector('[data-count="' + id + '"]');
    const update = () => {
      store.set('chk-' + id, boxes.map((b) => b.checked));
      const n = boxes.filter((b) => b.checked).length;
      if (counter) counter.textContent = n + ' / ' + boxes.length + ' ticked';
      ul.dispatchEvent(new CustomEvent('checkchange', { bubbles: true, detail: { n, total: boxes.length, boxes } }));
    };
    boxes.forEach((b) => b.addEventListener('change', update));
    update();
  });

  // footings: status per footing from its four checks
  document.querySelectorAll('.footing').forEach((f) => {
    const st = f.querySelector('.status');
    const run = () => {
      const n = f.querySelectorAll('input:checked').length;
      const s = n === 4 ? 'Poured' : n >= 2 ? 'Forming' : 'Not started';
      st.textContent = s; st.classList.toggle('poured', n === 4);
    };
    f.addEventListener('change', run); run();
  });

  // editable tables: persist + CSV
  document.querySelectorAll('table[data-id]').forEach((t) => {
    const id = t.dataset.id;
    const cells = [...t.querySelectorAll('td[contenteditable]')];
    const saved = store.get('tbl-' + id, null);
    if (saved && saved.length === cells.length) cells.forEach((c, i) => { if (saved[i] != null) c.textContent = saved[i]; });
    t.addEventListener('input', () => store.set('tbl-' + id, cells.map((c) => c.textContent)));
  });
  document.querySelectorAll('[data-csv]').forEach((b) => b.addEventListener('click', () => {
    const t = document.querySelector(b.dataset.csv);
    const rows = [...t.rows].map((r) => [...r.cells].map((c) => '"' + c.innerText.replace(/"/g, '""').trim() + '"').join(','));
    download(rows.join('\n'), b.dataset.name || 'template.csv', 'text/csv');
  }));
  document.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => {
    if (!confirm('Clear what you typed in this table?')) return;
    store.set('tbl-' + b.dataset.reset, null); location.reload();
  }));

  function download(text, name, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  // Lead forms → /api/get-lead (records a lead, emails the owner, emails the visitor their result)
  function attribution() { try { return JSON.parse(localStorage.getItem('6sig_attrib') || 'null'); } catch (e) { return null; } }
  async function submitLead(kind, data) {
    const r = await fetch(C.leadEndpoint || '/api/get-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, ...data, page: location.pathname, attribution: attribution() }) });
    if (!r.ok) throw new Error('Lead post failed: ' + r.status);
  }
  document.querySelectorAll('form[data-lead]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries());
    const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
    const out = f.querySelector('.ok');
    try {
      await submitLead(f.dataset.lead, fd);
      if (out) out.textContent = f.dataset.done || 'Got it.';
      f.dispatchEvent(new CustomEvent('sent'));
    } catch (err) {
      if (out) out.textContent = 'That did not go through. Email ' + (C.contactEmail || 'hello@6signal.co') + ' instead.';
      if (btn) btn.disabled = false;
    }
  }));

  function printTool() {
    document.body.classList.add('print-tool');
    const off = () => { document.body.classList.remove('print-tool'); window.removeEventListener('afterprint', off); };
    window.addEventListener('afterprint', off);
    window.print();
  }

  window.SixGet = { store, say, copyText, download, submitLead, printTool, config: C };
})();
