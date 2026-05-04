import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://6signal.co"),
  title: "6 Signal — AI Visibility for Residential Contractors",
  description:
    "Homeowners ask ChatGPT, Maps, and AI Overviews before they call. 6 Signal gets residential contractors named across six visibility layers. Based in Dallas/Fort Worth, serving contractors in DFW and select markets beyond Texas.",
  openGraph: {
    title: "6 Signal — Be the contractor AI recommends.",
    description:
      "Homeowners ask ChatGPT, Maps, and AI Overviews before they call anyone. 6 Signal gets residential contractors onto that shortlist. Based in the Dallas/Fort Worth area.",
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "6 Signal — Be the contractor AI recommends.",
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
