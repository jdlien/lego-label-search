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
  Button,
  VStack,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  AspectRatio,
} from '@chakra-ui/react'

const ImageSearchModal = ({ isOpen, onClose, onImageSubmit }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isStreamActive, setIsStreamActive] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const modalBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setError(null)
      setIsLoading(false)
      startCamera()
    } else {
      stopCameraStream()
      setShowCamera(false)
      setSelectedImage(null)
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
      // Health check before submitting image
      const healthResponse = await fetch('https://api.brickognize.com/health/', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      }).catch((error) => {
        // Log detailed information about network errors (like CORS)
        console.error('Health check network error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          url: 'https://api.brickognize.com/health/',
          type: 'GET request',
          cors: {
            info: 'This is likely a CORS error. The API provider should check their server configuration.',
            expected: 'Server should include Access-Control-Allow-Origin header for cross-origin requests',
            recommendation: 'API provider should add appropriate CORS headers or use a proxy server',
          },
          browserDetails: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
          },
          timestamp: new Date().toISOString(),
        })
        throw error
      })

      if (!healthResponse.ok) {
        // Log detailed information for non-ok responses
        console.error('Health check API error details:', {
          status: healthResponse.status,
          statusText: healthResponse.statusText,
          url: healthResponse.url,
          headers: {
            available: [...healthResponse.headers.entries()].reduce((obj, [key, val]) => {
              obj[key] = val
              return obj
            }, {}),
            missing: 'If Access-Control-Allow-Origin header is missing, this is a CORS configuration issue',
          },
          timestamp: new Date().toISOString(),
        })
        throw new Error(`API service is unavailable: ${healthResponse.status} ${healthResponse.statusText}`)
      }

      const healthData = await healthResponse.json()
      if (!healthData.success) {
        throw new Error('API service is currently experiencing issues. Please try again later.')
      }

      // Proceed with image submission if health check is successful
      const formData = new FormData()
      const fileName = selectedImage.name || `captured_image_${Date.now()}.jpg`
      formData.append('query_image', selectedImage, fileName)

      const response = await fetch('https://api.brickognize.com/predict/parts/', {
        method: 'POST',
        body: formData,
        // Content-Type for multipart/form-data is set automatically by the browser with FormData
      })

      if (!response.ok) {
        let errorBodyText = await response.text() // Get raw text first for more detailed error
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorBodyText) // Try to parse as JSON
          // Use more specific error message from API if available
          if (errorData && errorData.detail) {
            if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && errorData.detail[0].msg) {
              errorMessage = errorData.detail[0].msg
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            }
          }
        } catch (e) {
          // If parsing JSON fails or structure is unexpected, append raw text if it's not too long
          if (errorBodyText && errorBodyText.length < 500) {
            // Avoid overly long error messages
            errorMessage += ` - ${errorBodyText}`
          }
        }
        throw new Error(errorMessage)
      }

      const results = await response.json()
      // console.log('API Results:', results); // For debugging by the developer

      if (onImageSubmit) {
        onImageSubmit(results) // Pass results to parent component
      }
      onClose() // Close the image search modal
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
          Search by Image
        </ModalHeader>
        <ModalCloseButton size="lg" top={3} right={4} />
        <ModalBody p={{ base: 4, md: 6 }}>
          <VStack spacing={4} align="stretch">
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
        <ModalFooter borderTopWidth="1px" borderTopColor={borderColor} py={3} px={6}>
          <Button onClick={handleCloseModal} variant="ghost">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ImageSearchModal
