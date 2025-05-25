'use client'

import React from 'react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-6 w-full bg-gray-100 py-2 text-center dark:bg-gray-800">
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
