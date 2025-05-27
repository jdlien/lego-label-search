const { NextRequest } = require('next/server')

/**
 * Creates a mock NextRequest for testing API routes
 * @param {string} url - The URL path
 * @param {Object} options - Request options
 * @returns {NextRequest} Mock request object
 */
function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    searchParams = {},
    body = null,
  } = options

  // Build full URL with search params
  const urlObj = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  // Create request init
  const init = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body)
  }

  // Create mock NextRequest
  const request = new Request(urlObj.toString(), init)
  
  // Add NextRequest specific properties
  request.nextUrl = urlObj
  
  return request
}

/**
 * Calls an API route handler and returns the response
 * @param {Function} handler - The API route handler (GET, POST, etc.)
 * @param {Object} options - Request options
 * @returns {Promise<Response>} The response object
 */
async function callApiHandler(handler, options = {}) {
  const request = createMockRequest(options.url || '/api/test', options)
  
  // Call the handler with params if it's a dynamic route
  if (options.params) {
    return await handler(request, { params: options.params })
  }
  
  return await handler(request)
}

/**
 * Parses the response from an API handler
 * @param {Response} response - The response object
 * @returns {Promise<Object>} Parsed response data
 */
async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type')
  
  if (contentType?.includes('application/json')) {
    return await response.json()
  }
  
  return await response.text()
}

/**
 * Helper to test API route with various options
 * @param {Function} handler - The API route handler
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result with status and data
 */
async function testApiRoute(handler, options = {}) {
  try {
    const response = await callApiHandler(handler, options)
    const data = await parseApiResponse(response)
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      ok: response.ok,
    }
  } catch (error) {
    return {
      status: 500,
      error: error.message,
      ok: false,
    }
  }
}

/**
 * Creates a test context with database and utilities
 */
async function createTestContext(options = {}) {
  const { setupTestDatabase } = require('./test-db')
  const db = await setupTestDatabase(options.useInMemory !== false)
  
  return {
    db,
    cleanup: async () => {
      const { closeTestDatabase } = require('./test-db')
      await closeTestDatabase()
    },
  }
}

/**
 * Measures API response time
 * @param {Function} apiCall - Function that calls the API
 * @returns {Promise<Object>} Result with response and duration
 */
async function measureApiPerformance(apiCall) {
  const start = process.hrtime.bigint()
  const result = await apiCall()
  const end = process.hrtime.bigint()
  
  const durationMs = Number(end - start) / 1_000_000
  
  return {
    ...result,
    duration: durationMs,
    durationMs,
  }
}

/**
 * Tests multiple API scenarios in sequence
 * @param {Function} handler - API handler
 * @param {Array} scenarios - Array of test scenarios
 * @returns {Promise<Array>} Results for each scenario
 */
async function testApiScenarios(handler, scenarios) {
  const results = []
  
  for (const scenario of scenarios) {
    const result = await testApiRoute(handler, scenario)
    results.push({
      name: scenario.name || 'Unnamed scenario',
      ...result,
      scenario,
    })
  }
  
  return results
}

module.exports = {
  createMockRequest,
  callApiHandler,
  parseApiResponse,
  testApiRoute,
  createTestContext,
  measureApiPerformance,
  testApiScenarios,
}