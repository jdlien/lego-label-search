/** @format */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  // State management is minimized for now - we'll add more when we implement search functionality
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [hasSearched] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-screen-2xl px-4 pt-4 pb-3">
        <div className="flex flex-col items-stretch">
          {/* SearchBar component will go here */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <p className="text-center">Search bar will be implemented here</p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md my-4">
              <div className="flex">
                <svg className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-bold">Search failed!</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && hasSearched && (
            <div>
              <p className="text-center py-8">Search results will appear here</p>
            </div>
          )}

          {/* Initial state - welcome message */}
          {!isLoading && !error && !hasSearched && (
            <div className="text-center pt-4 pb-32">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Enter a search term, select a category,
                <br />
                or&nbsp;
                <button className="text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                  search using an image
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
