/** @format */

import React, { useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
} from '@chakra-ui/react'

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'xl', // Default size
  // Add other common props like scrollBehavior if needed
}) => {
  const modalBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // PWA vertical clearance adjustment
  useEffect(() => {
    const pwaClearance = '80px' // Larger value for PWA context
    const defaultClearance = '60px' // Default value (can be adjusted per modal if needed via prop)

    if (isOpen) {
      const isPwaMode = window.matchMedia('(display-mode: standalone)').matches
      if (isPwaMode) {
        document.documentElement.style.setProperty('--modal-vertical-clearance', pwaClearance)
      } else {
        document.documentElement.style.setProperty('--modal-vertical-clearance', defaultClearance)
      }
    }

    // Cleanup: Reset to default when modal is closed or component unmounts
    // This is important if multiple modals could be on screen or rapidly opened/closed,
    // though typically only one modal is active.
    return () => {
      document.documentElement.style.setProperty(
        '--modal-vertical-clearance',
        defaultClearance // Or a more generic reset if preferred
      )
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        maxW={{ base: '95%', md: '85%', lg: '850px' }} // Consistent maxW, adjust as needed or make prop
        maxH={{
          base: 'calc(100vh - env(safe-area-inset-bottom) - env(safe-area-inset-top) - var(--modal-vertical-clearance, 60px))',
          md: 'calc(100vh - var(--modal-vertical-clearance, 60px))', // Adjusted for md and lg
          lg: 'calc(100vh - var(--modal-vertical-clearance, 60px))',
        }}
        mx="auto"
        mt={{
          base: 'calc(env(safe-area-inset-top) + 20px)',
          md: 'var(--modal-vertical-clearance, 60px)', // Use the variable for consistent spacing
        }}
        mb={{
          base: 'calc(env(safe-area-inset-bottom) + 20px)',
          md: 'var(--modal-vertical-clearance, 60px)',
        }}
        borderRadius="lg"
        boxShadow="xl"
        bg={modalBg}
        borderColor={borderColor}
        borderWidth="1px"
        overflow="hidden" // Important for the ModalBody to scroll correctly
      >
        <ModalHeader pb={3} pt={4} px={6} bg={headerBg} borderBottomWidth="1px" borderBottomColor={borderColor}>
          {title}
        </ModalHeader>
        <ModalCloseButton size="lg" top={3} right={4} />
        <ModalBody p={{ base: 4, md: 6 }}>
          {' '}
          {/* Consistent padding */}
          {children}
        </ModalBody>
        {/* Footer can be added here or passed as a prop if needed */}
      </ModalContent>
    </Modal>
  )
}

export default BaseModal
