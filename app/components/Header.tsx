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
      className={`rounded px-3 py-2 transition-colors ${
        isActive ? 'bg-sky-200/30' : 'hover:bg-sky-600/80 dark:hover:bg-gray-700/80'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-sky-700 px-4 py-2 text-white shadow-md dark:bg-gray-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">
          <Link href="/" className="flex items-center gap-3">
            <BrckLogo className="w-12" />
            <div>Brck Label Search</div>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-3 sm:flex">
          <NavLink href="/">Search</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          <NavLink href="/about">About</NavLink>
          <DarkModeToggle />
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <DarkModeToggle />

          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-md p-2 transition-colors hover:bg-sky-600 dark:hover:bg-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />

          {/* Drawer panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-sky-700 p-4 shadow-xl dark:bg-gray-800">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-md p-2 transition-colors hover:bg-sky-600 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-6 w-6"
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
