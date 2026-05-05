import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClaimIQ",
  description: "Optimize dental treatments for insurance coverage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C9.8 2 8 3.2 7 5C6 3.2 4.2 2 2 2C2 6 3.5 8.5 5 10C5.5 10.5 6 11.5 6.2 13C6.5 15.5 7 20 8.5 22C9 22 9.5 21.5 10 20C10.5 18.5 11 16 12 16C13 16 13.5 18.5 14 20C14.5 21.5 15 22 15.5 22C17 20 17.5 15.5 17.8 13C18 11.5 18.5 10.5 19 10C20.5 8.5 22 6 22 2C19.8 2 18 3.2 17 5C16 3.2 14.2 2 12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-semibold text-sm tracking-wide">ClaimIQ</span>
              </div>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
