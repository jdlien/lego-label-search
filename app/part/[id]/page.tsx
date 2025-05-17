'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PartPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    if (!id) return

    // In the app router, we use push with a URL string instead of replace with pathname/query
    router.push(`/?part=${id}`)
  }, [id, router])

  // Return an empty component since this will redirect quickly
  return null
}
