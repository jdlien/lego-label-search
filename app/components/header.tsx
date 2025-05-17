'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Initialize theme state on client-side
  useEffect(() => {
    // Set initial theme state from localStorage or system preference
    if (typeof window !== 'undefined') {
      if (
        localStorage.theme === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        setTheme('dark')
      } else {
        setTheme('light')
      }
    }
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)

    // Update localStorage and document class
    if (typeof window !== 'undefined') {
      localStorage.theme = newTheme
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return (
    <header className="bg-brand-700 dark:bg-gray-800 text-white px-4 py-2 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          <Link href="/" className="flex items-center gap-3 hover:no-underline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="50px" className="text-white">
              <path
                fill="currentColor"
                d="m55.3 6.8 7.3-2.4 36.2 35v35.7L37.2 95.5 1 60.7V25l15.8-5.3.6-.5a14 14 0 0 1 8.7-2.6l21.7-7.3a14 14 0 0 1 7.5-2.5Z"
              />
            </svg>
            <div>Brck Label Search</div>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className={`px-3 py-2 rounded transition-colors ${
              pathname === '/' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
            }`}
          >
            Search
          </Link>
          <Link
            href="/categories"
            className={`px-3 py-2 rounded transition-colors ${
              pathname === '/categories' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
            }`}
          >
            Categories
          </Link>
          <Link
            href="/about"
            className={`px-3 py-2 rounded transition-colors ${
              pathname === '/about' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
            }`}
          >
            About
          </Link>

          <button
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-brand-600 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-brand-600 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-brand-600 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />

          {/* Drawer panel */}
          <div className="fixed right-0 top-0 h-full w-64 bg-brand-700 dark:bg-gray-800 p-4 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md hover:bg-brand-600 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded transition-colors ${
                  pathname === '/' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/categories"
                className={`px-3 py-2 rounded transition-colors ${
                  pathname === '/categories' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 rounded transition-colors ${
                  pathname === '/about' ? 'bg-white/30' : 'hover:bg-brand-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
