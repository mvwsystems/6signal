import type { Metadata } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Deposit Received — Build Greenlit | 6Signal",
  robots: { index: false, follow: false },
};

export default function StartConfirmedPage() {
  return (
    <>
      <Nav />
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx">The Climb · Start — Website Build</span>
            <h1 className="display">
              Deposit received.<br />
              <em>Your build is greenlit.</em>
            </h1>
            <p className="hero-deck">
              Here&rsquo;s what happens next — no chasing required on your end.
            </p>
          </div>
        </div>
      </header>

      <section className="engagement rule">
        <div className="wrap">
          <div className="engage-table">
            <div className="engage-row">
              <div className="e-idx">01</div>
              <div className="e-title">
                <span className="phase">First</span>
                Expect a call from Matt Vincent Walker
              </div>
              <div className="e-body">
                Before any design work begins. He&rsquo;ll have already been through
                every answer in your questionnaire — the call locks the direction and
                gets you his read on what actually moves buyers in your market.
                It&rsquo;s short, and it&rsquo;s why one-operator builds come out
                right the first time.
              </div>
            </div>
            <div className="engage-row">
              <div className="e-idx">02</div>
              <div className="e-title">
                <span className="phase">Then</span>
                First preview
              </div>
              <div className="e-body">
                You&rsquo;ll see the design direction and homepage before the full
                site is built — big changes happen there, not after launch.
              </div>
            </div>
            <div className="engage-row">
              <div className="e-idx">03</div>
              <div className="e-title">
                <span className="phase">Launch</span>
                Live in 2–3 weeks
              </div>
              <div className="e-body">
                Most sites launch within 2&ndash;3 weeks of the deposit. The
                remaining $750 is due at launch, once you&rsquo;ve approved the
                site. A confirmation email with all of this is on its way to your
                inbox now.
              </div>
            </div>
          </div>
          <div className="safety-note" style={{ marginTop: "48px" }}>
            <span className="safety-note-label">Something to add before the call?</span>
            <p>
              Reply to the confirmation email — it goes straight to the operator
              building your site. No account managers, no ticket numbers.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
