import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { TipsProvider } from "@/lib/tips";

const NovaGuardian = dynamic(() => import("@/components/NovaGuardian"), {
  loading: () => null,
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentFlow AI — Intelligent Recruiting Pipeline",
  description:
    "AI-powered recruiting pipeline that parses resumes, scores candidates, and generates tailored screening questions.",
  themeColor: "#8b5cf6",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('talentflow-theme');
                if (t === 'light' || t === 'dark') {
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(t);
                } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TipsProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
              Skip to content
            </a>
            <div className="gradient-bg" />
            <main id="main-content">
              {children}
            </main>
            {/* Global footer with legal links */}
            <footer className="relative z-10 border-t border-[var(--glass-border)] mt-auto">
              <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span>&copy; {new Date().getFullYear()} TalentFlow AI. Powered by AI. Built for humans.</span>
                <div className="flex items-center gap-4">
                  <a href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
                  <a href="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</a>
                  <a href="/eval" className="hover:text-purple-400 transition-colors">AI Ethics</a>
                </div>
              </div>
            </footer>
            <NovaGuardian />
          </TipsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
