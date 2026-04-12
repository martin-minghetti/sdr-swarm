import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import PageTransition from "@/components/PageTransition";
import ThemeScript from "@/components/ThemeScript";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SDR Swarm — AI Sales Research",
  description: "Multi-agent AI system for automated sales development research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
