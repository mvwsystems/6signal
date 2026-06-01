"use client";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "./AuditPopupButton";

export default function BlogPageClient() {
  useMicroInteractions();
  return (
    <>
      <div className="mobile-cta">
        <AuditPopupButton>
          Get the audit
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </AuditPopupButton>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
