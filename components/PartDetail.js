/** @format */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  Badge,
  Divider,
  Button,
  Flex,
  Spacer,
  VStack,
  useColorModeValue,
  Image,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { ArrowBackIcon, StarIcon, DownloadIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/router'

const PartDetail = ({ part, isLoading, error }) => {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [categoryPath, setCategoryPath] = useState([])

  // Fetch category path when part data is available
  useEffect(() => {
    if (part?.ba_cat_id) {
      const fetchCategoryPath = async () => {
        try {
          const response = await fetch(`/api/categories/path?id=${part.ba_cat_id}`)
          if (response.ok) {
            const data = await response.json()
            setCategoryPath(data.path || [])
          }
        } catch (error) {
          console.error('Error fetching category path:', error)
        }
      }

      fetchCategoryPath()
    }
  }, [part?.ba_cat_id])

  if (isLoading) {
    return (
      <Box textAlign="center" p={8}>
        <Spinner size="xl" />
        <Text mt={4}>Loading part details...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Error loading part details: {error}
      </Alert>
    )
  }

  if (!part) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        Part not found
      </Alert>
    )
  }

  // Get the display name (prioritize ba_name, fall back to name)
  const displayName = part.ba_name || part.name

  // Get the category name (prioritize ba_category_name, fall back to category_name)
  const displayCategory = part.ba_category_name || part.category_name

  // Strip leading zeros for image filename (needed for image path)
  const normalizedPartId = part?.id ? part.id.replace(/^0+/, '') : ''

  // Image path - updated to use public directory
  const imagePath = `/data/images/${normalizedPartId}.png`

  // Handle category click for navigation
  const handleCategoryClick = (catId) => {
    router.push(`/?category=${catId}`)
  }

  return (
    <Box bg={bgColor} borderRadius="lg" boxShadow="md" borderWidth="1px" borderColor={borderColor} p={5} mb={6}>
      <Flex mb={4} align="center">
        <Button leftIcon={<ArrowBackIcon />} variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <Spacer />
        <Button
          rightIcon={<DownloadIcon />}
          colorScheme="blue"
          size="sm"
          onClick={() => {
            // Logic to add to print queue could be added here
            alert(`Added ${displayName} to print queue`)
          }}
        >
          Print Label
        </Button>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
        <Box minW={{ base: 'full', md: '300px' }}>
          {/* Part image container - 50% larger and white background */}
          <Box
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            height="300px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <Image
              src={imagePath}
              alt={displayName}
              maxHeight="100%"
              maxWidth="100%"
              objectFit="contain"
              padding="8px"
              fallback={
                <Text fontSize="xl" color="gray.500">
                  {part.id}
                </Text>
              }
            />
          </Box>
        </Box>

        <VStack align="stretch" spacing={4} flex="1">
          <Box>
            <Heading size="lg">{part.ba_name || part.name}</Heading>
            {part.ba_name && part.name && part.ba_name !== part.name && (
              <Text color="gray.600" fontSize="md" mt={1}>
                ({part.name})
              </Text>
            )}
          </Box>

          <HStack>
            <Badge colorScheme="blue" fontSize="md" px={2} borderRadius="md">
              {part.id}
            </Badge>
            {part.year && (
              <Badge colorScheme="green" fontSize="md" px={2} borderRadius="md">
                {part.year}
              </Badge>
            )}
          </HStack>

          <Divider />

          <Box>
            <Heading size="sm" mb={2}>
              Category
            </Heading>
            <VStack align="stretch" spacing={2}>
              {/* Display both category types */}
              {part.category_name && (
                <Flex alignItems="center" mb={1}>
                  <Text fontWeight="medium" mr={2}></Text>
                  <Badge colorScheme="purple" fontSize="md" px={2} py={1} borderRadius="md">
                    {part.category_name}
                  </Badge>
                </Flex>
              )}

              {/* Breadcrumb-style category path */}
              {categoryPath.length > 0 ? (
                <Flex flexDirection="column">
                  <Text fontWeight="medium" mb={1}>
                    BrickArchitect Category:
                  </Text>
                  <Flex flexWrap="wrap" gap={2}>
                    {categoryPath.map((cat, index) => (
                      <React.Fragment key={cat.id}>
                        {index > 0 && <Text color="gray.500">›</Text>}
                        <Badge
                          colorScheme={index === categoryPath.length - 1 ? 'blue' : 'gray'}
                          cursor="pointer"
                          onClick={() => handleCategoryClick(cat.id)}
                          p={2}
                          borderRadius="md"
                          _hover={{ bg: index === categoryPath.length - 1 ? 'blue.100' : 'gray.100' }}
                        >
                          {cat.name}
                        </Badge>
                      </React.Fragment>
                    ))}
                  </Flex>
                </Flex>
              ) : (
                part.ba_cat_id && (
                  <Flex alignItems="center">
                    <Text fontWeight="medium" mr={2}>
                      BrickArk Category:
                    </Text>
                    <Badge
                      colorScheme="blue"
                      cursor="pointer"
                      onClick={() => handleCategoryClick(part.ba_cat_id)}
                      p={2}
                      borderRadius="md"
                    >
                      {displayCategory || 'Unknown Category'}
                    </Badge>
                  </Flex>
                )
              )}

              {!part.category_name && !part.ba_cat_id && (
                <Text fontSize="sm" color="gray.500">
                  No categories assigned
                </Text>
              )}
            </VStack>
          </Box>

          {part.description && (
            <Box>
              <Heading size="sm" mb={2}>
                Description
              </Heading>
              <Text>{part.description}</Text>
            </Box>
          )}

          {part.alternateIds && part.alternateIds.length > 0 && (
            <Box>
              <Heading size="sm" mb={2}>
                Alternate IDs
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                {part.alternateIds.map((id, index) => (
                  <Badge key={index} colorScheme="gray" p={1} borderRadius="md">
                    {id}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </Flex>
    </Box>
  )
}

export default PartDetail
