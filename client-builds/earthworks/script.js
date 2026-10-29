/* Earth Works · site script
   Contour canvas, nav state, scroll reveals, counters, grade-profile draw,
   magnetic buttons, card spotlight, FAQ, form. No dependencies. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var isPreview = root.dataset.preview === "1";

  var burgerEl = doc.getElementById("burger");

  /* ---------- hero intro ---------- */
  var lines = doc.querySelectorAll(".hero__title .line > span");
  if (!reduce && lines.length) {
    lines.forEach(function (el, i) {
      el.style.transform = "translateY(110%)";
      el.style.transition = "transform 1.1s cubic-bezier(.16,1,.3,1) " + (120 + i * 110) + "ms";
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      lines.forEach(function (el) { el.style.transform = "translateY(0)"; });
    }); });
  }

  /* ---------- contour canvas (hero) ---------- */
  var canvas = doc.getElementById("contours");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    // 2D value noise with smooth interpolation, seeded permutation.
    var perm = new Uint8Array(512), p = [];
    for (var i = 0; i < 256; i++) p[i] = i;
    var seed = 20010806;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    for (var j = 255; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var t = p[j]; p[j] = p[k]; p[k] = t; }
    for (var m = 0; m < 512; m++) perm[m] = p[m & 255];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function grad(h, x, y) { switch (h & 3) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } }
    function noise(x, y) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      var u = fade(x), v = fade(y);
      var A = perm[X] + Y, B = perm[X + 1] + Y;
      return lerp(
        lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u),
        lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u), v);
    }
    var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cell = 14, field = null;
    var mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, z = 0, raf = 0, visible = true;
    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = W > 900 ? 14 : 12;
      cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
      field = new Float32Array(cols * rows);
    }
    function sample(x, y, zz) {
      var ox = (mx - 0.5) * 0.6, oy = (my - 0.5) * 0.6;
      var n = noise(x * 0.9 + ox + zz, y * 0.9 + oy) * 0.62
            + noise(x * 2.1 - zz * 0.7, y * 2.1 + 7.3) * 0.26
            + noise(x * 4.7 + 3.1, y * 4.7 - zz * 0.4) * 0.12;
      return n;
    }
    function draw() {
      if (!field) return;
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      var sx = 1 / (cols - 1) * 2.2, sy = 1 / (rows - 1) * 2.2 * (H / W);
      for (var yy = 0; yy < rows; yy++) for (var xx = 0; xx < cols; xx++) field[yy * cols + xx] = sample(xx * sx, yy * sy, z);
      ctx.clearRect(0, 0, W, H);
      var levels = 9, lo = -0.55, hi = 0.55;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (var L = 0; L < levels; L++) {
        var iso = lo + (hi - lo) * (L / (levels - 1));
        var index = (L % 3 === 1);
        ctx.strokeStyle = index ? "rgba(27,25,22,0.42)" : "rgba(27,25,22,0.18)";
        ctx.lineWidth = index ? 1.3 : 0.8;
        ctx.beginPath();
        for (var y = 0; y < rows - 1; y++) {
          for (var x = 0; x < cols - 1; x++) {
            var a = field[y * cols + x], b = field[y * cols + x + 1], c = field[(y + 1) * cols + x + 1], d = field[(y + 1) * cols + x];
            var code = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
            if (code === 0 || code === 15) continue;
            var x0 = x * cell, y0 = y * cell;
            var top = [x0 + cell * ((iso - a) / (b - a)), y0];
            var right = [x0 + cell, y0 + cell * ((iso - b) / (c - b))];
            var bottom = [x0 + cell * ((iso - d) / (c - d)), y0 + cell];
            var left = [x0, y0 + cell * ((iso - a) / (d - a))];
            function seg(p1, p2) { ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); }
            switch (code) {
              case 1: case 14: seg(left, bottom); break;
              case 2: case 13: seg(bottom, right); break;
              case 3: case 12: seg(left, right); break;
              case 4: case 11: seg(top, right); break;
              case 5: seg(top, left); seg(bottom, right); break;
              case 6: case 9: seg(top, bottom); break;
              case 7: case 8: seg(top, left); break;
              case 10: seg(top, right); seg(left, bottom); break;
            }
          }
        }
        ctx.stroke();
      }
      // design-grade highlight: one contour in flagging orange
      var isoF = 0.08;
      ctx.strokeStyle = "rgba(196,9,15,0.7)"; ctx.lineWidth = 1.6; ctx.beginPath();
      for (var y2 = 0; y2 < rows - 1; y2++) for (var x2 = 0; x2 < cols - 1; x2++) {
        var a2 = field[y2 * cols + x2], b2 = field[y2 * cols + x2 + 1], c2 = field[(y2 + 1) * cols + x2 + 1], d2 = field[(y2 + 1) * cols + x2];
        var cd = (a2 > isoF ? 8 : 0) | (b2 > isoF ? 4 : 0) | (c2 > isoF ? 2 : 0) | (d2 > isoF ? 1 : 0);
        if (cd === 0 || cd === 15) continue;
        var X0 = x2 * cell, Y0 = y2 * cell;
        var T = [X0 + cell * ((isoF - a2) / (b2 - a2)), Y0], R = [X0 + cell, Y0 + cell * ((isoF - b2) / (c2 - b2))];
        var Bt = [X0 + cell * ((isoF - d2) / (c2 - d2)), Y0 + cell], Lf = [X0, Y0 + cell * ((isoF - a2) / (d2 - a2))];
        var pairs;
        switch (cd) {
          case 1: case 14: pairs = [Lf, Bt]; break; case 2: case 13: pairs = [Bt, R]; break; case 3: case 12: pairs = [Lf, R]; break;
          case 4: case 11: pairs = [T, R]; break; case 6: case 9: pairs = [T, Bt]; break; case 7: case 8: pairs = [T, Lf]; break;
          case 5: pairs = [T, Lf, Bt, R]; break; default: pairs = [T, R, Lf, Bt];
        }
        for (var q = 0; q < pairs.length; q += 2) { ctx.moveTo(pairs[q][0], pairs[q][1]); ctx.lineTo(pairs[q + 1][0], pairs[q + 1][1]); }
      }
      ctx.stroke();
    }
    function loop() {
      if (!reduce) z += 0.0016;
      draw();
      if (!reduce && visible) raf = requestAnimationFrame(loop);
    }
    resize(); loop();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduce) draw(); }, 120); });
    if (finePointer) canvas.parentElement.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width; tmy = (e.clientY - r.top) / r.height;
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop); else if (!visible) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(canvas);
  }

  /* ---------- split section headings into words (for the rise effect) ---------- */
  if (!reduce) doc.querySelectorAll(".h2").forEach(function (h2) {
    if (h2.closest(".hero")) return;
    var words = h2.textContent.trim().split(/\s+/), i;
    h2.textContent = "";
    for (i = 0; i < words.length; i++) {
      var w = doc.createElement("span"); w.className = "w";
      var inner = doc.createElement("span"); inner.textContent = words[i]; inner.style.setProperty("--d", (i * 55) + "ms");
      w.appendChild(inner); h2.appendChild(w); if (i < words.length - 1) h2.appendChild(doc.createTextNode(" "));
    }
    h2.classList.add("reveal");
  });

  /* ---------- stagger containers: children become reveals with a delay ---------- */
  doc.querySelectorAll("[data-stagger]").forEach(function (box) {
    var step = parseInt(box.dataset.stagger, 10) || 60, variant = box.dataset.variant || "up", kids = Array.prototype.slice.call(box.children);
    kids.forEach(function (k, i) {
      k.classList.add("reveal"); if (variant !== "up") k.classList.add("reveal--" + variant);
      k.dataset.delay = String(Math.min(i, 14) * step);
    });
  });

  /* ---------- nav: scrolled state, progress, active link ---------- */
  var nav = doc.getElementById("nav"), bar = doc.getElementById("progress-bar");
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll("#nav-links a"));
  var sections = navLinks.map(function (a) { return doc.querySelector(a.getAttribute("href")); });
  var ticking = false, lastY = window.scrollY || 0, dirDown = false, hideAt = 0;
  var hero = doc.querySelector(".hero"), ticker = doc.querySelector(".ticker"), tickerTrack = doc.querySelector(".ticker__track");
  var process = doc.querySelector(".process"), stepsEl = doc.querySelector(".steps"), callbar = doc.querySelector(".callbar"), contact = doc.getElementById("contact");
  if (tickerTrack && !reduce) { var scrub = doc.createElement("div"); scrub.className = "ticker__scrub"; tickerTrack.parentNode.insertBefore(scrub, tickerTrack); scrub.appendChild(tickerTrack); }
  var tickerScrub = doc.querySelector(".ticker__scrub");
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || root.scrollTop, vh = window.innerHeight;
      nav.classList.toggle("is-scrolled", y > 24);
      // direction: hide the mobile nav + call bar while scrolling down, bring them back on the way up
      var dy = y - lastY; if (Math.abs(dy) > 4) { dirDown = dy > 0; lastY = y; }
      var menuOpen = burgerEl && burgerEl.getAttribute("aria-expanded") === "true";
      nav.classList.toggle("is-hidden", dirDown && y > 160 && !menuOpen);
      if (callbar) {
        var nearForm = contact && contact.getBoundingClientRect().top < vh * 0.5 && contact.getBoundingClientRect().bottom > vh * 0.5;
        callbar.classList.toggle("is-hidden", (dirDown && y > 160) || nearForm);
      }
      if (!reduce) {
        // hero parallax, only while the hero is on screen
        if (hero) { var hb = hero.getBoundingClientRect(); hero.style.setProperty("--sy", hb.bottom > 0 ? Math.min(y, 900) : 900); }
        // ticker scrub: shifts with the ticker's position in the viewport
        if (ticker && tickerScrub) { var tb = ticker.getBoundingClientRect(); if (tb.bottom > -50 && tb.top < vh + 50) tickerScrub.style.setProperty("--tx", ((tb.top - vh) * 0.18) + "px"); }
        // process watermark drifts, mobile rail fills as the list scrolls through
        if (process) { var pb = process.getBoundingClientRect(); if (pb.bottom > 0 && pb.top < vh) process.style.setProperty("--wm", ((pb.top - vh / 2) * 0.12) + "px"); }
        if (stepsEl) { var sb = stepsEl.getBoundingClientRect(); var pr = (vh * 0.7 - sb.top) / sb.height; stepsEl.style.setProperty("--rail", Math.max(0, Math.min(1, pr))); }
      }
      var max = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      var cur = -1, mid = y + window.innerHeight * 0.4;
      sections.forEach(function (s, i) { if (s && s.offsetTop <= mid) cur = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle("is-active", i === cur); });
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- mobile menu ---------- */
  var burger = burgerEl, menu = doc.getElementById("nav-links");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open); doc.body.style.overflow = open ? "hidden" : "";
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { burger.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); doc.body.style.overflow = ""; }
    });
  }

  /* ---------- scroll reveals (only for content below the first screen) ---------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));
  if (!reduce && "IntersectionObserver" in window) {
    var vh = window.innerHeight;
    reveals.forEach(function (el) { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add("is-pending"); else el.classList.add("is-in"); });
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, d = el.dataset.delay;
        if (d == null) { var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0; d = Math.min(sib, 5) * 70; }
        el.style.transitionDelay = d + "ms";
        el.querySelectorAll(".shot__cap, .step__n, .step h3").forEach(function (c) { c.style.transitionDelay = (parseInt(d, 10) + 300) + "ms"; });
        el.classList.remove("is-pending"); el.classList.add("is-in"); ro.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-in"); });
  // the reveal list must be read after headings were split and stagger containers expanded
  var sheetRows = doc.querySelectorAll(".hero__sheet .sheet__rows li");
  if (!reduce) sheetRows.forEach(function (li, i) {
    li.style.opacity = "0"; li.style.transform = "translateX(18px)"; li.style.transition = "opacity .6s cubic-bezier(.16,1,.3,1) " + (500 + i * 90) + "ms, transform .7s cubic-bezier(.16,1,.3,1) " + (500 + i * 90) + "ms";
    requestAnimationFrame(function () { requestAnimationFrame(function () { li.style.opacity = ""; li.style.transform = ""; }); });
  });

  /* ---------- counters ---------- */
  var counters = doc.querySelectorAll(".count");
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.dataset.count, 10), start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts; var pr = Math.min(1, (ts - start) / dur); var e = 1 - Math.pow(1 - pr, 3);
          el.textContent = Math.round(target * e); if (pr < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step); co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = "0"; co.observe(c); });
  }

  /* ---------- grade profile draw + process steps ---------- */
  var grade = doc.getElementById("grade");
  if (grade && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { grade.classList.add("is-drawn"); o.disconnect(); } }, { threshold: 0.35 }).observe(grade);
  } else if (grade) grade.classList.add("is-drawn");
  var steps = doc.querySelectorAll(".step");
  if (steps.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (en, i) { if (en.isIntersecting) { en.target.classList.add("is-in"); so.unobserve(en.target); } }); }, { threshold: 0.5 });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce) doc.querySelectorAll(".btn--mag").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect(); var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.transform = "translate(" + dx * 8 + "px," + dy * 8 + "px)";
    });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });

  /* ---------- service card spotlight ---------- */
  if (finePointer) doc.querySelectorAll(".svc").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px"); card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- FAQ: animate open/close height ---------- */
  doc.querySelectorAll(".q").forEach(function (d) {
    var sum = d.querySelector("summary"), body = d.querySelector(".q__a");
    if (!sum || !body) return;
    sum.addEventListener("click", function (e) {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight; body.style.height = h + "px"; body.offsetHeight;
        body.style.transition = "height .35s cubic-bezier(.2,.7,.2,1)"; body.style.height = "0px";
        body.addEventListener("transitionend", function te() { d.open = false; body.style.height = ""; body.style.transition = ""; body.removeEventListener("transitionend", te); });
      } else {
        d.open = true; var h2 = body.offsetHeight; body.style.height = "0px"; body.offsetHeight;
        body.style.transition = "height .4s cubic-bezier(.16,1,.3,1)"; body.style.height = h2 + "px";
        body.addEventListener("transitionend", function te2() { body.style.height = ""; body.style.transition = ""; body.removeEventListener("transitionend", te2); });
      }
    });
  });

  /* ---------- form ---------- */
  var form = doc.getElementById("estimate-form"), ok = doc.getElementById("form-ok");
  if (form && isPreview) form.addEventListener("submit", function (e) {
    e.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; }
    ok.hidden = false; ok.textContent = "Preview only: on the live site this request is delivered to the Lubbock office by Netlify Forms."; form.reset();
  });

  /* ---------- photo parallax ---------- */
  var shots = doc.querySelectorAll(".shot img");
  if (shots.length && !reduce) {
    var pTick = false;
    function parallax() {
      if (pTick) return; pTick = true;
      requestAnimationFrame(function () {
        var vh = window.innerHeight;
        shots.forEach(function (img) {
          var r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
          var p = (r.top + r.height / 2 - vh / 2) / vh; img.style.setProperty("--py", (p * -4) + "%");
        });
        pTick = false;
      });
    }
    window.addEventListener("scroll", parallax, { passive: true }); parallax();
  }

  /* ---------- year ---------- */
  var yr = doc.getElementById("year"); if (yr) yr.textContent = String(new Date().getFullYear());
})();
