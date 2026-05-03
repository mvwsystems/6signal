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
              A specialized visibility practice for residential contractors who intend to own
              their local market — not rent leads from it.
            </p>
          </div>
          <div className="footer-right">
            <div className="footer-col">
              <div className="head">Site</div>
              <Link href="/#framework">The Six</Link>
              <Link href="/#engagement">The Work</Link>
              <Link href="/#pricing">Retainer</Link>
              <Link href="/#faq">FAQ</Link>
            </div>
            <div className="footer-col">
              <div className="head">Contact</div>
              <Link href="/#book">Book the audit</Link>
              <a href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5">
                Email directly
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 6 Signal · All rights reserved</div>
          <div>Signal · Repetition · Reach</div>
        </div>
      </div>
    </footer>
  );
}
