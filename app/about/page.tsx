import React from 'react'

interface Stats {
  totalParts: number
  totalCategories: number
  topLevelCategories: number
  uniqueImages: number
}

async function getStats(): Promise<Stats> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`, {
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    // Return fallback data if API fails
    return {
      totalParts: 0,
      totalCategories: 0,
      topLevelCategories: 0,
      uniqueImages: 0,
    }
  }
}

export default async function About() {
  const stats = await getStats()
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        <section>
          <h1 className="mb-4 text-3xl font-bold">About LEGO Part Label Search</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            This application helps LEGO enthusiasts create and print labels for organizing their parts collection.
            Developed by JD Lien. Source code available at{' '}
            <a
              href="https://github.com/jdlien/lego-label-search"
              className="text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-300 dark:hover:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/jdlien/lego-label-search
            </a>
            .
          </p>
        </section>

        <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Data Source</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            The category data and part names for this application comes from BrickArchitect.com and Rebrickable, which
            provides a comprehensive classification system for LEGO parts. The dataset includes:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-300">
            <li>{stats.totalParts.toLocaleString()} unique LEGO parts</li>
            <li>{stats.totalCategories} categories organized in a hierarchical structure</li>
            <li>{stats.topLevelCategories} top-level categories for broad classification</li>
            <li>
              {stats.uniqueImages.toLocaleString()} unique original images generated using{' '}
              <a
                href="https://github.com/jdlien/lbx-utils"
                className="text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-300 dark:hover:text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                jdlien/lbx-utils
              </a>{' '}
              using LDView
            </li>
          </ul>
        </section>

        <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>

        <section>
          <h2 className="mb-4 text-2xl font-bold">How to Use</h2>
          <p className="mb-2 text-gray-600 dark:text-gray-300">This application allows you to:</p>
          <ul className="list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-300">
            <li>Search for LEGO parts by name or part number</li>
            <li>Browse parts by category using the hierarchical classification system</li>

            <li>Organize your LEGO collection efficiently with clear labeling</li>
          </ul>
        </section>

        <div className="my-8 border-t border-gray-200 dark:border-gray-700"></div>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Technical Details</h2>
          <p className="mb-2 text-gray-600 dark:text-gray-300">This application is built with:</p>
          <ul className="list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-300">
            <li>Next.js for the React framework</li>
            <li>Tailwind CSS for styling</li>
            <li>Python scripts for data processing and preparation</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
