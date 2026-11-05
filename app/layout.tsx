import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITF Exam Prep RAG",
  description: "Exam preparatory RAG app for ITF staff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
