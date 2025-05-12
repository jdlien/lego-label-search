/** @format */

import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react'
import PartDetail from './PartDetail'

const PartDetailModal = ({ isOpen, onClose, partId }) => {
  const [part, setPart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const modalBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (!partId || !isOpen) return

    const fetchPartDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/part?id=${encodeURIComponent(partId)}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setPart(data)
      } catch (err) {
        console.error('Error fetching part details:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPartDetails()
  }, [partId, isOpen])

  // Get the display name (prioritize ba_name, fall back to name)
  const displayName = part ? part.ba_name || part.name : 'Part Details'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        maxW={{ base: '95%', md: '85%', lg: '850px' }}
        mx="auto"
        top={{ base: '40px', md: '110px' }}
        my={{ base: 3, md: 6 }}
        borderRadius="lg"
        boxShadow="xl"
        bg={modalBg}
        borderColor={borderColor}
        borderWidth="1px"
        overflow="hidden"
      >
        <ModalHeader pb={3} pt={4} px={6} bg={headerBg} borderBottomWidth="1px" borderBottomColor={borderColor}>
          {part ? `${displayName} (${part.id})` : 'Part Details'}
        </ModalHeader>
        <ModalCloseButton size="lg" top={3} right={4} />
        <ModalBody p={{ base: 3, md: 5 }}>
          {isLoading ? (
            <Box textAlign="center" p={8}>
              <Spinner size="xl" thickness="4px" speed="0.65s" />
              <Text mt={4} fontWeight="medium">
                Loading part details...
              </Text>
            </Box>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              Error loading part details: {error}
            </Alert>
          ) : (
            <PartDetail part={part} isLoading={false} error={null} isInModal={true} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default PartDetailModal
