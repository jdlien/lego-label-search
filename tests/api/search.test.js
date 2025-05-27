/**
 * @jest-environment node
 */

// Mock the database before any imports
const mockDb = {
  all: jest.fn(),
  get: jest.fn(),
}

const mockOpen = jest.fn(() => Promise.resolve(mockDb))

jest.mock('sqlite', () => ({
  open: mockOpen,
}))

jest.mock('sqlite3', () => ({}))

// Import after mocking
const { GET } = require('../../app/api/search/route')

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset default mock behavior
    mockDb.all.mockResolvedValue([])
    mockDb.get.mockResolvedValue({ total: 0 })
    
    // Mock NextResponse
    global.NextResponse = {
      json: (data, init) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    }
  })

  const createRequest = (url) => ({
    url,
    nextUrl: new URL(url),
  })

  describe('Basic functionality', () => {
    test('should return 400 for empty query and no category', async () => {
      const request = createRequest('http://localhost:3000/api/search')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.message).toBe('Please provide a search query or category filter')
    })

    test('should handle database errors gracefully', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=test')
      mockDb.all.mockRejectedValueOnce(new Error('Database error'))
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.message).toBe('An error occurred during search')
    })
  })

  describe('Single word searches', () => {
    test('should return exact part_num matches first', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=3001')
      
      mockDb.all.mockResolvedValueOnce([
        { id: '3001', name: 'Brick 2 x 4', ba_cat_id: '1' },
        { id: '30010', name: 'Brick 1 x 4', ba_cat_id: '1' },
      ])
      mockDb.get.mockResolvedValueOnce({ total: 2 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(2)
      expect(data.results[0].id).toBe('3001')
    })

    test('should search multiple fields', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick')
      
      await GET(request)
      
      expect(mockDb.all).toHaveBeenCalled()
      const [query] = mockDb.all.mock.calls[0]
      
      // Verify query searches all required fields
      expect(query).toMatch(/p\.part_num LIKE \?/)
      expect(query).toMatch(/p\.name LIKE \?/)
      expect(query).toMatch(/p\.ba_name LIKE \?/)
      expect(query).toMatch(/p\.alt_part_ids LIKE \?/)
    })
  })

  describe('Multiple word searches', () => {
    test('should match parts containing all words with AND logic', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick red')
      
      mockDb.all.mockResolvedValueOnce([
        { id: '3001', name: 'Red Brick 2 x 4', ba_cat_id: '1' },
      ])
      mockDb.get.mockResolvedValueOnce({ total: 1 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.results).toHaveLength(1)
      
      // Check query has AND for multiple words
      const [query] = mockDb.all.mock.calls[0]
      expect(query).toMatch(/AND/)
    })

    test('should prioritize exact part_num matches', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=3001 brick')
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      // Should have exact match query first
      expect(query).toMatch(/p\.part_num = \?/)
    })
  })

  describe('Dimension searches', () => {
    const dimensionFormats = [
      '2x4',
      '2 x 4', 
      '2×4',
      '2 × 4'
    ]

    dimensionFormats.forEach(format => {
      test(`should normalize dimension format: "${format}"`, async () => {
        const request = createRequest(`http://localhost:3000/api/search?q=${encodeURIComponent(format)}`)
        
        await GET(request)
        
        // Get parameters passed to query
        const params = mockDb.all.mock.calls[0].slice(1)
        
        // Should search for all dimension formats
        const expectedFormats = ['2x4', '2 x 4', '2×4', '2 × 4']
        expectedFormats.forEach(expected => {
          const hasFormat = params.some(p => 
            typeof p === 'string' && p.includes(expected)
          )
          expect(hasFormat).toBe(true)
        })
      })
    })

    test('should handle dimensions with other terms', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=2x4 red')
      
      mockDb.all.mockResolvedValueOnce([
        { id: '3001', name: 'Red Brick 2x4', ba_cat_id: '1' }
      ])
      mockDb.get.mockResolvedValueOnce({ total: 1 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.results).toHaveLength(1)
      expect(data.results[0].name).toContain('Red')
    })
  })

  describe('BA category prioritization', () => {
    test('should prioritize parts with ba_cat_id values', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick&sort=alt_ids_length')
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      // Should have ba_cat_id prioritization in ORDER BY
      expect(query).toMatch(/ba_cat_id IS NOT NULL/)
      expect(query).toMatch(/ORDER BY/)
    })
  })

  describe('Alt part IDs', () => {
    test('should find parts by searching alt_part_ids', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=4070')
      
      mockDb.all.mockResolvedValueOnce([
        { id: '3024', name: 'Plate 1 x 1', alt_part_ids: '4070,30008', ba_cat_id: '1' }
      ])
      mockDb.get.mockResolvedValueOnce({ total: 1 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.results).toHaveLength(1)
      expect(data.results[0].alt_part_ids).toContain('4070')
    })

    test('should include alt_part_ids in search query', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=test')
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      expect(query).toMatch(/p\.alt_part_ids LIKE \?/)
    })
  })

  describe('Pagination', () => {
    test('should use default pagination (100 items, page 1)', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick')
      
      mockDb.get.mockResolvedValueOnce({ total: 250 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.pagination).toEqual({
        page: 1,
        limit: 100,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      })
      
      // Check LIMIT and OFFSET in parameters
      const params = mockDb.all.mock.calls[0].slice(1)
      expect(params).toContain(100) // limit
      expect(params).toContain(0)   // offset
    })

    test('should handle custom page and limit parameters', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick&page=3&limit=50')
      
      mockDb.get.mockResolvedValueOnce({ total: 250 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.pagination.page).toBe(3)
      expect(data.pagination.limit).toBe(50)
      
      const params = mockDb.all.mock.calls[0].slice(1)
      expect(params).toContain(50)  // limit
      expect(params).toContain(100) // offset = (page-1) * limit = 2 * 50
    })
  })

  describe('Performance and Query Optimization', () => {
    test('complex searches should complete quickly', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=2x4 red brick&category=cat1')
      
      // Mock category subcategories
      mockDb.all
        .mockResolvedValueOnce([{ id: 'cat1' }])
        .mockResolvedValueOnce([])
      mockDb.get.mockResolvedValueOnce({ total: 0 })
      
      const start = Date.now()
      await GET(request)
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(100)
    })

    test('should use UNION ALL for query optimization', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=test')
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      expect(query).toMatch(/UNION ALL/)
    })

    test('should use DISTINCT to eliminate duplicates', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=test')
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      expect(query).toMatch(/SELECT DISTINCT/)
    })
  })

  describe('Category filtering', () => {
    test('should filter by category and subcategories', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=brick&category=cat1')
      
      // First call gets subcategories, second gets results
      mockDb.all
        .mockResolvedValueOnce([
          { id: 'cat1' },
          { id: 'cat1-1' },
          { id: 'cat1-2' }
        ])
        .mockResolvedValueOnce([
          { id: '3001', name: 'Brick', ba_cat_id: 'cat1' }
        ])
      mockDb.get.mockResolvedValueOnce({ total: 1 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.categories).toEqual(['cat1', 'cat1-1', 'cat1-2'])
      expect(data.results).toHaveLength(1)
    })

    test('should use AND logic for multi-word search with category filtering', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=red brick&category=cat1')
      
      // Mock subcategories query
      mockDb.all
        .mockResolvedValueOnce([
          { id: 'cat1' },
          { id: 'cat1-1' }
        ])
        .mockResolvedValueOnce([
          { id: '3001', name: 'Red Brick 2x4', ba_cat_id: 'cat1' },
          // This part should NOT appear because it doesn't match "red" 
          // even though it's in the same category and matches "brick"
        ])
      mockDb.get.mockResolvedValueOnce({ total: 1 })
      
      const response = await GET(request)
      const data = await response.json()
      
      // Verify the query uses AND logic for both words AND category filtering
      const [query, ...params] = mockDb.all.mock.calls[1] // Second call is the search query
      
      // Should have AND between search terms
      expect(query).toMatch(/AND.*AND/) // Multiple ANDs for word1 AND word2 AND category
      
      // Should have category filtering with IN clause
      expect(query).toMatch(/ba_cat_id IN \(/i)
      
      // Parameters should include both search terms and category IDs
      const searchParams = params.filter(p => typeof p === 'string' && p.includes('%'))
      expect(searchParams.length).toBeGreaterThanOrEqual(8) // 4 fields × 2 words = 8 minimum
      
      expect(data.results).toHaveLength(1)
      expect(data.results[0].name).toContain('Red')
      expect(data.results[0].name).toContain('Brick')
    })

    test('should return empty results when multi-word search does not match all terms in category', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=red spaceship&category=cat1')
      
      // Mock subcategories
      mockDb.all
        .mockResolvedValueOnce([{ id: 'cat1' }])
        .mockResolvedValueOnce([]) // No results because no parts match BOTH "red" AND "spaceship" in cat1
      mockDb.get.mockResolvedValueOnce({ total: 0 })
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.results).toHaveLength(0)
      expect(data.total).toBe(0)
      
      // Verify query structure still uses AND logic
      const [query] = mockDb.all.mock.calls[1]
      expect(query).toMatch(/AND.*AND/) // Should still use AND logic even when no results
    })
  })
})