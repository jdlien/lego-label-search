/** @format */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  Badge,
  Divider,
  Flex,
  VStack,
  useColorModeValue,
  Image,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'

const PartDetail = ({ part, isLoading, error, isInModal = false }) => {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [categoryPath, setCategoryPath] = useState([])

  // Image state with WebP and PNG fallback
  const normalizedPartId = part?.id ? part.id.replace(/^0+/, '') : ''
  const webpPath = `/data/images/${normalizedPartId}.webp`
  const pngPath = `/data/images/${normalizedPartId}.png`
  const [imageSrc, setImageSrc] = useState(webpPath)

  // Handle image error by switching to PNG
  const handleImageError = () => {
    if (imageSrc === webpPath) {
      setImageSrc(pngPath)
    }
  }

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

  // Handle category click for navigation
  const handleCategoryClick = (catId) => {
    if (isInModal) {
      // In modal mode, we need to close the modal before navigation
      // The router.push will be handled after the modal closes via useEffect
      // We can't directly access onClose here, so we'll use the URL
      router.push(`/?category=${catId}`)
    } else {
      router.push(`/?category=${catId}`)
    }
  }

  return (
    <Box
      bg={bgColor}
      borderRadius={isInModal ? 'none' : 'lg'}
      boxShadow={isInModal ? 'none' : 'md'}
      borderWidth={isInModal ? '0' : '1px'}
      borderColor={borderColor}
      p={isInModal ? { base: 0, md: 4 } : 5}
      mb={isInModal ? 0 : 6}
    >
      <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 6 }} align="start">
        <Box minW={{ base: 'full', md: '300px' }} maxW={{ base: 'full', md: '300px' }}>
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
            mx={isInModal ? 'auto' : '0'}
          >
            <Image
              src={imageSrc}
              alt={displayName}
              maxHeight="100%"
              maxWidth="100%"
              objectFit="contain"
              padding="8px"
              onError={handleImageError}
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
            <Heading size="lg" mb={2}>
              {part.ba_name || part.name}
            </Heading>
            {part.ba_name && part.name && part.ba_name !== part.name && (
              <Box>
                <Heading size="sm">Rebrickable Name</Heading>
                <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="md" mt={1}>
                  {part.name}
                </Text>
              </Box>
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
              Rebrickable Category <span style={{ fontWeight: 'normal' }}>&nbsp;{part.category_id}</span>
            </Heading>
            <VStack align="stretch" spacing={2}>
              {/* Display both category types */}
              {part.category_name && (
                <Flex alignItems="center" mb={1}>
                  <Badge colorScheme="purple" p={1} borderRadius="md">
                    {part.category_name}
                  </Badge>
                </Flex>
              )}

              {/* Breadcrumb-style category path */}
              {categoryPath.length > 0 ? (
                <Flex flexDirection="column">
                  <Heading size="sm" mb={2} pt={2}>
                    BrickArchitect Category <span style={{ fontWeight: 'normal' }}>&nbsp;{part.ba_cat_id}</span>
                  </Heading>
                  <Flex flexWrap="wrap" gap={2}>
                    {categoryPath.map((cat, index) => (
                      <React.Fragment key={cat.id}>
                        {index > 0 && <Text color="gray.500">›</Text>}
                        <Badge
                          colorScheme={index === categoryPath.length - 1 ? 'blue' : 'gray'}
                          cursor="pointer"
                          onClick={() => handleCategoryClick(cat.id)}
                          p={1}
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

              {/* Material */}
              {part.part_material && (
                <Box>
                  <Heading size="sm" mb={2} pt={2}>
                    Material
                  </Heading>
                  <Flex alignItems="center" mb={1}>
                    <Badge colorScheme="green" p={1} borderRadius="md">
                      {part.part_material}
                    </Badge>
                  </Flex>
                </Box>
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
