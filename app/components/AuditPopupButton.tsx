"use client";
import Link from "next/link";

interface AuditPopupButtonProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function AuditPopupButton({ className, style, children }: AuditPopupButtonProps) {
  return (
    <Link href="/visibility-check" className={className} style={style}>
      {children}
    </Link>
  );
}
