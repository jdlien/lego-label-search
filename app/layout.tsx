import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ThemeProvider } from './context/ThemeContext'
import { PWABottomNav, PWATopBar, PWAViewportAdjuster } from './components/PWAHandler'

export const metadata: Metadata = {
  title: 'LEGO Part Label Search',
  description: 'Search and create labels for LEGO parts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/icons/manifest.json" />

        {/* Theme color for Safari status bar */}
        <meta name="theme-color" content="#0369a1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />

        {/* Prevent FOUC in dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var mql = window.matchMedia('(prefers-color-scheme: dark)');
                  var isDark = theme === 'dark' || (!theme && mql.matches);

                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {
                  console.error('Dark mode initialization error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="dark:bg-gray-900 dark:text-white">
        <PWATopBar />
        <PWAViewportAdjuster>
          <div className="">
            <ThemeProvider defaultTheme="gray" defaultAccent="sky" defaultUISize="lg">
              <Header />
              <main className="">{children}</main>
              <Footer />
            </ThemeProvider>
          </div>
        </PWAViewportAdjuster>
        <PWABottomNav />
      </body>
    </html>
  )
}
