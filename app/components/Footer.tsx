import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-inner">
          <div className="footer-left">
            <Link href="/" className="logo" aria-label="6 Signal">
              <img src="/6SIGNAL2.png" alt="6 Signal" className="logo-img" />
            </Link>
            <p className="f-line">
              A specialized visibility practice for residential and commercial
              contractors who intend to own their local market — not rent leads
              from it. Based in Dallas/Fort Worth.
            </p>
          </div>
          <div className="footer-right">
            <div className="footer-col">
              <div className="head">Site</div>
              <Link href="/method">The Method</Link>
              <Link href="/#framework">The Six Layers</Link>
              <Link href="/#engagement">The Audit</Link>
              <Link href="/#pricing">Retainer</Link>
              <Link href="/#faq">FAQ</Link>
              <Link href="/visibility">Visibility</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div className="footer-col">
              <div className="head">Trades</div>
              <Link href="/roofers">Roofers</Link>
              <Link href="/plumbers">Plumbers</Link>
              <Link href="/hvac">HVAC</Link>
              <Link href="/electricians">Electricians</Link>
              <Link href="/remodelers">Remodelers</Link>
              <Link href="/garage-doors">Garage Doors</Link>
              <Link href="/landscaping">Landscaping</Link>
              <Link href="/tree-service">Tree Service</Link>
              <Link href="/pest-control">Pest Control</Link>
              <Link href="/foundation-concrete">Foundation</Link>
              <Link href="/commercial-contractors">Commercial</Link>
            </div>
            <div className="footer-col">
              <div className="head">Audit</div>
              <Link href="/#book">Book the audit</Link>
              <Link href="/contact">Get in touch</Link>
              <a href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5">
                Email directly
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 6 Signal · All rights reserved</div>
          <div>Based in DFW · Signal · Repetition · Reach</div>
        </div>
      </div>
    </footer>
  );
}
