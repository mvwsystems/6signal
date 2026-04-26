import type { ReactNode } from "react";
import "./chakra-overrides.css";

export const metadata = {
  title: "6 Signal — Font Preview (Chakra Petch)",
  robots: { index: false, follow: false },
};

export default function ChakraLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
