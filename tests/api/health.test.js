/**
 * Tests for GET /api/health endpoint
 */

const { GET } = require('../../app/api/health/route')
const { 
  testApiRoute, 
  measureApiPerformance 
} = require('../utils/api-helpers')

// Mock fetch for testing
const originalFetch = global.fetch

describe('GET /api/health', () => {
  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch
  })

  describe('Successful requests', () => {
    test('should proxy successful health check from Brickognize', async () => {
      // Mock successful response from Brickognize
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: '2024-01-01T00:00:00Z',
          version: '1.0.0'
        })
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data).toHaveProperty('status', 'healthy')
      expect(result.data).toHaveProperty('timestamp')
      expect(result.data).toHaveProperty('version')

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brickognize.com/health/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            accept: 'application/json',
            'User-Agent': expect.stringContaining('Mozilla')
          })
        })
      )
    })

    test('should proxy non-200 responses from Brickognize', async () => {
      // Mock non-200 response from Brickognize
      global.fetch = jest.fn().mockResolvedValue({
        status: 503,
        json: jest.fn().mockResolvedValue({
          status: 'unhealthy',
          error: 'Service temporarily unavailable'
        })
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(503)
      expect(result.data).toHaveProperty('status', 'unhealthy')
      expect(result.data).toHaveProperty('error')
    })

    test('should include correct headers in request to Brickognize', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      })

      await testApiRoute(GET)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brickognize.com/health/',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        }
      )
    })
  })

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const result = await testApiRoute(GET)

      expect(result.status).toBe(500)
      expect(result.data).toHaveProperty('success', false)
      expect(result.data).toHaveProperty('error')
      expect(result.data.error).toContain('Network error')
    })

    test('should handle timeout errors', async () => {
      // Mock timeout error
      global.fetch = jest.fn().mockRejectedValue(new Error('Request timeout'))

      const result = await testApiRoute(GET)

      expect(result.status).toBe(500)
      expect(result.data).toHaveProperty('success', false)
      expect(result.data).toHaveProperty('error', 'Request timeout')
    })

    test('should handle JSON parsing errors', async () => {
      // Mock response with invalid JSON
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(500)
      expect(result.data).toHaveProperty('success', false)
      expect(result.data).toHaveProperty('error', 'Invalid JSON')
    })

    test('should handle non-Error exceptions', async () => {
      // Mock non-Error exception
      global.fetch = jest.fn().mockRejectedValue('String error')

      const result = await testApiRoute(GET)

      expect(result.status).toBe(500)
      expect(result.data).toHaveProperty('success', false)
      expect(result.data).toHaveProperty('error', 'Unknown error')
    })
  })

  describe('Performance', () => {
    test('should handle fast responses efficiently', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      })

      const result = await measureApiPerformance(() => testApiRoute(GET))
      
      expect(result.status).toBe(200)
      // Should complete quickly when mocked
      expect(result.duration).toBeLessThan(50)
    })

    test('should handle multiple concurrent requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      })

      // Make 5 concurrent requests
      const promises = Array(5).fill(null).map(() => testApiRoute(GET))
      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.status).toBe(200)
        expect(result.data.status).toBe('healthy')
      })

      // Should make 5 separate fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(5)
    })
  })

  describe('Response validation', () => {
    test('should preserve response structure from Brickognize', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T12:00:00Z',
        version: '2.1.0',
        uptime: 86400,
        checks: {
          database: 'ok',
          redis: 'ok',
          external_api: 'ok'
        }
      }

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockResponse)
    })

    test('should handle empty response body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({})
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(200)
      expect(result.data).toEqual({})
    })

    test('should handle null response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(null)
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(200)
      expect(result.data).toBeNull()
    })
  })

  describe('Integration scenarios', () => {
    test('should handle Brickognize API maintenance mode', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 503,
        json: jest.fn().mockResolvedValue({
          status: 'maintenance',
          message: 'API is under maintenance',
          estimated_completion: '2024-01-01T14:00:00Z'
        })
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(503)
      expect(result.data.status).toBe('maintenance')
      expect(result.data).toHaveProperty('message')
      expect(result.data).toHaveProperty('estimated_completion')
    })

    test('should handle Brickognize API rate limiting', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: 'Too Many Requests',
          retry_after: 60
        })
      })

      const result = await testApiRoute(GET)

      expect(result.status).toBe(429)
      expect(result.data).toHaveProperty('error', 'Too Many Requests')
      expect(result.data).toHaveProperty('retry_after')
    })
  })
})