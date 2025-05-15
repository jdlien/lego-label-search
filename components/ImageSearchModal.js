/** @format */

import React, { useState, useEffect, useRef } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Box,
  Flex,
  Button,
  VStack,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  AspectRatio,
  Grid,
  Image,
  Heading,
  HStack,
  Badge,
  Link,
  Divider,
} from '@chakra-ui/react'

const ImageSearchModal = ({ isOpen, onClose, onImageSubmit }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const [apiStatus, setApiStatus] = useState({ isChecking: false, isAvailable: true })
  const [searchResults, setSearchResults] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const modalBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const linkColor = useColorModeValue('blue.500', 'blue.300')
  const placeholderBg = useColorModeValue('gray.100', 'gray.700')

  useEffect(() => {
    if (isOpen) {
      checkApiHealth()
      setSelectedImage(null)
      setSearchResults(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      setIsLoading(false)

      // Start camera immediately when modal opens
      if (!showCamera && !searchResults) {
        startCamera()
      }
    } else {
      stopCameraStream()
      setShowCamera(false)
      setSelectedImage(null)
      setSearchResults(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen])

  const checkApiHealth = async () => {
    setApiStatus({ isChecking: true, isAvailable: false })
    try {
      const healthResponse = await fetch('/api/health', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      }).catch((error) => {
        // Log essential info about network errors
        console.error('API Health check failed:', {
          message: error.message,
          type: 'Network error',
          url: '/api/health',
        })
        throw error
      })

      if (!healthResponse.ok) {
        console.error('Health check failed with status:', healthResponse.status, healthResponse.statusText)
        throw new Error(`API service is unavailable: ${healthResponse.status} ${healthResponse.statusText}`)
      }

      const healthData = await healthResponse.json()
      if (!healthData.success) {
        throw new Error('API service is currently experiencing issues. Please try again later.')
      }

      setApiStatus({ isChecking: false, isAvailable: true })
    } catch (err) {
      console.error('API Health check failed:', err.message)
      setApiStatus({ isChecking: false, isAvailable: false })
      // Don't set error here, we'll show it in the UI based on apiStatus
    }
  }

  const handleFileChange = (event) => {
    stopCameraStream()
    setShowCamera(false)
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const startCamera = async () => {
    setSelectedImage(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setShowCamera(true)
    setError(null)
    setIsStreamActive(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current
          .play()
          .catch((err) => console.warn('Video play caught error (often ignorable on autoPlay)', err))
        setIsStreamActive(true)
      } else {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('Video element not available.')
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Could not access camera. Please ensure permissions are granted and a camera is available.')
      setShowCamera(false)
      setIsStreamActive(false)
    }
  }

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreamActive(false)
  }

  const takePicture = () => {
    if (videoRef.current && canvasRef.current && isStreamActive) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      stopCameraStream()
      setShowCamera(false)
      canvas.toBlob((blob) => {
        setSelectedImage(blob)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
      }, 'image/jpeg')
    } else {
      console.warn('Take picture called but stream not active or refs not set')
      setError('Could not take picture. Camera not ready.')
    }
  }

  const switchToUpload = () => {
    stopCameraStream()
    setShowCamera(false)
    setError(null)
    fileInputRef.current?.click()
  }

  const cancelCamera = () => {
    stopCameraStream()
    setShowCamera(false)
    setError(null)
  }

  const clearSelectionAndRestartCamera = () => {
    setSelectedImage(null)
    setSearchResults(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    startCamera()
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first.')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      const fileName = selectedImage.name || `captured_image_${Date.now()}.jpg`
      formData.append('query_image', selectedImage, fileName)

      const response = await fetch('/api/predict/parts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorBodyText = await response.text()
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorBodyText)
          if (errorData && errorData.detail) {
            if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && errorData.detail[0].msg) {
              errorMessage = errorData.detail[0].msg
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            }
          }
        } catch (e) {
          if (errorBodyText && errorBodyText.length < 500) {
            errorMessage += ` - ${errorBodyText}`
          }
        }
        throw new Error(errorMessage)
      }

      const results = await response.json()

      // Store results in state instead of immediately closing
      setSearchResults(results)

      // Pass keepModalOpen flag to parent
      if (onImageSubmit) {
        onImageSubmit(results, { keepModalOpen: true })
      }
    } catch (err) {
      console.error('Image submission error:', err)
      setError(err.message || 'Failed to submit image. Check console for more details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = () => {
    onClose()
  }

  const renderResultsView = () => {
    if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
      return (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          No matching items found
        </Alert>
      )
    }

    return (
      <VStack spacing={4} align="stretch">
        <Box mb={2}>
          <Heading size="md" mb={2}>
            Search Results
          </Heading>
          <Text fontSize="sm" color={textColorSecondary}>
            {searchResults.items.length} item{searchResults.items.length !== 1 ? 's' : ''} found
          </Text>
        </Box>

        <Divider />

        {searchResults.items.map((item, index) => (
          <Box
            key={`${item.id}-${index}`}
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            bg={cardBg}
          >
            <Grid templateColumns={{ base: '1fr', sm: '100px 1fr' }} gap={4}>
              {item.img_url && (
                <Image
                  src={item.img_url}
                  alt={item.name}
                  objectFit="contain"
                  borderRadius="md"
                  fallback={
                    <Center w="100%" h="100px" bg={placeholderBg} borderRadius="md">
                      <Spinner size="md" />
                    </Center>
                  }
                  maxH="100px"
                />
              )}

              <Box>
                <Heading size="sm">{item.name}</Heading>
                <Text fontSize="sm" fontWeight="bold" mt={1}>
                  ID:{' '}
                  <Link href={`?q=${item.id}`} color={linkColor}>
                    {item.id}
                  </Link>
                </Text>

                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {item.category && <Badge colorScheme="blue">{item.category}</Badge>}
                  {item.type && <Badge colorScheme="green">{item.type}</Badge>}
                  {item.score && <Badge colorScheme="purple">Match: {Math.round(item.score * 100)}%</Badge>}
                </HStack>

                {item.external_sites && item.external_sites.length > 0 && (
                  <HStack mt={3} spacing={3}>
                    {item.external_sites.map((site, siteIndex) => (
                      <Link key={siteIndex} href={site.url} isExternal color="blue.500" fontSize="sm" target="_blank">
                        View on {site.name === 'bricklink' ? 'BrickLink' : site.name}
                      </Link>
                    ))}
                  </HStack>
                )}
              </Box>
            </Grid>
          </Box>
        ))}

        <Button onClick={clearSelectionAndRestartCamera} colorScheme="blue" mt={4}>
          Search New Image
        </Button>
      </VStack>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent
        maxW={{ base: '95%', md: '600px' }}
        mx="auto"
        top={{ base: '40px', lg: '110px' }}
        my={{ base: 3, md: 6 }}
        borderRadius="lg"
        boxShadow="xl"
        bg={modalBg}
        borderColor={borderColor}
        borderWidth="1px"
        overflow="hidden"
      >
        <ModalHeader pb={3} pt={4} px={6} bg={headerBg} borderBottomWidth="1px" borderBottomColor={borderColor}>
          {searchResults ? 'Search Results' : 'Search by Image'}
        </ModalHeader>
        <ModalCloseButton size="lg" top={3} right={4} />
        <ModalBody p={{ base: 4, md: 6 }}>
          <VStack spacing={4} align="stretch">
            {/* Show API error only if check is complete and failed */}
            {!apiStatus.isAvailable && !apiStatus.isChecking && (
              <Alert status="error" borderRadius="md" justifyContent="center">
                <Box>
                  <Text fontWeight="medium" textAlign="center">
                    The image search service is currently unavailable
                  </Text>
                  <Text fontSize="sm" textAlign="center">
                    Please try again later or contact support if the issue persists.
                  </Text>
                  <Flex justifyContent="center">
                    <Button onClick={checkApiHealth} colorScheme="blue" size="sm" mt={2}>
                      Retry Connection
                    </Button>
                  </Flex>
                </Box>
              </Alert>
            )}

            {error && (
              <Alert status="error" borderRadius="md" mb={2}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            {isLoading ? (
              <Center py={6}>
                <Spinner size="lg" color="blue.500" thickness="4px" />
                <Text ml={3} fontWeight="medium">
                  Processing image...
                </Text>
              </Center>
            ) : searchResults ? (
              renderResultsView()
            ) : showCamera ? (
              <Box>
                <AspectRatio ratio={4 / 3} mb={3} borderRadius="md" overflow="hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </AspectRatio>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <Button onClick={takePicture} colorScheme="green" width="full" isDisabled={!isStreamActive}>
                  Take Picture
                </Button>
                <Button onClick={switchToUpload} width="full" mt={2}>
                  Upload Image
                </Button>
              </Box>
            ) : previewUrl ? (
              <Box textAlign="center">
                <Text mb={2} fontWeight="medium">
                  Preview:
                </Text>
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: 'md',
                    margin: '0 auto',
                    border: `1px solid ${borderColor}`,
                  }}
                />
                <VStack mt={4} spacing={2}>
                  <Button onClick={handleSubmit} colorScheme="blue" width="full" isLoading={isLoading}>
                    Search with this Image
                  </Button>
                  <Button onClick={clearSelectionAndRestartCamera} width="full" variant="outline">
                    Choose Different Image
                  </Button>
                </VStack>
              </Box>
            ) : (
              <VStack spacing={3} width="full" pt={error ? 0 : 2} pb={2} textAlign="center">
                {!error && (
                  <Center py={4}>
                    <Spinner size="md" />
                    <Text ml={3} color={textColorSecondary}>
                      Starting camera...
                    </Text>
                  </Center>
                )}
                <Text fontSize="sm" color={textColorSecondary} mt={error ? 2 : 0}>
                  If the camera doesn't start, or you prefer to upload:
                </Text>
                <Button onClick={() => fileInputRef.current?.click()} width="full">
                  Upload Image from Device
                </Button>
                <Button onClick={startCamera} width="full">
                  Retry Camera
                </Button>
              </VStack>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </VStack>
        </ModalBody>
        {/* <ModalFooter borderTopWidth="1px" borderTopColor={borderColor} py={3} px={6}>
          <Button onClick={handleCloseModal} variant="ghost">
            Close
          </Button>
        </ModalFooter> */}
      </ModalContent>
    </Modal>
  )
}

export default ImageSearchModal
