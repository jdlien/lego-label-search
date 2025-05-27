'use client'

import React from 'react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full bg-gray-200 py-4 text-center dark:bg-gray-800">
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
