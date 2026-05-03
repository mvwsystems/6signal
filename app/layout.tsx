import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://6signal.co"),
  title: "6 Signal — Be the roofer AI recommends.",
  description:
    "Homeowners now ask AI for a roofer. 6 Signal makes sure your company is the one it names — across six discovery layers, for $1,000/month.",
  openGraph: {
    title: "6 Signal — Be the roofer AI recommends.",
    description:
      "Homeowners now ask AI for a roofer. 6 Signal makes sure your company is the one it names.",
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
