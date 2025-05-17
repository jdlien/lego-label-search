'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { DarkModeToggle } from './DarkModeToggle'
import { BrckLogo } from './BrckLogo'

// NavLink component to handle active link styling
function NavLink({ href, children, onClick = () => {} }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded transition-colors ${
        isActive ? 'bg-white/30' : 'hover:bg-sky-600 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-sky-700 dark:bg-gray-800 text-white px-4 py-2 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">
          <Link href="/" className="flex items-center gap-3">
            <BrckLogo className="w-12" />
            <div>Brck Label Search</div>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-3">
          <NavLink href="/">Search</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          <NavLink href="/about">About</NavLink>
          <DarkModeToggle />
        </nav>
        <div className="flex sm:hidden items-center gap-2">
          <DarkModeToggle />

          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-sky-600 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
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
          <div className="fixed right-0 top-0 h-full w-64 bg-sky-700 dark:bg-gray-800 p-4 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md hover:bg-sky-600 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <NavLink href="/" onClick={() => setIsMenuOpen(false)}>
                Search
              </NavLink>
              <NavLink href="/categories" onClick={() => setIsMenuOpen(false)}>
                Categories
              </NavLink>
              <NavLink href="/about" onClick={() => setIsMenuOpen(false)}>
                About
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
