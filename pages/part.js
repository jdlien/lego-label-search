/** @format */

import React, { useState, useEffect } from 'react'
import { Container, Box } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import PartDetail from '../components/PartDetail'

export default function PartPage() {
  const router = useRouter()
  const { id } = router.query

  const [part, setPart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const fetchPartDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/part?id=${encodeURIComponent(id)}`)

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
  }, [id])

  // Get the display name (prioritize ba_name, fall back to name)
  const displayName = part ? part.ba_name || part.name : 'Part Details'

  return (
    <>
      <Head>
        <title>{part ? `${displayName} (${part.id})` : 'Part Details'} | LEGO Part Label Maker</title>
        <meta
          name="description"
          content={part ? `Details for LEGO part ${displayName} (${part.id})` : 'LEGO part details'}
        />
      </Head>

      <Header />

      <Container maxW="container.xl" py={8}>
        <PartDetail part={part} isLoading={isLoading} error={error} />
      </Container>
    </>
  )
}
