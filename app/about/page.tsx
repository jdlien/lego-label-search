import React from 'react'

export default function About() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-4">About LEGO Part Label Search</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            This application helps LEGO enthusiasts create and print labels for organizing their parts collection.
            Developed by JD Lien. Source code available at{' '}
            <a
              href="https://github.com/jdlien/lego-label-search"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/jdlien/lego-label-search
            </a>
            .
          </p>
        </section>

        <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Source</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            The category data and part names for this application comes from the Brick Architect website, which provides
            a comprehensive classification system for LEGO parts. The dataset includes:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-600 dark:text-gray-300">
            <li>2,423 unique LEGO parts</li>
            <li>191 categories organized in a hierarchical structure</li>
            <li>14 top-level categories for broad classification</li>
            <li>
              Over 21,000 original images generated using{' '}
              <a
                href="https://github.com/jdlien/lbx-utils"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                jdlien/lbx-utils
              </a>{' '}
              using LDView
            </li>
          </ul>
        </section>

        <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

        <section>
          <h2 className="text-2xl font-bold mb-4">How to Use</h2>
          <p className="mb-2 text-gray-600 dark:text-gray-300">This application allows you to:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Search for LEGO parts by name or part number</li>
            <li>Browse parts by category using the hierarchical classification system</li>
            <li>
              For many parts, you can download a printable label in 12mm or 24mm size (courtesy of BrickArchitect.com)
            </li>
            <li>Organize your LEGO collection efficiently with clear labeling</li>
          </ul>
        </section>

        <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>

        <section>
          <h2 className="text-2xl font-bold mb-4">Technical Details</h2>
          <p className="mb-2 text-gray-600 dark:text-gray-300">This application is built with:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Next.js for the React framework</li>
            <li>Tailwind CSS for styling</li>
            <li>Python scripts for data processing and preparation</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
