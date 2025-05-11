/** @format */

import { useState } from 'react'
import {
  Box,
  Card,
  CardBody,
  Stack,
  Checkbox,
  Flex,
  Heading,
  Text,
  Image,
  Icon,
  Button,
  useToast,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import PillContainer from './PillContainer'

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
  const { colors } = useTheme()
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
  const linkColor = useColorModeValue('blue.500', 'blue.300')
  const linkHoverColor = useColorModeValue('blue.600', 'blue.200')

  // Strip leading zeros for image filename
  const normalizedPartId = part.id.replace(/^0+/, '')

  // Image paths - updated to use public directory
  const pngPath = `/data/images/${normalizedPartId}.png`

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
        // Add a small delay to allow the server to recognize the new file
        await new Promise((resolve) => setTimeout(resolve, 300)) // 300ms delay
        // Start the download with a cache-busting query parameter
        window.location.href = `/data/labels/${part.id}-24mm.lbx`
      } else {
        // Check if the error message contains a SyntaxWarning about escape sequences
        const isEscapeSequenceWarning = data.message && data.message.includes('SyntaxWarning: invalid escape sequence')

        if (isEscapeSequenceWarning) {
          // Add a small delay here as well if attempting retry on warning
          await new Promise((resolve) => setTimeout(resolve, 300)) // 300ms delay
          // Try one more time - the script might have executed properly despite the warning
          // Add cache-busting here as well
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

  // Handler for category badge clicks
  const handleCategoryClick = (categoryId) => (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Navigate to homepage with only the category parameter
    // This will clear any existing search query
    router.push({
      pathname: '/',
      query: { category: categoryId },
      replace: true, // This replaces the current history entry instead of adding a new one
    })
  }

  // Create pill objects with text and click handlers
  const categoryPills = [
    part.grandparent_category && {
      text: part.grandparent_category,
      value: part.grandparent_cat_id,
      onClick: handleCategoryClick(part.grandparent_cat_id),
    },
    part.parent_category && {
      text: part.parent_category,
      value: part.parent_cat_id,
      onClick: handleCategoryClick(part.parent_cat_id),
    },
    part.ba_category_name && {
      text: part.ba_category_name,
      value: part.ba_cat_id,
      onClick: handleCategoryClick(part.ba_cat_id),
    },
  ].filter(Boolean) // Remove any undefined/null entries

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
      minHeight="150px"
    >
      <CardBody padding="2" height="100%" display="flex" flexDirection="column">
        <Flex direction="row" gap={3} width="100%" flex="1">
          {/* Image container - clickable to part details */}
          <NextLink href={`/part?id=${part.id}`} passHref>
            <Flex
              as="a"
              minWidth="84px"
              width="160px"
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
                noOfLines={2}
                textOverflow="ellipsis"
                color={textColor}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                {part.ba_name && part.ba_name.trim() !== '' ? part.ba_name : part.name}
              </Text>
            </NextLink>

            {/* Original part category information */}
            {part.category_name && (
              <Text color={categoryTextColor} fontSize="xs" mt={1}>
                {part.category_name}
              </Text>
            )}
          </Stack>
        </Flex>

        {/* Pills container - now below the image */}
        <Box my={2} width="100%">
          <PillContainer pills={categoryPills} size={21} color={colors.brand[700]} />
        </Box>

        {/* Label download link area */}
        <Box borderTop="1px" borderColor={useColorModeValue('gray.100', 'gray.600')} mt="auto">
          {labelExists === false ? (
            <Flex direction="row" gap={2} justify="center" align="center" height="24px" p={1} pb={0} mb={-1}>
              <Text fontSize="xs" color="gray.500" lineHeight="16px">
                No label available
              </Text>
            </Flex>
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

export default PartCard
