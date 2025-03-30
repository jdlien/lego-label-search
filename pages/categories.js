/** @format */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Badge,
  Flex,
  Center,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  List,
  ListItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import Header from '../components/Header'

export default function Categories() {
  const router = useRouter()
  const { id: categoryId } = router.query

  const [allCategories, setAllCategories] = useState([])
  const [categoryTree, setCategoryTree] = useState({})
  const [topLevelCategories, setTopLevelCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])

  // Fetch all categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('Fetching categories...')
        const response = await fetch('/api/categories')

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error response:', response.status, errorData)
          throw new Error(`Failed to fetch categories: ${response.status} ${errorData.message || ''}`)
        }

        const data = await response.json()
        console.log(`Received ${data.categories?.length || 0} categories from API`)
        setAllCategories(data.categories)

        // Organize categories into a tree structure
        const tree = {}
        const topLevel = []

        // First, map all categories by ID for easy reference
        data.categories.forEach((cat) => {
          // Ensure IDs are consistently handled as strings
          const id = String(cat.id)
          const parentId = cat.parent_id ? String(cat.parent_id) : ''

          tree[id] = {
            ...cat,
            id,
            parent_id: parentId,
            children: [],
          }
        })

        // Now build the tree structure
        data.categories.forEach((cat) => {
          const id = String(cat.id)
          const parentId = cat.parent_id ? String(cat.parent_id) : ''

          // If it has a parent, add it as a child to that parent
          if (parentId && tree[parentId]) {
            tree[parentId].children.push(tree[id])
          }
          // If it's a top-level category (no parent)
          else if (!parentId || parentId === '') {
            topLevel.push(tree[id])
          }
        })

        // Sort top level categories by ID
        topLevel.sort((a, b) => {
          // Try to convert to numbers first for proper numeric sorting
          const aId = parseInt(a.id)
          const bId = parseInt(b.id)
          return aId - bId
        })

        console.log(`Found ${topLevel.length} top-level categories`)
        setTopLevelCategories(topLevel)
        setCategoryTree(tree)

        // Setup breadcrumbs based on the selected category
        if (categoryId && tree[String(categoryId)]) {
          const crumbs = [{ id: '', name: 'All Categories' }]

          // Build the breadcrumb path
          let current = tree[String(categoryId)]
          const path = [current]

          // Walk up the parent chain
          while (current.parent_id && tree[current.parent_id]) {
            current = tree[current.parent_id]
            path.unshift(current)
          }

          // Add all ancestors to breadcrumbs
          path.forEach((cat) => {
            crumbs.push({ id: cat.id, name: cat.name })
          })

          setBreadcrumbs(crumbs)
        } else {
          setBreadcrumbs([{ id: '', name: 'All Categories' }])
        }
      } catch (err) {
        console.error('Categories error:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (router.isReady) {
      fetchCategories()
    }
  }, [router.isReady])

  // Recursive component to render a category and its children
  const CategoryItem = ({ category }) => {
    const hasChildren = category.children && category.children.length > 0

    return (
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              {category.name}
            </Box>
            {hasChildren && <AccordionIcon />}
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <Flex gap={2} mb={3}>
            <NextLink href={`/categories?id=${category.id}`} passHref legacyBehavior>
              <Button as="a" variant="outline" colorScheme="blue" size="sm">
                View Category
              </Button>
            </NextLink>
            <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
              <Button as="a" colorScheme="blue" size="sm">
                View Parts
              </Button>
            </NextLink>
          </Flex>

          {hasChildren && (
            <>
              <Text fontSize="xs" color="gray.500" mb={3}>
                Parts view includes all subcategories
              </Text>

              <Accordion allowMultiple>
                {category.children
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((child) => (
                    <CategoryItem key={child.id} category={child} />
                  ))}
              </Accordion>
            </>
          )}
        </AccordionPanel>
      </AccordionItem>
    )
  }

  // Function to get the current category based on ID
  const getCurrentCategory = () => {
    if (!categoryId || !categoryTree[String(categoryId)]) return null
    return categoryTree[String(categoryId)]
  }

  // Get children categories for the current category
  const getChildCategories = () => {
    if (!categoryId || !categoryTree[String(categoryId)]) return []
    return categoryTree[String(categoryId)].children || []
  }

  const currentCategory = getCurrentCategory()
  const childCategories = getChildCategories()

  return (
    <Box minH="100vh" bg="gray.50">
      <Header />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box mb={4}>
            <Heading as="h1" size="xl" mb={4}>
              LEGO Categories
            </Heading>

            <Breadcrumb separator="›">
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index}>
                  <BreadcrumbLink
                    as={NextLink}
                    href={crumb.id ? `/categories?id=${crumb.id}` : '/categories'}
                    color={index === breadcrumbs.length - 1 ? 'blue.500' : 'gray.500'}
                    fontWeight={index === breadcrumbs.length - 1 ? 'semibold' : 'normal'}
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
          </Box>

          {/* Loading State */}
          {isLoading && (
            <Center py={10}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
          )}

          {/* Error State */}
          {error && (
            <Box bg="red.50" color="red.500" p={4} borderRadius="md" borderWidth="1px" borderColor="red.200">
              <Heading as="h3" size="md" mb={2}>
                Error Loading Categories
              </Heading>
              <Text>{error}</Text>
            </Box>
          )}

          {/* Current Category Info */}
          {currentCategory && !isLoading && (
            <Box bg="blue.50" p={4} borderRadius="md" mb={4}>
              <Heading as="h2" size="lg" mb={2}>
                {currentCategory.name}
              </Heading>
              <Flex gap={2}>
                <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                  <Button as="a" colorScheme="blue" size="sm">
                    View All Parts
                  </Button>
                </NextLink>
                <Text fontSize="sm" mt={1} color="gray.600">
                  (includes all subcategories)
                </Text>
              </Flex>
            </Box>
          )}

          {/* Categories Display */}
          {!isLoading && !error && (
            <>
              {categoryId ? (
                /* If a category is selected, show its children */
                childCategories.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                    {childCategories
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((category) => (
                        <Card
                          key={category.id}
                          borderRadius="md"
                          overflow="hidden"
                          boxShadow="sm"
                          transition="all 0.2s"
                          _hover={{ boxShadow: 'md' }}
                        >
                          <CardHeader bg="blue.50" py={3}>
                            <Heading size="sm">{category.name}</Heading>
                          </CardHeader>

                          <CardBody>
                            <Flex direction="column" height="100%">
                              <Text fontSize="sm" color="gray.600" mb={4}>
                                Category ID: {category.id}
                              </Text>
                              {category.children && category.children.length > 0 && (
                                <Text fontSize="sm" color="gray.600">
                                  {category.children.length} subcategories
                                </Text>
                              )}
                            </Flex>
                          </CardBody>

                          <CardFooter pt={0}>
                            <Flex gap={2} w="100%">
                              {category.children && category.children.length > 0 && (
                                <NextLink href={`/categories?id=${category.id}`} passHref legacyBehavior>
                                  <Button as="a" variant="outline" colorScheme="blue" size="sm" flex={1}>
                                    Subcategories
                                  </Button>
                                </NextLink>
                              )}

                              <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
                                <Button as="a" colorScheme="blue" size="sm" flex={1}>
                                  View Parts
                                </Button>
                              </NextLink>
                            </Flex>
                            {category.children && category.children.length > 0 && (
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Parts view includes all subcategories
                              </Text>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                  </SimpleGrid>
                ) : (
                  <Box bg="gray.50" p={8} borderRadius="md" textAlign="center">
                    <Heading as="h3" size="md" color="gray.500" mb={4}>
                      No subcategories found
                    </Heading>
                    <NextLink href={`/?category=${categoryId}`} passHref legacyBehavior>
                      <Button as="a" colorScheme="blue">
                        View Parts in this Category
                      </Button>
                    </NextLink>
                  </Box>
                )
              ) : (
                /* Show the full category tree view */
                <Box>
                  <Heading as="h2" size="md" mb={4}>
                    Category Tree
                  </Heading>
                  <Accordion allowMultiple>
                    {topLevelCategories.map((category) => (
                      <CategoryItem key={category.id} category={category} />
                    ))}
                  </Accordion>
                </Box>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
