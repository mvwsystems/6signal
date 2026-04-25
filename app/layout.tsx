import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "6 Signal — Be the roofer AI recommends.",
  description:
    "Homeowners now ask AI for a roofer. 6 Signal makes sure your company is the one it names — across six discovery layers, for $1,000/month.",
  openGraph: {
    title: "6 Signal — Be the roofer AI recommends.",
    description:
      "Homeowners now ask AI for a roofer. 6 Signal makes sure your company is the one it names.",
    type: "website",
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,200;1,9..144,300&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
