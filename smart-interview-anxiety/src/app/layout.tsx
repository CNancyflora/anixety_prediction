import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalmHire – Prepare Better. Speak Confidently. Interview Ready.",
  description: "CalmHire is a professional interview preparation platform. Practice self-introduction, speaking performance, HR questions, and mock interviews with real performance tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
