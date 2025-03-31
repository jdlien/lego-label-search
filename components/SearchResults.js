/** @format */

import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Heading,
  Text,
  Card,
  CardBody,
  Stack,
  Badge,
  Checkbox,
  Button,
  Flex,
  useToast,
  LinkBox,
  LinkOverlay,
  Image,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'

// Simple brick icon for placeholders
const BrickIcon = (props) => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="1" y="1" width="38" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="10" cy="8" r="3" fill="currentColor" />
    <circle cx="20" cy="8" r="3" fill="currentColor" />
    <circle cx="30" cy="8" r="3" fill="currentColor" />
    <circle cx="10" cy="16" r="3" fill="currentColor" />
    <circle cx="20" cy="16" r="3" fill="currentColor" />
    <circle cx="30" cy="16" r="3" fill="currentColor" />
  </svg>
)

const PartCard = ({ part, isSelected, onToggleSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  // Dark mode values
  const cardBg = useColorModeValue('white', 'gray.700')
  const cardBorderColor = useColorModeValue(isSelected ? 'blue.400' : 'gray.200', isSelected ? 'blue.400' : 'gray.600')
  const cardSelectedBg = useColorModeValue('blue.50', 'blue.900')
  const headingColor = useColorModeValue('blue.700', 'blue.200')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const categoryTextColor = useColorModeValue('gray.500', 'gray.300')
  const placeholderIconColor = useColorModeValue('gray.400', 'gray.500')
  const loadingIconColor = useColorModeValue('gray.200', 'gray.600')
  const grandparentBadgeBg = useColorModeValue('gray.100', 'gray.600')
  const parentBadgeBg = useColorModeValue('gray.100', 'gray.600')
  const categoryBadgeBg = useColorModeValue('green.100', 'green.800')
  const badgeTextColor = useColorModeValue('gray.700', 'white')

  // Strip leading zeros for image filename (as mentioned, images aren't zero-padded)
  const normalizedPartId = part.id.replace(/^0+/, '')

  // Image paths for webp and png fallback
  const webpPath = `/data/images/${normalizedPartId}.webp`
  const pngPath = `/data/images/${normalizedPartId}.png`

  // Preload image without displaying it
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageError(true)
    img.src = pngPath

    return () => {
      // Clean up by removing event listeners when component unmounts
      img.onload = null
      img.onerror = null
    }
  }, [pngPath])

  // Handler for category badge clicks
  const handleCategoryClick = (e, categoryId, categoryName) => {
    e.preventDefault() // Prevent the card link from activating
    e.stopPropagation() // Prevent event bubbling

    // Navigate to category search without query parameter
    router.push(`/?category=${encodeURIComponent(categoryId)}`)
  }

  return (
    <LinkBox
      as={Card}
      borderWidth="1px"
      borderColor={cardBorderColor}
      bg={isSelected ? cardSelectedBg : cardBg}
      boxShadow="sm"
      borderRadius="md"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      position="relative"
      overflow="hidden"
      cursor="pointer"
      backgroundSize="20px 20px"
      width="100%"
      height="auto"
      minHeight="160px"
    >
      <Box position="absolute" top="0.5rem" right="0.5rem" zIndex="10">
        <Checkbox
          isChecked={isSelected}
          onChange={(e) => {
            e.preventDefault() // Prevent link navigation when clicking checkbox
            onToggleSelect(part.id)
          }}
          colorScheme="blue"
        />
      </Box>

      <CardBody padding="3" height="100%" display="flex" alignItems="center">
        <Flex direction="row" gap={3} width="100%">
          {/* Image container - fixed dimensions but preserving aspect ratio */}
          <Flex
            minWidth="70px"
            width="120px"
            height="70px"
            borderRadius="md"
            overflow="hidden"
            alignItems="center"
            justifyContent="center"
            position="relative"
            flexShrink={0}
            bg="white"
            border="1px solid"
            borderColor={useColorModeValue('gray.100', 'gray.600')}
          >
            {/* Only show image when it's successfully loaded */}
            {imageLoaded ? (
              <picture
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  backgroundColor: 'white',
                }}
              >
                <source srcSet={webpPath} type="image/webp" />
                <Image
                  src={pngPath}
                  alt={part.name}
                  maxHeight="100%"
                  maxWidth="100%"
                  objectFit="contain"
                  padding="4px"
                  bg="white"
                />
              </picture>
            ) : imageError ? (
              <Icon as={BrickIcon} boxSize="40px" color={placeholderIconColor} />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                <Icon as={BrickIcon} boxSize="40px" color={loadingIconColor} />
              </Box>
            )}
          </Flex>

          {/* Part details */}
          <Stack spacing={1} flex="1" overflow="hidden">
            <Flex align="center" justify="space-between">
              <NextLink href={`/part?id=${part.id}`} passHref>
                <LinkOverlay>
                  <Heading size="md" fontFamily="mono" color={headingColor} noOfLines={1}>
                    {part.id}
                  </Heading>
                </LinkOverlay>
              </NextLink>
            </Flex>

            <Text fontSize="md" fontWeight="medium" noOfLines={1} textOverflow="ellipsis" color={textColor}>
              {part.name}
            </Text>

            <Flex gap={2} flexWrap="wrap">
              {part.grandparent_category && part.grandparent_cat_id && (
                <Badge
                  colorScheme="gray"
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  onClick={(e) => handleCategoryClick(e, part.grandparent_cat_id, part.grandparent_category)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8, transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  role="button"
                  bg={grandparentBadgeBg}
                  color={badgeTextColor}
                >
                  {part.grandparent_category.length > 12
                    ? part.grandparent_category.substring(0, 12) + '...'
                    : part.grandparent_category}
                </Badge>
              )}
              {part.parent_category && part.parent_cat_id && (
                <Badge
                  colorScheme="gray"
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  onClick={(e) => handleCategoryClick(e, part.parent_cat_id, part.parent_category)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8, transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  role="button"
                  bg={parentBadgeBg}
                  color={badgeTextColor}
                >
                  {part.parent_category.length > 12
                    ? part.parent_category.substring(0, 12) + '...'
                    : part.parent_category}
                </Badge>
              )}
              <Badge
                colorScheme="green"
                alignSelf="flex-start"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                onClick={(e) => handleCategoryClick(e, part.ba_cat_id, part.ba_category_name)}
                cursor="pointer"
                _hover={{ opacity: 0.8, transform: 'translateY(-1px)' }}
                transition="all 0.2s"
                role="button"
                bg={categoryBadgeBg}
                color={badgeTextColor}
              >
                {part.ba_category_name || part.category_name}
              </Badge>
            </Flex>

            {/* Original part category information */}
            {part.category_name && (
              <Text color={categoryTextColor} fontSize="xs" mt={1}>
                {part.category_name}
              </Text>
            )}
          </Stack>
        </Flex>
      </CardBody>
    </LinkBox>
  )
}

