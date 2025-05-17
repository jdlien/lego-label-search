'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-brand-700 dark:bg-gray-800 text-white px-4 py-2 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">
          <Link href="/" className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12">
              <path fill="#3334" d="M37.3 59.8v34.5L2 60.3V25.8l35.3 34Z" />
              <path fill="#fff4" d="M37.3 59.8v34.5l60.5-19.9V39.8l-60.5 20Z" />
              <path
                fill="currentColor"
                d="m55.3 6.8 7.3-2.4 36.2 35v35.7L37.2 95.5 1 60.7V25l15.8-5.3.6-.5a14 14 0 0 1 8.7-2.6l21.7-7.3a14 14 0 0 1 7.5-2.5ZM15.2 22.4 3.9 26.2l33.7 32.4 58.3-19.2-29.4-28.5c.5.8.8 1.6.8 2.5v4.9c0 1.5-.8 3-2.3 4.1-2 1.5-5 2.5-8.6 2.5a14 14 0 0 1-8.5-2.5 5.2 5.2 0 0 1-2.3-4.1v-5c0-.4 0-.8.2-1.2l-15.1 5a12 12 0 0 1 4.3 2c1.5 1.3 2.3 2.7 2.3 4.3v5c0 1.6-.8 3-2.3 4.3a15 15 0 0 1-8.8 2.6c-3.6 0-6.8-1-8.8-2.6-1.5-1.2-2.3-2.7-2.3-4.2v-6.1ZM64.4 8.9l-2.3-2.3-1.8.6c1.6.3 3 1 4.1 1.6Zm-28 83V60.2L3 28v31.8l33.3 32Zm60.4-50.7L38.3 60.5v32.4l58.5-19.2V41.2ZM32.2 46v-5.2c0-1.6.9-3 2.4-4.3a15 15 0 0 1 9-2.6c3.7 0 7 1 9 2.6 1.5 1.2 2.4 2.7 2.4 4.3V46c0 1.6-.9 3-2.4 4.3a15 15 0 0 1-9 2.6c-3.7 0-7-1-9-2.6-1.5-1.2-2.4-2.7-2.4-4.3Zm11.4-10.1c-5.2 0-9.4 2.2-9.4 5s4.2 5 9.4 5 9.4-2.2 9.4-5-4.2-5-9.4-5Zm19.3.1v-5c0-1.6.8-3 2.3-4.2a14 14 0 0 1 8.7-2.6c3.6 0 6.8 1 8.8 2.6C84 28 85 29.4 85 31v5c0 1.6-.9 3-2.3 4.2-2 1.5-5.2 2.6-8.8 2.6s-6.8-1-8.7-2.6c-1.5-1.2-2.4-2.6-2.4-4.2Zm11-9.9c-5 0-9.2 2.2-9.2 5 0 2.7 4.1 4.9 9.2 4.9 5 0 9.2-2.2 9.2-5 0-2.7-4.1-4.9-9.2-4.9Zm-47.7-7.6c-5.1 0-9.2 2.2-9.2 5 0 2.7 4.1 5 9.2 5s9.2-2.3 9.2-5c0-2.8-4.1-5-9.2-5Zm30.2-9.9c-5 0-9 2.2-9 4.9 0 2.6 4 4.8 9 4.8s9-2.2 9-4.8c0-2.7-4-4.9-9-4.9Z"
              />
              <path
                fill="#3334"
                d="M34.1 44.4v2.8s1.2 3.4 8.5 3.8v-3s-6.1 0-8.5-3.6Zm30.6-10.2V37s.8 3.4 8 3.7v-3s-5.7.1-8-3.5ZM17 26.7v2.6s.5 3.2 7.8 3.9v-3s-5.5 0-7.8-3.5Zm30.5-10.1v2.6s.5 3.2 7.8 3.9v-3s-5.5 0-7.8-3.5Z"
              />
            </svg>
            <div>Brck Label Search</div>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-3">
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

          {/* TODO: I think I can simplify this a bit or optimize the SVGs */}
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
        <div className="flex sm:hidden items-center gap-2">
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
        <div className="sm:hidden fixed inset-0 z-50 flex">
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
