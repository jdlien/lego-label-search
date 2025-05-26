'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  className?: string
}

export default function Pagination({ currentPage, totalPages, hasNext, hasPrev, className = '' }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`/?${params.toString()}`)
  }

  // Generate page numbers to show for desktop
  const getDesktopPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Generate page numbers to show for mobile (more compact)
  const getMobilePageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 3) {
      // Show all pages if very few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page (unless it's the current page)
      if (currentPage !== 1) {
        pages.push(1)

        // Add ellipsis if there's a gap between first page and current
        if (currentPage > 2) {
          pages.push('...')
        }
      }

      // Always show current page
      pages.push(currentPage)

      // Add ellipsis if there's a gap between current and last page
      if (currentPage < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page (unless it's the current page)
      if (currentPage !== totalPages) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  const desktopPageNumbers = getDesktopPageNumbers()
  const mobilePageNumbers = getMobilePageNumbers()

  const renderPageNumbers = (pageNumbers: (number | string)[]) => (
    <div className="flex items-center space-x-1">
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-1 py-1 text-sm font-medium text-gray-500 sm:text-base dark:text-gray-400"
            >
              ...
            </span>
          )
        }

        const pageNum = page as number
        const isCurrentPage = pageNum === currentPage

        return (
          <button
            key={pageNum}
            onClick={() => navigateToPage(pageNum)}
            className={`min-w-8 rounded-md px-1 py-1 text-sm font-medium sm:text-base ${
              isCurrentPage
                ? 'border border-sky-500 bg-sky-500 text-white dark:border-sky-600 dark:bg-sky-600'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            } `}
            aria-label={`Go to page ${pageNum}`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {pageNum}
          </button>
        )
      })}
    </div>
  )

  return (
    <nav className={`flex items-center justify-center space-x-1 ${className}`} aria-label="Pagination">
      {/* Previous button */}
      <button
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={!hasPrev}
        className={`flex items-center justify-center rounded-md px-1 py-1 text-sm font-medium sm:text-base ${
          hasPrev
            ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            : 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
        } `}
        aria-label="Previous page"
      >
        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="">Prev</span>
      </button>

      {/* Desktop page numbers (hidden on mobile) */}
      <div className="hidden sm:block">{renderPageNumbers(desktopPageNumbers)}</div>

      {/* Mobile page numbers (hidden on desktop) */}
      <div className="block sm:hidden">{renderPageNumbers(mobilePageNumbers)}</div>

      {/* Next button */}
      <button
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={!hasNext}
        className={`flex items-center justify-center rounded-md px-1 py-1 text-sm font-medium sm:text-base ${
          hasNext
            ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            : 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500'
        } `}
        aria-label="Next page"
      >
        <span className="">Next</span>
        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
