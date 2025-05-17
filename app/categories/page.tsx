'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface BreadcrumbLink {
  id: string
  name: string
  href: string
}

// Header and Footer components are typically handled by app/layout.tsx
// No need for placeholders here if you have a global layout.

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('id')

  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [categoryTree, setCategoryTree] = useState<Record<string, Category>>({})
  const [topLevelCategories, setTopLevelCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbLink[]>([])

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

        setAllCategories(fetchedCategories)

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

  useEffect(() => {
    if (Object.keys(categoryTree).length === 0) return

    const newBreadcrumbs: BreadcrumbLink[] = [{ id: '', name: 'All Categories', href: '/categories' }]
    if (categoryId && categoryTree[categoryId]) {
      let current: Category | undefined = categoryTree[categoryId]
      const path: Category[] = []
      while (current) {
        path.unshift(current)
        current = current.parent_id ? categoryTree[current.parent_id] : undefined
      }
      path.forEach((cat) => {
        newBreadcrumbs.push({ id: cat.id, name: cat.name, href: `/categories?id=${cat.id}` })
      })
    }
    setBreadcrumbs(newBreadcrumbs)
  }, [categoryId, categoryTree])

  const currentCategory = useMemo(() => {
    if (!categoryId || Object.keys(categoryTree).length === 0) return null
    return categoryTree[categoryId] || null
  }, [categoryId, categoryTree])

  const childCategoriesForGrid = useMemo(() => {
    if (!currentCategory || !currentCategory.children) return []
    return currentCategory.children
  }, [currentCategory])

  const transformCategoriesToAccordionItems = (categories: Category[]): AccordionItemDef[] => {
    return categories.map((cat) => ({
      id: cat.id,
      title: (
        <div className="flex justify-between items-center w-full">
          <span>
            {cat.name}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(ID: {cat.id})</span>
          </span>
          {cat.parts_count > 0 && (
            <NextLink href={`/?category=${cat.id}`} passHref legacyBehavior>
              <a
                onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when clicking badge/link
                className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 rounded-full hover:bg-green-200 dark:hover:bg-green-600"
              >
                {cat.parts_count.toLocaleString()} parts
              </a>
            </NextLink>
          )}
        </div>
      ),
      childrenItems: cat.children ? transformCategoriesToAccordionItems(cat.children) : undefined,
    }))
  }

  const accordionItems = useMemo(() => {
    if (isLoading || error || categoryId) return [] // Only show top-level accordion if no category selected
    return transformCategoriesToAccordionItems(topLevelCategories)
  }, [isLoading, error, categoryId, topLevelCategories])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* <Header /> */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">LEGO Categories</h1>
          <nav aria-label="breadcrumb">
            <ol className="flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.id || 'home'} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  <NextLink
                    href={crumb.href}
                    className={`hover:underline ${
                      index === breadcrumbs.length - 1
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {crumb.name}
                  </NextLink>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3">Loading categories...</p>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-md relative my-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {currentCategory && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6 shadow">
                <h2 className="text-2xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  {currentCategory.name}
                  <span className="text-sm font-normal ml-2 text-gray-600 dark:text-gray-400">
                    (ID: {currentCategory.id})
                  </span>
                </h2>
                {currentCategory.parts_count > 0 && (
                  <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                    <a className="inline-block mb-2 px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 rounded-full hover:bg-green-200 dark:hover:bg-green-600">
                      {currentCategory.parts_count.toLocaleString()} parts (includes subcategories)
                    </a>
                  </NextLink>
                )}
                <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                  <a className="block sm:inline-block sm:ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    View All Parts in {currentCategory.name}
                  </a>
                </NextLink>
              </div>
            )}

            {categoryId ? (
              childCategoriesForGrid.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {childCategoriesForGrid.map((category) => (
                    <div
                      key={category.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/40">
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                          {category.name}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(ID: {category.id})</span>
                        </h3>
                        {category.parts_count > 0 && (
                          <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
                            <a className="mt-1 inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 rounded-full hover:bg-green-200 dark:hover:bg-green-600">
                              {category.parts_count.toLocaleString()} parts
                            </a>
                          </NextLink>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.children && category.children.length > 0
                            ? `${category.children.length} subcategories`
                            : 'No direct subcategories'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          {category.children && category.children.length > 0 && (
                            <NextLink href={`/categories?id=${category.id}`} passHref legacyBehavior>
                              <a className="flex-1 px-3 py-2 text-sm text-center font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/60 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700">
                                Subcategories
                              </a>
                            </NextLink>
                          )}
                          <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
                            <a className="flex-1 px-3 py-2 text-sm text-center font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                              View Parts
                            </a>
                          </NextLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center shadow">
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">
                    No subcategories found for {currentCategory?.name || 'this category'}.
                  </h3>
                  {currentCategory && (
                    <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                      <a className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                        View Parts in {currentCategory.name}
                      </a>
                    </NextLink>
                  )}
                </div>
              )
            ) : (
              accordionItems.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-gray-700 dark:text-gray-200">
                    Browse All Categories
                  </h2>
                  <Accordion
                    items={accordionItems}
                    allowMultiple
                    defaultOpenIds={topLevelCategories.slice(0, 3).map((c) => c.id)}
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
