/** @format */

import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PartPage() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (!id || !router.isReady) return

    // Redirect to the home page with the part parameter
    router.replace({
      pathname: '/',
      query: { part: id },
    })
  }, [id, router.isReady])

  // Return an empty component since this will redirect quickly
  return null
}
