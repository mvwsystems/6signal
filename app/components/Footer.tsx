import Link from "next/link";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

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
              Trust-first websites for contractors who do good work and deserve to look like it online.
            </p>
          </div>
          <div className="footer-right">
            <div className="footer-col">
              <div className="head">Services</div>
              <Link href="/websites">Website Rebuild</Link>
              <Link href="/care">Website Care</Link>
              <Link href="/visibility">Visibility</Link>
              <Link href="/follow-up">AI Follow-Up</Link>
            </div>
            <div className="footer-col">
              <div className="head">Company</div>
              <Link href="/work">Recent Work</Link>
              <Link href="/contact">Contact</Link>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer">Book a Call</a>
              <a href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5">Email Us</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 6 Signal · All rights reserved</div>
          <div>Websites · Care · Visibility · Follow-Up</div>
        </div>
      </div>
    </footer>
  );
}
