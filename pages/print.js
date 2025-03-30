/** @format */

import React, { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  Grid,
  Flex,
  Input,
  FormControl,
  FormLabel,
  Select,
  VStack,
  HStack,
  useToast,
  Divider,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'

// Component for a single label
const Label = ({ part, size }) => {
  const fontSize = {
    small: { id: 'xs', name: '2xs' },
    medium: { id: 'sm', name: 'xs' },
    large: { id: 'md', name: 'sm' },
  }

  const dimensions = {
    small: { width: '1.5in', height: '0.5in' },
    medium: { width: '2in', height: '0.75in' },
    large: { width: '3in', height: '1in' },
  }

  return (
    <Box
      border="1px solid black"
      w={dimensions[size].width}
      h={dimensions[size].height}
      p={1}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      m={1}
      className="print-label"
    >
      <Text fontSize={fontSize[size].id} fontWeight="bold" fontFamily="mono">
        {part.id}
      </Text>
      <Text fontSize={fontSize[size].name} noOfLines={1} isTruncated>
        {part.name}
      </Text>
    </Box>
  )
}

export default function PrintPage() {
  const router = useRouter()
  const toast = useToast()
  const { ids } = router.query

  const [parts, setParts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [labelSize, setLabelSize] = useState('medium')
  const [copies, setCopies] = useState(1)

  useEffect(() => {
    if (!ids) return

    const fetchParts = async () => {
      setIsLoading(true)

      try {
        // Parse IDs from query string
        const partIds = ids.split(',')

        // Fetch each part
        const partPromises = partIds.map((id) =>
          fetch(`/api/part?id=${encodeURIComponent(id)}`).then((res) => res.json())
        )

        const partsData = await Promise.all(partPromises)
        setParts(partsData)
      } catch (err) {
        console.error('Error fetching parts:', err)
        toast({
          title: 'Error fetching parts',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchParts()
  }, [ids, toast])

  const handlePrint = () => {
    // Add print-specific styles
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-container, .print-container * {
          visibility: visible;
        }
        .print-container {
          position: absolute;
          left: 0;
          top: 0;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)

    // Print
    window.print()

    // Remove the style after printing
    document.head.removeChild(style)
  }

  return (
    <>
      <Head>
        <title>Print Labels | LEGO Part Label Maker</title>
        <meta name="description" content="Print labels for your LEGO parts" />
      </Head>

      <Box className="no-print">
        <Header />
      </Box>

      <Container maxW="container.xl" py={8}>
        <Box className="no-print" mb={6}>
          <Heading size="lg">Print Labels</Heading>
          <Text mt={2}>Prepare and print labels for your selected LEGO parts.</Text>

          <Flex mt={6} gap={4} flexWrap="wrap">
            <FormControl maxW="200px">
              <FormLabel>Label Size</FormLabel>
              <Select value={labelSize} onChange={(e) => setLabelSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </FormControl>

            <FormControl maxW="200px">
              <FormLabel>Copies per label</FormLabel>
              <Input
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value, 10))}
              />
            </FormControl>
          </Flex>

          <HStack mt={6} spacing={4}>
            <Button colorScheme="blue" onClick={handlePrint} isDisabled={parts.length === 0}>
              Print {parts.length > 0 && `(${parts.length} parts)`}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </HStack>

          <Divider my={6} />
        </Box>

        <Box className="print-container">
          <Flex flexWrap="wrap" justify="flex-start">
            {parts.map((part) =>
              // Render multiple copies based on the copies setting
              [...Array(copies)].map((_, index) => <Label key={`${part.id}-${index}`} part={part} size={labelSize} />)
            )}
          </Flex>
        </Box>
      </Container>
    </>
  )
}
