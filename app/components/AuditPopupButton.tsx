"use client";
import { PopupButton } from "@typeform/embed-react";
import { TYPEFORM_ID } from "@/app/lib/links";

interface AuditPopupButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function AuditPopupButton({ className, style, children }: AuditPopupButtonProps) {
  return (
    <PopupButton
      id={TYPEFORM_ID}
      className={className}
      style={style}
      size={80}
      hidden={{ utm_source: "6signal_site" }}
    >
      {children}
    </PopupButton>
  );
}
