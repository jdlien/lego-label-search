/**
 * Jest setup file - runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test'

// Set test database path to ensure tests don't use production database
process.env.DB_PATH = ':memory:'

// Increase timeout for database operations
jest.setTimeout(30000)

// Global test utilities
global.testUtils = {
  // Helper to create API request path
  apiPath: (path) => `/api${path}`,
  
  // Helper to parse JSON response
  parseJSON: (response) => {
    try {
      return JSON.parse(response.text)
    } catch (error) {
      return response.text
    }
  },

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to measure execution time
  measureTime: async (fn) => {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start
    return { result, duration }
  },
}

// Mock Next.js specific functions if needed
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (data, init) => {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {}),
        },
      })
      return response
    },
    error: () => new Response(null, { status: 500 }),
  },
}))

// Clean up after all tests
afterAll(async () => {
  // Close any open database connections
  const { closeTestDatabase } = require('../utils/test-db')
  await closeTestDatabase()
  
  // Wait a bit to ensure all handles are closed
  await new Promise(resolve => setTimeout(resolve, 100))
})

// Suppress console errors during tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    // Only log errors that aren't expected test errors
    if (!args[0]?.includes?.('Expected error') && 
        !args[0]?.includes?.('Test error')) {
      originalError.call(console, ...args)
    }
  }
})

afterAll(() => {
  console.error = originalError
})

// Add custom Jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },

  toContainObject(received, expected) {
    const pass = received.some(item => 
      Object.keys(expected).every(key => item[key] === expected[key])
    )
    if (pass) {
      return {
        message: () => `expected array not to contain object matching ${JSON.stringify(expected)}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected array to contain object matching ${JSON.stringify(expected)}`,
        pass: false,
      }
    }
  },
})