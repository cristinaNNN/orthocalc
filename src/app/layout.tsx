import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// IMPORT KATEX CSS GLOBALLY
import 'katex/dist/katex.min.css'; 
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}