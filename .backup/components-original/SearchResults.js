/** @format */

import { useState } from 'react'
import { Box, Grid, Heading, Text, Button, Flex, useToast, useColorModeValue } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import PartCard from './PartCard'
import PartDetailModal from './PartDetailModal'

const SearchResults = ({ results = [], totalResults = 0, subcategoryCount = 0, onPartClick }) => {
  const [selectedParts, setSelectedParts] = useState({})
  const [selectedPartId, setSelectedPartId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handlePartClick = (partId) => {
    // If parent provided a click handler, use that
    if (onPartClick) {
      onPartClick(partId)
    } else {
      // Otherwise use local state
      setSelectedPartId(partId)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (results.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Heading as="h3" size="md" color="gray.500" mb={4}>
          No results found
        </Heading>
        {(router.query.category || router.query.q) && (
          <Button
            variant="link"
            colorScheme="blue"
            size="sm"
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
      <Box mt={2} mb={4}>
        <Flex justify="center" align="center">
          <Text color={textColor}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </Text>
          {subcategoryCount > 0 && (
            <Text color={textColor}>
              &nbsp;across {subcategoryCount + 1} categor{subcategoryCount === 0 ? 'y' : 'ies'}
            </Text>
          )}
        </Flex>
        <Flex justify="center" align="center" mt={0} mb={2}>
          {router.query.category && (
            <Button
              variant="link"
              colorScheme="blue"
              size="sm"
              ml={2}
              onClick={() => {
                // Remove only the category param, preserve q if present
                const params = new URLSearchParams()
                if (router.query.q) params.append('q', router.query.q)
                router.push(`/?${params.toString()}`)
              }}
            >
              Search All Categories
            </Button>
          )}
        </Flex>
      </Box>

      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          sm: 'repeat(1, 1fr)',
          md: 'repeat(1, 1fr)',
          lg: 'repeat(2, 1fr)',
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
            onPartClick={() => handlePartClick(part.id)}
          />
        ))}
      </Grid>

      {/* Part Detail Modal - only render if we're not using the parent's modal */}
      {!onPartClick && <PartDetailModal isOpen={isModalOpen} onClose={closeModal} partId={selectedPartId} />}
    </Box>
  )
}

export default SearchResults
