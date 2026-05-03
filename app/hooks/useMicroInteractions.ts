"use client";
import { useEffect } from "react";

export function useMicroInteractions() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 60);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const heroEls = document.querySelectorAll(".hero .reveal, .inner-hero .reveal");
    heroEls.forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 140 + i * 180);
    });

    const faqItems = document.querySelectorAll(".faq-item");
    const faqHandlers: Array<[Element, () => void]> = [];
    faqItems.forEach((item) => {
      const q = item.querySelector(".faq-q");
      if (!q) return;
      const toggle = () => item.classList.toggle("open");
      q.addEventListener("click", toggle);
      faqHandlers.push([q, toggle]);
    });

    return () => {
      io.disconnect();
      faqHandlers.forEach(([q, toggle]) => q.removeEventListener("click", toggle));
    };
  }, []);

  useEffect(() => {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    let mx = 0, my = 0, rx = 0, ry = 0, rafId = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px,${my}px)`;
    };
    const animRing = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (ring) ring.style.transform = `translate(${rx}px,${ry}px)`;
      rafId = requestAnimationFrame(animRing);
    };
    rafId = requestAnimationFrame(animRing);
    document.addEventListener("mousemove", onMove);

    const onEnter = () => { dot?.classList.add("hovered"); ring?.classList.add("hovered"); };
    const onLeave = () => { dot?.classList.remove("hovered"); ring?.classList.remove("hovered"); };
    const targets = document.querySelectorAll("a, button");
    targets.forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    const hero = document.querySelector<HTMLElement>(".hero");
    const glow = document.querySelector<HTMLElement>(".hero-glow");
    const onHeroMove = (e: MouseEvent) => {
      if (!hero || !glow) return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      glow.style.transform = `translate(${x * -50}px,${y * -35}px)`;
    };
    const onHeroLeave = () => { if (glow) glow.style.transform = ""; };
    hero?.addEventListener("mousemove", onHeroMove);
    hero?.addEventListener("mouseleave", onHeroLeave);

    const magnets = Array.from(document.querySelectorAll<HTMLElement>(".btn-primary.btn-lg"));
    const mHandlers: Array<[HTMLElement, (e: Event) => void, () => void]> = [];
    magnets.forEach(btn => {
      const move = (e: Event) => {
        const me = e as MouseEvent;
        const r = btn.getBoundingClientRect();
        const dx = (me.clientX - (r.left + r.width / 2)) * 0.28;
        const dy = (me.clientY - (r.top + r.height / 2)) * 0.28;
        btn.style.transform = `translate(${dx}px,${dy}px)`;
      };
      const leave = () => { btn.style.transform = ""; };
      btn.addEventListener("mousemove", move);
      btn.addEventListener("mouseleave", leave);
      mHandlers.push([btn, move, leave]);
    });

    const priceEl = document.querySelector(".p-number");
    let counted = false;
    const countIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || counted) return;
        counted = true;
        const raw = entry.target.textContent?.replace(/[^0-9]/g, "") ?? "1500";
        const endVal = parseInt(raw, 10) || 1500;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / 1600, 1);
          const v = Math.floor((1 - Math.pow(1 - p, 3)) * endVal);
          entry.target.childNodes.forEach(n => {
            if (n.nodeType === Node.TEXT_NODE)
              n.textContent = v >= endVal ? endVal.toLocaleString() : v.toLocaleString();
          });
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    if (priceEl) countIO.observe(priceEl);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      targets.forEach(el => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      hero?.removeEventListener("mousemove", onHeroMove);
      hero?.removeEventListener("mouseleave", onHeroLeave);
      mHandlers.forEach(([btn, move, leave]) => {
        btn.removeEventListener("mousemove", move);
        btn.removeEventListener("mouseleave", leave);
      });
      countIO.disconnect();
    };
  }, []);
}
