import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import { TaskStoreProvider } from "./components/TaskStore";
import AppLayout from "./components/AppLayout";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bossint",
  description: "Your intelligent research assistant",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('bossint-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="h-full antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <ThemeProvider>
          <TaskStoreProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </TaskStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
