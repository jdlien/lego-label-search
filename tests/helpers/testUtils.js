import { NextResponse } from 'next/server'

// Helper to create a mock NextRequest with proper URL handling
export function createMockRequest(url) {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    method: 'GET',
  }
}

// Helper to parse NextResponse
export async function parseResponse(response) {
  if (response && typeof response.json === 'function') {
    return {
      data: await response.json(),
      status: response.status,
    }
  }
  return { data: null, status: 500 }
}

// Mock NextResponse properly
export function setupNextResponseMock() {
  global.NextResponse = {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Headers(init?.headers || {}),
    }),
  }
}