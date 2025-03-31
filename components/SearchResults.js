/** @format */

import { useState } from 'react'
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
    <circle cx="10" cy="8" r="3" fill="currentColor" />
    <circle cx="20" cy="8" r="3" fill="currentColor" />
    <circle cx="30" cy="8" r="3" fill="currentColor" />
    <circle cx="10" cy="16" r="3" fill="currentColor" />
    <circle cx="20" cy="16" r="3" fill="currentColor" />
    <circle cx="30" cy="16" r="3" fill="currentColor" />
  </svg>
)

// Simple download icon
const DownloadIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 16L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 12L12 17L17 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PartCard = ({ part, isSelected, onToggleSelect }) => {
  const router = useRouter()
  const toast = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [labelExists, setLabelExists] = useState(null)

  // Colors for light/dark mode
  const cardBg = useColorModeValue('white', 'gray.700')
  const cardBorderColor = useColorModeValue(isSelected ? 'blue.400' : 'gray.200', isSelected ? 'blue.400' : 'gray.600')
  const cardSelectedBg = useColorModeValue('blue.50', 'blue.900')
  const headingColor = useColorModeValue('blue.700', 'blue.200')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const categoryTextColor = useColorModeValue('gray.500', 'gray.300')
  const placeholderIconColor = useColorModeValue('gray.400', 'gray.500')
  const grandparentBadgeBg = useColorModeValue('gray.100', 'gray.600')
  const parentBadgeBg = useColorModeValue('gray.100', 'gray.600')
  const categoryBadgeBg = useColorModeValue('green.100', 'green.800')
  const badgeTextColor = useColorModeValue('gray.700', 'white')
  const linkColor = useColorModeValue('blue.500', 'blue.300')
  const linkHoverColor = useColorModeValue('blue.600', 'blue.200')
  const linkSpacing = useColorModeValue('gray.200', 'gray.600')

  // Strip leading zeros for image filename
  const normalizedPartId = part.id.replace(/^0+/, '')

  // Image paths
  const pngPath = `/api/images/${normalizedPartId}.png`

  // Handler for category badge clicks
  const handleCategoryClick = (e, categoryId) => {
    e.preventDefault()
    e.stopPropagation()

    // Navigate to homepage with only the category parameter
    // This will clear any existing search query
    router.push({
      pathname: '/',
      query: { category: categoryId },
    })
  }

  // Handler for label download
  const handleLabelDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/download-label?part_num=${part.id}`)
      const data = await response.json()

      if (data.success) {
        // Start the download
        window.location.href = `/data/labels/${part.id}.lbx`
      } else {
        setLabelExists(false)
        toast({
          title: 'Label not available',
          description: 'This part does not have a label available on Brick Architect.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error downloading label:', error)
      toast({
        title: 'Download failed',
        description: 'There was an error downloading the label.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handler for 24mm label download
  const handle24mmLabelDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isConverting) return

    setIsConverting(true)
    try {
      // First, ensure the original label exists
      const downloadResponse = await fetch(`/api/download-label?part_num=${part.id}`)
      const downloadData = await downloadResponse.json()

      if (!downloadData.success) {
        setLabelExists(false)
        toast({
          title: 'Label not available',
          description: 'The original label is not available for conversion.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        setIsConverting(false)
        return
      }

      // Add a small delay to ensure the file is fully written to disk
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Now try to convert the label
      const response = await fetch(`/api/convert-label?part_num=${part.id}`)
      const data = await response.json()

      if (data.success) {
        // Start the download
        window.location.href = `/data/labels/${part.id}-24mm.lbx`
      } else {
        // Check if the error message contains a SyntaxWarning about escape sequences
        const isEscapeSequenceWarning = data.message && data.message.includes('SyntaxWarning: invalid escape sequence')

        if (isEscapeSequenceWarning) {
          // Try one more time - the script might have executed properly despite the warning
          window.location.href = `/data/labels/${part.id}-24mm.lbx`
          toast({
            title: 'Conversion completed with warnings',
            description: 'There were some warnings during conversion, but your file should be ready.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Conversion failed',
            description: data.message || 'There was an error converting the label to 24mm format.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch (error) {
      console.error('Error converting label:', error)
      toast({
        title: 'Conversion failed',
        description: 'There was an error converting the label.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <Card
      borderWidth="1px"
      borderColor={cardBorderColor}
      bg={isSelected ? cardSelectedBg : cardBg}
      boxShadow="sm"
      borderRadius="md"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
      position="relative"
      overflow="hidden"
      width="100%"
      minHeight="180px"
    >
      <Box position="absolute" top="0.5rem" right="0.5rem" zIndex="10">
        <Checkbox
          isChecked={isSelected}
          onChange={(e) => {
            e.preventDefault()
            onToggleSelect(part.id)
          }}
          colorScheme="blue"
        />
      </Box>

      <CardBody padding="2" height="100%" display="flex" flexDirection="column">
        <Flex direction="row" gap={3} width="100%" flex="1">
          {/* Image container - clickable to part details */}
          <NextLink href={`/part?id=${part.id}`} passHref>
            <Flex
              as="a"
              minWidth="84px"
              width="144px"
              height="84px"
              borderRadius="md"
              overflow="hidden"
              alignItems="center"
              justifyContent="center"
              position="relative"
              flexShrink={0}
              bg="white"
              border="1px solid"
              borderColor={useColorModeValue('gray.100', 'gray.600')}
              cursor="pointer"
            >
              <Image
                src={pngPath}
                alt={part.name}
                maxHeight="100%"
                maxWidth="100%"
                objectFit="contain"
                padding="4px"
                bg="white"
                fallback={<Icon as={BrickIcon} boxSize="48px" color={placeholderIconColor} />}
              />
            </Flex>
          </NextLink>

          {/* Part details */}
          <Stack spacing={1} flex="1" overflow="hidden">
            <Flex align="center" justify="space-between">
              <NextLink href={`/part?id=${part.id}`} passHref>
                <Heading
                  as="a"
                  size="md"
                  fontFamily="mono"
                  color={headingColor}
                  noOfLines={1}
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                >
                  {part.id}
                </Heading>
              </NextLink>
            </Flex>

            <NextLink href={`/part?id=${part.id}`} passHref>
              <Text
                as="a"
                fontSize="md"
                fontWeight="medium"
                noOfLines={1}
                textOverflow="ellipsis"
                color={textColor}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                {part.ba_name && part.ba_name.trim() !== '' ? part.ba_name : part.name}
              </Text>
            </NextLink>

            <Flex gap={2} flexWrap="wrap">
              {part.grandparent_category && part.grandparent_cat_id && (
                <Badge
                  colorScheme="gray"
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={1.5}
                  py={0.25}
                  fontSize="xs"
                  fontWeight="normal"
                  onClick={(e) => handleCategoryClick(e, part.grandparent_cat_id)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8, transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  role="button"
                  bg={grandparentBadgeBg}
                  color={badgeTextColor}
                >
                  {part.grandparent_category.length > 8
                    ? part.grandparent_category.substring(0, 8) + '…'
                    : part.grandparent_category}
                </Badge>
              )}
              {part.parent_category && part.parent_cat_id && (
                <Badge
                  colorScheme="gray"
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={1.5}
                  py={0.25}
                  fontSize="xs"
                  fontWeight="normal"
                  onClick={(e) => handleCategoryClick(e, part.parent_cat_id)}
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
              {part.ba_category_name && (
                <Badge
                  colorScheme="green"
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={1.5}
                  py={0.25}
                  fontSize="xs"
                  fontWeight="normal"
                  onClick={(e) => handleCategoryClick(e, part.ba_cat_id)}
                  cursor="pointer"
                  _hover={{ opacity: 0.8, transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  role="button"
                  bg={categoryBadgeBg}
                  color={badgeTextColor}
                >
                  {part.ba_category_name}
                </Badge>
              )}
              {/* Add placeholder badge if no categories are available */}
              {!part.grandparent_category && !part.parent_category && !part.ba_category_name && (
                <Box height="22px" width="1px" />
              )}
            </Flex>

            {/* Original part category information */}
            {part.category_name && (
              <Text color={categoryTextColor} fontSize="xs" mt={1}>
                {part.category_name}
              </Text>
            )}
          </Stack>
        </Flex>

        {/* Label download link area */}
        <Box borderTop="1px" borderColor={useColorModeValue('gray.100', 'gray.600')}>
          {labelExists === false ? (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              No label available
            </Text>
          ) : (
            <Flex direction="row" gap={2} justify="center" align="center">
              <Button
                size="xs"
                variant="ghost"
                onClick={handleLabelDownload}
                color={linkColor}
                _hover={{ color: linkHoverColor }}
                isLoading={isDownloading}
                loadingText="Downloading..."
                p={1}
                pb={0}
                mb={-1}
              >
                <Icon as={DownloadIcon} mr={1} /> LBX 12mm
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={handle24mmLabelDownload}
                color={linkColor}
                _hover={{ color: linkHoverColor }}
                isLoading={isConverting}
                loadingText="Converting..."
                p={1}
                pb={0}
                mb={-1}
              >
                <Icon as={DownloadIcon} mr={1} /> LBX 24mm
              </Button>
            </Flex>
          )}
        </Box>
      </CardBody>
    </Card>
  )
}

const SearchResults = ({ results = [], totalResults = 0, subcategoryCount = 0 }) => {
  const [selectedParts, setSelectedParts] = useState({})
  const toast = useToast()
  const router = useRouter()

  const textColor = useColorModeValue('gray.600', 'gray.300')
  const buttonBorderColor = useColorModeValue('gray.200', 'gray.600')
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700')
  const infoTextColor = useColorModeValue('blue.600', 'blue.300')

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
        <Heading as="h3" size="md" color="gray.500" mb={4}>
          No results found
        </Heading>
        {(router.query.category || router.query.q) && (
          <Button
            colorScheme="blue"
            size="md"
            onClick={() => {
              router.push('/')
            }}
          >
            Reset Search
          </Button>
        )}
      </Box>
    )
  }

  const selectedCount = Object.keys(selectedParts).length

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Flex direction="column" gap={1}>
          <Text color={textColor}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </Text>
          {subcategoryCount > 0 && (
            <Text fontSize="xs" color={infoTextColor}>
              Searching across {subcategoryCount + 1} categor{subcategoryCount === 0 ? 'y' : 'ies'}
            </Text>
          )}
        </Flex>

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
      >
        {results.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            isSelected={!!selectedParts[part.id]}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </Grid>
    </Box>
  )
}

export default SearchResults
