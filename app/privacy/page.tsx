import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | 6 Signal",
  description:
    "How 6 Signal collects, uses, and protects your information — including SMS consent, analytics, and your rights.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx">Legal</span>
            <h1 className="display">
              Privacy Policy.<br />
              <em>Plain English, like everything else here.</em>
            </h1>
            <p className="hero-deck">Effective July 25, 2026 · 6 Signal · Dallas–Fort Worth, TX</p>
          </div>
        </div>
      </header>

      <section className="rule legal-page">
        <div className="wrap">
          <h2>Who we are</h2>
          <p>
            6 Signal (&ldquo;we,&rdquo; &ldquo;us&rdquo;) is a visibility and systems
            practice for contractors, operated by Matt Vincent Walker in the
            Dallas&ndash;Fort Worth area. Questions about this policy or your data:{" "}
            <a href="mailto:hello@6signal.co">hello@6signal.co</a>.
          </p>

          <h2>What we collect</h2>
          <p>
            <strong>Information you give us.</strong> When you use our forms — the AI
            Visibility Check or Audit, the website-build questionnaire, inquiry and
            contact forms — we collect what you enter: your name, business name, email,
            phone number (optional), website URL, trade, market, and your answers to
            questionnaire questions.
          </p>
          <p>
            <strong>Payment information.</strong> Payments are processed by Stripe on
            Stripe&rsquo;s own pages. We never see or store your card number. Stripe
            sends us your email, the amount paid, and an order reference so we can
            deliver what you bought.
          </p>
          <p>
            <strong>Usage information.</strong> Like most websites, we use analytics to
            understand how the site is used: Meta Pixel (ad measurement — page views and
            purchase events) and Microsoft Clarity (session recordings, heatmaps, and
            interaction data). These tools use cookies and similar technologies.
          </p>

          <h2>How we use it</h2>
          <p>
            To deliver what you asked for (audits, briefs, website builds, replies to
            inquiries); to send transactional emails about your orders and results; to
            respond to you directly; to measure our advertising; and to improve the
            site. We do not sell your personal information. We do not use your
            information for third-party marketing.
          </p>

          <h2>Text messages (SMS)</h2>
          <p>
            If you provide your phone number, you consent to receive calls and text
            messages from 6 Signal <em>about your request or your project</em> — for
            example, follow-ups on an inquiry you submitted, scheduling, and updates on
            work you&rsquo;ve engaged us for. This is conversational and transactional
            messaging, not a promotional list.
          </p>
          <p>
            Message frequency varies. Message and data rates may apply. Reply{" "}
            <strong>STOP</strong> to opt out at any time, or <strong>HELP</strong> for
            help. Consent to receive text messages is not a condition of purchasing
            anything. <strong>Your phone number and your SMS consent are never shared
            with or sold to third parties for their marketing.</strong>
          </p>

          <h2>Who we share data with</h2>
          <p>
            Only the service providers that run this site and our operations: Stripe
            (payments), Netlify (hosting), Supabase (database), Resend (email
            delivery), Anthropic (generating your audit and questionnaire content),
            Meta and Microsoft (analytics as described above), and our telephony
            provider for calls and texts. Each receives only what it needs to do its
            job. We may also disclose information if the law requires it.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Business records (orders, audits, intakes) are kept as long as we operate,
            for service history and legal purposes. Analytics data is retained per each
            provider&rsquo;s standard schedule.
          </p>

          <h2>Your rights</h2>
          <p>
            Email <a href="mailto:hello@6signal.co">hello@6signal.co</a> to ask what we
            hold about you, correct it, or delete it. We answer the same day, usually
            within a few hours — the same standard as everything else here. Depending
            on where you live, you may have additional rights under state privacy laws;
            we honor reasonable requests regardless of where you&rsquo;re from.
          </p>

          <h2>Cookies</h2>
          <p>
            The analytics tools above set cookies. Your browser can block or clear
            cookies at any time; the site works without them.
          </p>

          <h2>Children</h2>
          <p>This site is for businesses and is not directed to children under 13.</p>

          <h2>Changes</h2>
          <p>
            If this policy changes, the new version is posted here with a new effective
            date. Material changes to how we use your data will be flagged plainly, not
            buried.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
