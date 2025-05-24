'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import Accordion, { AccordionItemDef } from '../components/Accordion' // Assuming Accordion.tsx is in ../components

// Basic type for a category, adjust as per your API response
interface Category {
  id: string
  name: string
  parent_id: string | null
  sort_order?: number
  parts_count: number
  children?: Category[] // Added for tree structure
}

// Header and Footer components are typically handled by app/layout.tsx
// No need for placeholders here if you have a global layout.

// Move this function outside the component to avoid dependency issues
const transformCategoriesToAccordionItems = (categories: Category[]): AccordionItemDef[] => {
  return categories.map((cat) => ({
    id: cat.id,
    title: (
      <div className="flex w-full items-center justify-between">
        <span>
          {cat.name}
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(ID: {cat.id})</span>
        </span>
        {cat.parts_count > 0 && (
          <NextLink
            href={`/?category=${cat.id}`}
            onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking badge/link
            className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
          >
            {cat.parts_count.toLocaleString()} parts
          </NextLink>
        )}
      </div>
    ),
    childrenItems:
      cat.children && cat.children.length > 0 ? transformCategoriesToAccordionItems(cat.children) : undefined,
  }))
}

export default function CategoriesPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('id')

  const [categoryTree, setCategoryTree] = useState<Record<string, Category>>({})
  const [topLevelCategories, setTopLevelCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoriesData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Failed to fetch categories: ${response.status} ${errorData.message || ''}`)
        }
        const data = await response.json()
        const fetchedCategories: Category[] = data.categories

        const tree: Record<string, Category> = {}
        const topLevel: Category[] = []

        fetchedCategories.forEach((cat) => {
          tree[cat.id] = { ...cat, children: [] }
        })

        fetchedCategories.forEach((cat) => {
          if (cat.parent_id && tree[cat.parent_id]) {
            tree[cat.parent_id].children?.push(tree[cat.id])
          } else if (!cat.parent_id) {
            topLevel.push(tree[cat.id])
          }
        })

        // Sort children within the tree by sort_order then name
        const sortChildren = (categories: Category[]) => {
          categories.forEach((cat) => {
            if (cat.children && cat.children.length > 0) {
              cat.children.sort((a, b) => {
                if (a.sort_order !== undefined && b.sort_order !== undefined) {
                  return (a.sort_order || 999) - (b.sort_order || 999)
                }
                return a.name.localeCompare(b.name)
              })
              sortChildren(cat.children) // Recursively sort deeper children
            }
          })
        }
        sortChildren(topLevel)

        topLevel.sort((a, b) => {
          if (a.sort_order !== undefined && b.sort_order !== undefined) {
            return (a.sort_order || 999) - (b.sort_order || 999)
          }
          return a.name.localeCompare(b.name)
        })

        setTopLevelCategories(topLevel)
        setCategoryTree(tree)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategoriesData()
  }, []) // Fetch once on mount

  const currentCategory = useMemo(() => {
    if (!categoryId || Object.keys(categoryTree).length === 0) return null
    return categoryTree[categoryId] || null
  }, [categoryId, categoryTree])

  const childCategoriesForGrid = useMemo(() => {
    if (!currentCategory || !currentCategory.children) return []
    return currentCategory.children
  }, [currentCategory])

  const accordionItems = useMemo(() => {
    if (isLoading || error || categoryId) return [] // Only show top-level accordion if no category selected
    return transformCategoriesToAccordionItems(topLevelCategories)
  }, [isLoading, error, categoryId, topLevelCategories])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {/* <Header /> */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-4 text-3xl font-bold">LEGO Categories</h1>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3">Loading categories...</p>
          </div>
        )}

        {error && (
          <div
            className="relative my-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="ml-2 block sm:inline">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {currentCategory && (
              <div className="mb-6 rounded-lg bg-blue-50 p-4 shadow dark:bg-blue-900/30">
                <h2 className="mb-2 text-2xl font-semibold text-blue-800 dark:text-blue-200">
                  {currentCategory.name}
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    (ID: {currentCategory.id})
                  </span>
                </h2>
                {currentCategory.parts_count > 0 && (
                  <NextLink
                    href={`/?category=${currentCategory.id}`}
                    className="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                  >
                    {currentCategory.parts_count.toLocaleString()} parts (includes subcategories)
                  </NextLink>
                )}
                <NextLink
                  href={`/?category=${currentCategory.id}`}
                  className="block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:ml-2 sm:inline-block dark:focus:ring-offset-gray-800"
                >
                  View All Parts in {currentCategory.name}
                </NextLink>
              </div>
            )}

            {categoryId ? (
              childCategoriesForGrid.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {childCategoriesForGrid.map((category) => (
                    <div
                      key={category.id}
                      className="overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg dark:bg-gray-800"
                    >
                      <div className="bg-blue-50 p-4 dark:bg-blue-900/40">
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {category.name}
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(ID: {category.id})</span>
                        </h3>
                        {category.parts_count > 0 && (
                          <NextLink
                            href={`/?category=${category.id}`}
                            className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
                          >
                            {category.parts_count.toLocaleString()} parts
                          </NextLink>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.children && category.children.length > 0
                            ? `${category.children.length} subcategories`
                            : 'No direct subcategories'}
                        </p>
                        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                          {category.children && category.children.length > 0 && (
                            <NextLink
                              href={`/categories?id=${category.id}`}
                              className="flex-1 rounded-md bg-blue-100 px-3 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-200 dark:bg-blue-800/60 dark:text-blue-400 dark:hover:bg-blue-700"
                            >
                              Subcategories
                            </NextLink>
                          )}
                          <NextLink
                            href={`/?category=${category.id}`}
                            className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                          >
                            View Parts
                          </NextLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-100 p-8 text-center shadow dark:bg-gray-800">
                  <h3 className="mb-4 text-xl font-semibold text-gray-600 dark:text-gray-400">
                    No subcategories found for {currentCategory?.name || 'this category'}.
                  </h3>
                  {currentCategory && (
                    <NextLink
                      href={`/?category=${currentCategory.id}`}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                    >
                      View Parts in {currentCategory.name}
                    </NextLink>
                  )}
                </div>
              )
            ) : (
              accordionItems.length > 0 && (
                <div>
                  <h2 className="mb-3 text-2xl font-semibold text-gray-700 dark:text-gray-200">
                    Browse All Categories
                  </h2>
                  <Accordion
                    items={accordionItems}
                    allowMultiple
                    defaultOpenIds={topLevelCategories.map((c) => c.id)}
                  />
                </div>
              )
            )}
          </>
        )}
      </main>
      {/* <Footer /> */}
    </div>
  )
}
