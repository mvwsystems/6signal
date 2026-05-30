import Link from "next/link";

interface BlogCTAProps {
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  buttonHref?: string;
  label?: string;
}

export default function BlogCTA({
  headline = "Download the Apple Maps Checklist",
  subheadline = "A practical Apple Maps + Apple Ads Readiness + AI Visibility checklist for Dallas–Fort Worth businesses that want to get found before the local search auction gets more crowded.",
  buttonText = "Download the Apple Maps Checklist",
  buttonHref = "/apple-checklist",
  label = "Free Download",
}: BlogCTAProps) {
  return (
    <div className="blog-cta-block">
      <div className="blog-cta-block-inner">
        <span className="idx blog-cta-label">{label}</span>
        <h3 className="blog-cta-headline">{headline}</h3>
        <p className="blog-cta-text">{subheadline}</p>
        <Link href={buttonHref} className="btn btn-primary">
          {buttonText}
          <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
