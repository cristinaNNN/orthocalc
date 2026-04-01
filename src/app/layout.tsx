import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT KATEX CSS GLOBALLY
import 'katex/dist/katex.min.css'; 
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OrthoCalc",
  description: "Orthopedic Clinical Calculator",
};

export default function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppLayout modal={modal}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}