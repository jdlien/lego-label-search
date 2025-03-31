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
  useColorModeValue,
} from '@chakra-ui/react'
import Header from '../components/Header'

export default function Categories() {
  const router = useRouter()
  const { id: categoryId } = router.query
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')

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

        // Sort top level categories by sort_order
        topLevel.sort((a, b) => {
          // Use sort_order if available
          return (a.sort_order || 999) - (b.sort_order || 999)
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
              <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                (ID: {category.id})
              </Text>
              {category.parts_count > 0 && (
                <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
                  <Badge as="a" colorScheme="green" ml={2} fontSize="xs" cursor="pointer">
                    {category.parts_count.toLocaleString()} parts
                  </Badge>
                </NextLink>
              )}
            </Box>
            {hasChildren && <AccordionIcon />}
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          {hasChildren && (
            <>
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={3}>
                Parts view includes all subcategories
              </Text>

              <Accordion allowMultiple>
                {category.children
                  .sort((a, b) => {
                    // First compare by sort_order if available
                    if (a.sort_order && b.sort_order) {
                      return a.sort_order - b.sort_order
                    }
                    // Fall back to name comparison
                    return a.name.localeCompare(b.name)
                  })
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
    <Box minH="100vh" bg={pageBg}>
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
                    color={
                      index === breadcrumbs.length - 1
                        ? useColorModeValue('blue.500', 'blue.300')
                        : useColorModeValue('gray.500', 'gray.400')
                    }
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
            <Box
              bg={useColorModeValue('red.50', 'red.900')}
              color={useColorModeValue('red.500', 'red.200')}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={useColorModeValue('red.200', 'red.700')}
            >
              <Heading as="h3" size="md" mb={2}>
                Error Loading Categories
              </Heading>
              <Text>{error}</Text>
            </Box>
          )}

          {/* Current Category Info */}
          {currentCategory && !isLoading && (
            <Box bg={useColorModeValue('blue.50', 'blue.900')} p={4} borderRadius="md" mb={4}>
              <Heading as="h2" size="lg" mb={2}>
                {currentCategory.name}
                <Text as="span" fontSize="md" fontWeight="normal" ml={2} color={textColor}>
                  (ID: {currentCategory.id})
                </Text>
                {currentCategory.parts_count > 0 && (
                  <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                    <Badge as="a" colorScheme="green" ml={2} fontSize="sm" cursor="pointer">
                      {currentCategory.parts_count.toLocaleString()} parts
                    </Badge>
                  </NextLink>
                )}
              </Heading>
              <Flex gap={2}>
                <NextLink href={`/?category=${currentCategory.id}`} passHref legacyBehavior>
                  <Button as="a" colorScheme="blue" size="sm">
                    View All Parts
                  </Button>
                </NextLink>
                <Text fontSize="sm" mt={1} color={textColor}>
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
                      .sort((a, b) => {
                        // First compare by sort_order if available
                        if (a.sort_order && b.sort_order) {
                          return a.sort_order - b.sort_order
                        }
                        // Fall back to name comparison
                        return a.name.localeCompare(b.name)
                      })
                      .map((category) => (
                        <Card
                          key={category.id}
                          borderRadius="md"
                          overflow="hidden"
                          boxShadow="sm"
                          transition="all 0.2s"
                          _hover={{ boxShadow: 'md' }}
                        >
                          <CardHeader bg={useColorModeValue('blue.50', 'blue.900')} py={3}>
                            <Heading size="sm">
                              {category.name}
                              <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                                (ID: {category.id})
                              </Text>
                              {category.parts_count > 0 && (
                                <NextLink href={`/?category=${category.id}`} passHref legacyBehavior>
                                  <Badge as="a" colorScheme="green" mt={1} fontSize="xs" cursor="pointer">
                                    {category.parts_count.toLocaleString()} parts
                                  </Badge>
                                </NextLink>
                              )}
                            </Heading>
                          </CardHeader>

                          <CardBody>
                            <Flex direction="column" height="100%">
                              <Text fontSize="sm" color={textColor} mb={4}>
                                Category ID: {category.id}
                              </Text>
                              {category.children && category.children.length > 0 && (
                                <Text fontSize="sm" color={textColor}>
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
                              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mt={1}>
                                Parts view includes all subcategories
                              </Text>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                  </SimpleGrid>
                ) : (
                  <Box bg={useColorModeValue('gray.50', 'gray.800')} p={8} borderRadius="md" textAlign="center">
                    <Heading as="h3" size="md" color={useColorModeValue('gray.500', 'gray.400')} mb={4}>
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
                  <Heading as="h2" size="md" mb={4} color={useColorModeValue('gray.800', 'gray.200')}>
                    Category Tree (Properly Ordered)
                  </Heading>
                  <Text fontSize="sm" color={textColor} mb={4}>
                    Categories are displayed in a logical order matching their numbering system
                  </Text>
                  <Accordion
                    allowMultiple
                    defaultIndex={Array.from({ length: topLevelCategories.length }, (_, i) => i)}
                  >
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
