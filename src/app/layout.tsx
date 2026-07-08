import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Display face for headings — geometric, technical, distinct from the Inter UI text.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Coach First",
  description:
    "The football intelligence OS for manager search, mandate delivery, and relationship intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full light`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