const SearchResults = ({ results = [], totalResults = 0 }) => {
  const [selectedParts, setSelectedParts] = useState({})
  const toast = useToast()
  const router = useRouter()

  const textColor = useColorModeValue('gray.600', 'gray.300')
  const buttonBorderColor = useColorModeValue('gray.200', 'gray.600')
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700')

  const handleToggleSelect = (partId) => {
    setSelectedParts((prev) => {
      const newSelected = { ...prev }
      if (newSelected[partId]) {
        delete newSelected[partId]
      } else {
        newSelected[partId] = true
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    const newSelected = {}
    results.forEach((part) => {
      newSelected[part.id] = true
    })
    setSelectedParts(newSelected)
  }

  const handleClearSelection = () => {
    setSelectedParts({})
  }

  const handlePrint = () => {
    const selectedCount = Object.keys(selectedParts).length
    if (selectedCount === 0) {
      toast({
        title: 'No parts selected',
        description: 'Please select at least one part to print.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Navigate to print page with selected part IDs
    const selectedPartIds = Object.keys(selectedParts)
    router.push(`/print?ids=${selectedPartIds.join(',')}`)
  }

  if (results.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Heading as="h3" size="md" color="gray.500">
          No results found
        </Heading>
      </Box>
    )
  }

  const selectedCount = Object.keys(selectedParts).length

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text color={textColor}>
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </Text>

        <Flex gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            borderColor={buttonBorderColor}
            _hover={{ bg: buttonHoverBg }}
          >
            Select All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSelection}
            isDisabled={selectedCount === 0}
            borderColor={buttonBorderColor}
            _hover={{ bg: buttonHoverBg }}
          >
            Clear
          </Button>
          <Button size="sm" colorScheme="blue" onClick={handlePrint} isDisabled={selectedCount === 0}>
            Print {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </Flex>
      </Flex>

      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          sm: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(3, 1fr)',
        }}
        gap={4}
        mx="auto"
      >
        {results.map((part) => (
          <Box key={part.id} width="100%" maxWidth="450px" minWidth={{ md: '380px' }} mx="auto">
            <PartCard part={part} isSelected={!!selectedParts[part.id]} onToggleSelect={handleToggleSelect} />
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

export default SearchResults
