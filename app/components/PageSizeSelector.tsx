'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PageSizeSelectorProps {
  className?: string
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500]

export default function PageSizeSelector({ className = '' }: PageSizeSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current page size from URL params, default to 50
  const currentPageSize = parseInt(searchParams.get('limit') || '50', 10)

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString())

    // Reset to page 1 when changing page size
    params.delete('page')

    if (newPageSize === 50) {
      // 50 is the default, so remove the limit param
      params.delete('limit')
    } else {
      params.set('limit', newPageSize.toString())
    }

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <select
        value={currentPageSize}
        onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:border-gray-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:focus:border-sky-400"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-600 dark:text-gray-300">per page</span>
    </div>
  )
}
