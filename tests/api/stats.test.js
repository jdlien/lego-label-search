/**
 * Tests for GET /api/stats endpoint
 */

const { GET, resetDbConnection } = require('../../app/api/stats/route')
const { 
  setupTestDatabase, 
  closeTestDatabase, 
  clearTestDatabase 
} = require('../utils/test-db')
const { 
  testApiRoute, 
  measureApiPerformance 
} = require('../utils/api-helpers')
const { seedStatsTestData } = require('../fixtures/database-seed')

describe('GET /api/stats', () => {
  let db
  let originalDbPath

  beforeAll(async () => {
    // Save original DB_PATH
    originalDbPath = process.env.DB_PATH
    
    // Set up test database with stats test data
    db = await setupTestDatabase(false)
    await clearTestDatabase(db)
    await seedStatsTestData(db)
    
    // Ensure DB_PATH points to test database
    process.env.DB_PATH = require('../utils/test-db').TEST_DB_PATH
  })

  afterAll(async () => {
    // Restore original DB_PATH
    if (originalDbPath) {
      process.env.DB_PATH = originalDbPath
    } else {
      delete process.env.DB_PATH
    }
    
    await closeTestDatabase()
  })

  beforeEach(() => {
    // Reset database connection pool for each test
    resetDbConnection()
  })

  describe('Successful requests', () => {
    test('should return stats with correct structure', async () => {
      const result = await testApiRoute(GET)

      expect(result.status).toBe(200)
      expect(result.ok).toBe(true)
      expect(result.data).toHaveProperty('totalParts')
      expect(result.data).toHaveProperty('totalCategories')
      expect(result.data).toHaveProperty('topLevelCategories')
      expect(result.data).toHaveProperty('uniqueImages')
    })

    test('should return numeric values for all stats', async () => {
      const result = await testApiRoute(GET)
      
      expect(typeof result.data.totalParts).toBe('number')
      expect(typeof result.data.totalCategories).toBe('number')
      expect(typeof result.data.topLevelCategories).toBe('number')
      expect(typeof result.data.uniqueImages).toBe('number')
    })

    test('should return non-negative values', async () => {
      const result = await testApiRoute(GET)
      
      expect(result.data.totalParts).toBeGreaterThanOrEqual(0)
      expect(result.data.totalCategories).toBeGreaterThanOrEqual(0)
      expect(result.data.topLevelCategories).toBeGreaterThanOrEqual(0)
      expect(result.data.uniqueImages).toBeGreaterThanOrEqual(0)
    })

    test('should have logical relationships between counts', async () => {
      const result = await testApiRoute(GET)
      
      // Top-level categories should be <= total categories
      expect(result.data.topLevelCategories).toBeLessThanOrEqual(result.data.totalCategories)
      
      // Unique images should be <= total parts (can't have more images than parts)
      expect(result.data.uniqueImages).toBeLessThanOrEqual(result.data.totalParts)
    })

    test('should return correct counts based on test data', async () => {
      const result = await testApiRoute(GET)
      
      // Verify against known test data
      expect(result.data.totalParts).toBe(5) // From seedStatsTestData
      expect(result.data.totalCategories).toBe(13) // From seedStatsTestData
      expect(result.data.topLevelCategories).toBe(3) // From seedStatsTestData (Category A, B, C)
      expect(result.data.uniqueImages).toBe(3) // From seedStatsTestData (3 parts have unique images)
    })
  })

  describe('Performance', () => {
    test('should return stats within acceptable time', async () => {
      const result = await measureApiPerformance(() => testApiRoute(GET))
      
      expect(result.status).toBe(200)
      // Should complete within 100ms for in-memory database
      expect(result.duration).toBeLessThan(100)
    })

    test('should handle multiple concurrent requests', async () => {
      // Make 10 concurrent requests
      const promises = Array(10).fill(null).map(() => testApiRoute(GET))
      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.status).toBe(200)
        expect(result.data.totalParts).toBeDefined()
      })

      // All results should be identical
      const firstResult = results[0].data
      results.forEach(result => {
        expect(result.data).toEqual(firstResult)
      })
    })
  })

  describe('Error handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily set invalid DB path
      const tempDbPath = process.env.DB_PATH
      process.env.DB_PATH = '/invalid/path/to/database.sqlite'
      
      // Reset connection pool
      resetDbConnection()

      try {
        const result = await testApiRoute(GET)
        
        expect(result.status).toBe(500)
        expect(result.data).toHaveProperty('message')
        expect(result.data).toHaveProperty('error')
        expect(result.data.message).toContain('error occurred while fetching statistics')
      } finally {
        // Restore original DB path and reset connection
        process.env.DB_PATH = tempDbPath
        resetDbConnection()
      }
    })

    test('should handle corrupted database gracefully', async () => {
      // This test simulates a corrupted database scenario
      // by temporarily setting a path to a non-SQLite file
      const tempDbPath = process.env.DB_PATH
      
      // Create a test file that's not a valid SQLite database
      const fs = require('fs')
      const path = require('path')
      const invalidDbPath = path.join(process.cwd(), 'invalid.db')
      fs.writeFileSync(invalidDbPath, 'not a sqlite database')
      
      process.env.DB_PATH = invalidDbPath
      resetDbConnection()

      try {
        const result = await testApiRoute(GET)
        
        expect(result.status).toBe(500)
        expect(result.data).toHaveProperty('message')
        expect(result.data).toHaveProperty('error')
      } finally {
        // Cleanup
        process.env.DB_PATH = tempDbPath
        resetDbConnection()
        
        // Remove the invalid database file
        if (fs.existsSync(invalidDbPath)) {
          fs.unlinkSync(invalidDbPath)
        }
      }
    })
  })

  describe('Data consistency', () => {
    test('should return consistent results across multiple calls', async () => {
      const results = []
      
      // Make 5 consecutive requests
      for (let i = 0; i < 5; i++) {
        const result = await testApiRoute(GET)
        expect(result.status).toBe(200)
        results.push(result.data)
      }

      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result).toEqual(firstResult)
      })
    })

    test('should handle empty database correctly', async () => {
      // Clear all data
      await clearTestDatabase(db)
      
      const result = await testApiRoute(GET)
      
      expect(result.status).toBe(200)
      expect(result.data.totalParts).toBe(0)
      expect(result.data.totalCategories).toBe(0)
      expect(result.data.topLevelCategories).toBe(0)
      expect(result.data.uniqueImages).toBe(0)
      
      // Re-seed for other tests
      await seedStatsTestData(db)
    })
  })
})