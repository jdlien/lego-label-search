import React from 'react'

export default function ThemeTestPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Theme & UI Test Page</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Use this page to test new UI components and themes in isolation.
      </p>
      <div className="flex gap-4">
        <button className="btn">Default Button</button>
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-danger">Danger Button</button>
      </div>
      <div className="flex gap-4">
        <button className="btn" disabled>
          Disabled Button
        </button>
        <button className="btn btn-primary" disabled>
          Primary Button
        </button>
        <button className="btn btn-danger" disabled>
          Danger Button
        </button>
      </div>
      <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-800">
        <span className="text-gray-500 dark:text-gray-400">Add more components here for testing...</span>
      </div>
    </div>
  )
}
