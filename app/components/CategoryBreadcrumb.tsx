'use client'

import React from 'react'

type CategoryItem = {
  /** Category ID for navigation */
  id?: string | null
  /** Display name of the category */
  name?: string | null
  /** Color variant for the badge */
  variant?: 'gray' | 'sky' | 'purple'
}

type CategoryBreadcrumbProps = {
  /** Array of category items to display in order */
  categories: (CategoryItem | null | undefined)[]
  /** Callback when a category is clicked */
  onNavigate?: (categoryId: string) => void
  /** Separator between categories */
  separator?: React.ReactNode
}

const variantStyles = {
  gray: {
    base: 'bg-gray-200/80 text-gray-950 dark:bg-gray-600/80 dark:text-gray-200',
    hover: 'hover:bg-gray-300/80 dark:hover:bg-gray-500/80',
  },
  sky: {
    base: 'bg-sky-300/80 text-sky-950 dark:bg-sky-800/80 dark:text-sky-200',
    hover: 'hover:bg-sky-400/80 dark:hover:bg-sky-700/80',
  },
  purple: {
    base: 'bg-purple-300/80 text-purple-950 dark:bg-purple-800/80 dark:text-purple-200',
    hover: 'hover:bg-purple-400/80 dark:hover:bg-purple-700/80',
  },
}

/**
 * Displays a breadcrumb-style category hierarchy with clickable badges.
 *
 * Categories are displayed in order with separators between them.
 * Each category badge can be clicked to navigate to that category's page.
 *
 * @example
 * ```tsx
 * <CategoryBreadcrumb
 *   categories={[
 *     { id: '1', name: 'Basic', variant: 'gray' },
 *     { id: '2', name: 'Brick', variant: 'gray' },
 *     { id: '3', name: '2× Brick', variant: 'sky' },
 *   ]}
 *   onNavigate={(id) => router.push(`/?category=${id}`)}
 * />
 * ```
 */
export default function CategoryBreadcrumb({
  categories,
  onNavigate,
  separator = <span className="px-1 text-gray-400 dark:text-gray-400">→</span>,
}: CategoryBreadcrumbProps) {
  // Filter out null/undefined categories and those without names
  const validCategories = categories.filter(
    (cat): cat is CategoryItem => cat != null && cat.name != null
  )

  if (validCategories.length === 0) {
    return null
  }

  const handleClick = (categoryId: string | null | undefined) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (categoryId && onNavigate) {
      onNavigate(categoryId)
    }
  }

  return (
    <div className="space-y-1">
      {validCategories.map((category, index) => {
        const variant = category.variant || 'gray'
        const styles = variantStyles[variant]
        const isClickable = !!category.id && !!onNavigate

        return (
          <React.Fragment key={category.id || index}>
            <button
              onClick={isClickable ? handleClick(category.id) : undefined}
              disabled={!isClickable}
              className={`rounded-sm px-2 py-0.5 ${styles.base} ${
                isClickable ? `cursor-pointer transition-colors ${styles.hover}` : 'cursor-default'
              }`}
            >
              {category.name}
            </button>
            {index < validCategories.length - 1 && separator}
          </React.Fragment>
        )
      })}
    </div>
  )
}
