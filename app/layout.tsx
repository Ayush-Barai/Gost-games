import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GameModal } from "@/components/GameModal";
import { AchievementToastHost } from "@/components/AchievementToast";
import { StoreHydrator } from "@/components/StoreHydrator";

export const metadata: Metadata = {
  title: {
    default: "Ghost Games Arcade — 20 Haunted Mini Games",
    template: "%s · Ghost Games Arcade",
  },
  description:
    "Step into a mysterious arcade filled with 20 free haunted mini games. Cursed puzzles, spooky arcade challenges, ghost hunts and survival trials — no login, no downloads.",
  keywords: [
    "ghost games",
    "halloween games",
    "free browser games",
    "mini games",
    "haunted arcade",
    "spooky games",
    "puzzle games",
    "arcade games",
  ],
  authors: [{ name: "Ghost Games Arcade" }],
  creator: "Ghost Games Arcade",
  applicationName: "Ghost Games Arcade",
  category: "games",
  openGraph: {
    type: "website",
    title: "Ghost Games Arcade — 20 Haunted Mini Games",
    description:
      "20 cursed mini games. One haunted arcade. Play free in your browser — no login, no downloads.",
    siteName: "Ghost Games Arcade",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Games Arcade — 20 Haunted Mini Games",
    description:
      "20 cursed mini games. One haunted arcade. Play free in your browser.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080812",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="arcade-bg scanlines vignette min-h-screen antialiased">
        <StoreHydrator />
        <div className="grain" aria-hidden="true" />

        <a
          href="#games"
          className="sr-only z-[200] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to games
        </a>

        <Navbar />
        <main>{children}</main>
        <Footer />

        <GameModal />
        <AchievementToastHost />
      </body>
    </html>
  );
}
