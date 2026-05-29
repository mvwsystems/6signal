"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const careItems = [
  "Managed hosting — we handle it, you forget about it",
  "Uptime monitoring — we know if something breaks before you do",
  "Small content updates — hours, days, or service info changes",
  "Form and contact testing — make sure leads are coming through",
  "Security and software updates",
  "Monthly site review — catch anything that needs attention",
  "One point of contact for anything website-related",
];

const faqs = [
  {
    q: "Is the care plan required?",
    a: "No. It&rsquo;s optional. If you have your own hosting and want to manage the site yourself, that&rsquo;s completely fine. We still build the site the same way. The care plan is for contractors who want to hand it off and never think about it again.",
  },
  {
    q: "What counts as a &lsquo;small update&rsquo;?",
    a: "Changing your phone number, adding a new service, updating business hours, swapping a photo, fixing a typo — anything that takes under an hour and doesn&rsquo;t change the structure of the site. For larger changes (new page, new section), we scope and quote separately.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly. No contract, no cancellation fee. If you cancel, the site stays live on your hosting until you change nameservers — we give you the files and point you in the right direction.",
  },
  {
    q: "Do I have to have a 6 Signal website to get the care plan?",
    a: "For now, yes. We only take on care plan clients whose sites we&rsquo;ve built — we know the code, the structure, and how to support it properly. We may open this to outside sites in the future.",
  },
];

export default function CarePage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Website Care Plan</span>
            <h1 className="display reveal">
              Your website, handled.<br />
              <em>Every month.</em>
            </h1>
            <p className="hero-deck reveal">
              $97/month. Hosting, monitoring, small updates, and support. You run your
              business — we make sure your site stays working and looking right.
            </p>
            <div className="hero-cta-row reveal">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Book a Call
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/websites" className="btn btn-ghost btn-lg">See the Rebuild</Link>
            </div>
          </div>
        </div>
      </header>

      {/* WHY YOU NEED IT */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">Why care matters</span>
          <p className="problem-lead">
            A website that&rsquo;s down, broken, or outdated doesn&rsquo;t just look bad.{" "}
            <em>It costs you jobs.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Most contractors launch a new site and then walk away. They never update it.
              The hosting lapses. The contact form breaks. The phone number changes and
              nobody fixes the site.
              <br /><br />
              Buyers notice. A site that looks abandoned signals a company that might be too.
              <br /><br />
              <span className="dim">
                The care plan exists so you have one person — one call or email — for
                anything that touches your website. That&rsquo;s it.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "Your contact form goes down and you don't find out for weeks.",
                "Hosting auto-renews on an old card and the site goes offline.",
                "You changed your number but forgot to update the site. Leads can't reach you.",
                "The site looks fine on desktop but broken on mobile and you never check.",
                "Nothing breaks, but nothing gets updated either — the site goes stale.",
              ].map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CARE CARD */}
      <section className="care-section rule" id="care">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">The plan</span>
              <h2 className="display">
                Everything included.<br />
                <em>One flat rate.</em>
              </h2>
            </div>
            <div className="right">
              No per-update billing. No hours to track. One monthly rate covers hosting,
              monitoring, small updates, and a single point of contact for your site.
            </div>
          </div>
          <div className="care-card reveal">
            <div className="care-price">
              <span className="dollar">$</span>97
              <span className="mo">/ mo</span>
            </div>
            <div className="care-right">
              <h3>Website Care Plan</h3>
              <p className="care-sub">
                Monthly. No contract. Cancel anytime. Everything your site needs to stay
                online, functional, and current.
              </p>
              <div className="feat-list">
                {careItems.map((item, i) => (
                  <div key={i} className="feat-item">{item}</div>
                ))}
              </div>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Get Started
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="page-faq rule">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="left">
              <span className="idx">Common questions</span>
              <h2 className="display">
                Straight answers.<br />
                <em>No runaround.</em>
              </h2>
            </div>
            <div className="right">
              Questions not covered here? Book a call or email us directly — we&rsquo;ll
              give you a straight answer.
            </div>
          </div>
          <div className="faq-list reveal">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">
                  <span className="q-idx">0{i + 1}</span>
                  <span className="q-text" dangerouslySetInnerHTML={{ __html: faq.q }} />
                  <span className="q-icon" aria-hidden="true" />
                </div>
                <div className="faq-a">
                  <div className="faq-a-inner" dangerouslySetInnerHTML={{ __html: faq.a }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Website Care Plan</div>
          <h2 className="display">
            One less thing<br />
            to manage.
          </h2>
          <p className="f-deck">
            Book a call and we&rsquo;ll get the care plan set up alongside your rebuild —
            or as a standalone if you already have a site we built.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book a Call
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a
              href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email Directly
            </a>
          </div>
          <div className="f-notes">
            <span>$97/month</span>
            <span>No contract</span>
            <span>Cancel anytime</span>
            <span>One point of contact</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book a Call
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </a>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
