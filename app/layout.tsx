import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://6signal.co"),
  title: "6 Signal — Contractor Websites That Earn Trust",
  description:
    "6 Signal builds fast, professional websites for contractors. $1,500 flat. Built to make your company look as good online as it does in the field.",
  openGraph: {
    title: "6 Signal — Contractor Websites That Earn Trust",
    description:
      "Your website should make you look as good as your work. 6 Signal builds trust-first contractor websites for $1,500.",
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/6SIGNAL.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
