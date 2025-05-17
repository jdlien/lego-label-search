/** @format */

import React, { useState, useEffect } from 'react'
import { Box, Spinner, Text, Alert, AlertIcon } from '@chakra-ui/react'
import PartDetail from './PartDetail'
import BaseModal from './BaseModal'

const PartDetailModal = ({ isOpen, onClose, partId }) => {
  const [part, setPart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!partId || !isOpen) {
      return
    }

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

  const modalTitle = part ? `Part ${part.id} Details` : 'Part Details'

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl">
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
    </BaseModal>
  )
}

export default PartDetailModal
