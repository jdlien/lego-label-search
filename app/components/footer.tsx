'use client'

import React from 'react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full mt-6 py-2 bg-gray-100 dark:bg-gray-800 text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        &copy; {year} JD Lien. Source available on{' '}
        <a
          href="https://github.com/jdlien/lego-label-search"
          className="link"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  )
}
