import { NextResponse } from 'next/server'

const BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com'

/**
 * API route handler for Brickognize health checks
 * GET /api/health
 */
export async function GET() {
  try {
    console.log('Proxying health check request to Brickognize API')
    const response = await fetch(`${BRICKOGNIZE_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error proxying health check:', error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
