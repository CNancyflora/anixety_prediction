import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CalmHire AI | Smart Interview Anxiety Prediction",
  description: "Production-ready AI system for interview anxiety analysis and behavioral feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          {children}
        </div>
      </body>
    </html>
  );
}
