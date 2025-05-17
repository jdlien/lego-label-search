import { NextRequest, NextResponse } from 'next/server'
import { proxyHealthCheck } from '../../../utils/brickognizeProxy'

/**
 * API route handler for Brickognize health checks
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  // For app router, we'll need to adapt the proxyHealthCheck function to use NextResponse
  // or modify it here to handle the new pattern
  try {
    const healthStatus = await proxyHealthCheck()
    return NextResponse.json(healthStatus)
  } catch (error: any) {
    console.error('Health check error:', error)
    return NextResponse.json({ error: error.message || 'Health check failed' }, { status: 500 })
  }
}
