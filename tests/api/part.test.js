/**
 * @jest-environment node
 */

// Mock the database before any imports
const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
}

const mockOpen = jest.fn(() => Promise.resolve(mockDb))

jest.mock('sqlite', () => ({
  open: mockOpen,
}))

jest.mock('sqlite3', () => ({}))

// Import after mocking
const { GET } = require('../../app/api/part/route')

describe('GET /api/part', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset default mock behavior
    mockDb.get.mockResolvedValue(null)
    mockDb.all.mockResolvedValue([])
    
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
    test('should return 400 if no ID is provided', async () => {
      const request = createRequest('http://localhost:3000/api/part')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Part ID is required')
    })

    test('should return 404 if part is not found', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=99999')
      mockDb.get.mockResolvedValueOnce(undefined)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Part not found')
    })

    test('should handle database errors gracefully', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      mockDb.get.mockRejectedValueOnce(new Error('Database connection failed'))
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
      expect(data.message).toBe('Database connection failed')
    })
  })

  describe('Part retrieval', () => {
    test('should return part details without relationships', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      const mockPart = {
        id: '3001',
        name: 'Brick 2 x 4',
        category_id: 'cat1',
        part_material: 'ABS',
        label_file: 'label_3001.pdf',
        ba_cat_id: 'ba1',
        ba_name: 'Brick 2x4',
        category_name: 'Bricks',
        ba_category_name: 'Basic Bricks'
      }
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      mockDb.all.mockResolvedValueOnce([]) // No relationships
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('3001')
      expect(data.name).toBe('Brick 2 x 4')
      expect(data.alternateIds).toEqual([])
      expect(data.alternatesByType).toBeDefined()
    })

    test('should use correct SQL query with joins', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      await GET(request)
      
      const [query, params] = mockDb.get.mock.calls[0]
      
      // Check query structure
      expect(query).toMatch(/SELECT.*FROM parts p/s)
      expect(query).toMatch(/LEFT JOIN part_categories/)
      expect(query).toMatch(/LEFT JOIN ba_categories/)
      expect(query).toMatch(/WHERE p\.part_num = \?/)
      
      // Check parameter
      expect(params).toBe('3001')
    })
  })

  describe('Part relationships', () => {
    const mockPart = {
      id: '3001',
      name: 'Brick 2 x 4',
      category_id: 'cat1',
      part_material: 'ABS',
      label_file: 'label_3001.pdf',
      ba_cat_id: 'ba1',
      ba_name: 'Brick 2x4',
      category_name: 'Bricks',
      ba_category_name: 'Basic Bricks'
    }

    test('should retrieve alternate part IDs with all relationship types', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      mockDb.all.mockResolvedValueOnce([
        { alt_id: '3001b', rel_type: 'M' }, // Mold variant
        { alt_id: '3001c', rel_type: 'T' }, // Alias
        { alt_id: '3001d', rel_type: 'R' }, // Replacement
        { alt_id: '3004', rel_type: 'A' },  // Alternate
      ])
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.alternateIds).toHaveLength(4)
      expect(data.alternateIds).toContain('3001b')
      expect(data.alternateIds).toContain('3001c')
      expect(data.alternateIds).toContain('3001d')
      expect(data.alternateIds).toContain('3004')
    })

    test('should group alternates by relationship type', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      mockDb.all.mockResolvedValueOnce([
        { alt_id: '3001b', rel_type: 'M' },
        { alt_id: '3001c', rel_type: 'T' },
        { alt_id: '3001d', rel_type: 'R' },
        { alt_id: '3004', rel_type: 'A' },
      ])
      
      const response = await GET(request)
      const data = await response.json()
      
      // Check relationship type grouping
      expect(data.alternatesByType.M.heading).toBe('Mold Variant')
      expect(data.alternatesByType.M.ids).toEqual(['3001b'])
      
      expect(data.alternatesByType.T.heading).toBe('Alias')
      expect(data.alternatesByType.T.ids).toEqual(['3001c'])
      
      expect(data.alternatesByType.R.heading).toBe('Replacement')
      expect(data.alternatesByType.R.ids).toEqual(['3001d'])
      
      expect(data.alternatesByType.A.heading).toBe('Alternate Part')
      expect(data.alternatesByType.A.ids).toEqual(['3004'])
    })

    test('should handle bidirectional relationships correctly', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      
      await GET(request)
      
      // Check the relationship query
      const [query, params] = mockDb.all.mock.calls[0]
      
      // Should query both parent and child relationships
      expect(query).toMatch(/SELECT child_part_num AS alt_id.*FROM part_relationships/s)
      expect(query).toMatch(/UNION/)
      expect(query).toMatch(/SELECT parent_part_num AS alt_id.*FROM part_relationships/s)
      
      // Should pass ID twice (for both directions)
      expect(params).toEqual(['3001', '3001'])
    })

    test('should filter out self-references', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      mockDb.all.mockResolvedValueOnce([
        { alt_id: '3001', rel_type: 'T' }, // Self-reference
        { alt_id: '3001b', rel_type: 'M' },
      ])
      
      const response = await GET(request)
      const data = await response.json()
      
      // Should not include self-reference
      expect(data.alternateIds).toEqual(['3001b'])
      expect(data.alternatesByType.T.ids).toEqual([])
      expect(data.alternatesByType.M.ids).toEqual(['3001b'])
    })

    test('should handle parts with no relationships', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      mockDb.all.mockResolvedValueOnce([])
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.alternateIds).toEqual([])
      
      // Should have alternatesByType defined (may be empty object when no relationships)
      expect(data.alternatesByType).toBeDefined()
    })

    test('should only include valid relationship types', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce(mockPart)
      
      await GET(request)
      
      const [query] = mockDb.all.mock.calls[0]
      
      // Should filter for specific relationship types
      expect(query).toMatch(/WHERE rel_type IN \('A', 'M', 'R', 'T'\)/)
    })
  })

  describe('Missing parts handling', () => {
    test('should handle parts missing BA category gracefully', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      const partWithoutBACategory = {
        id: '3001',
        name: 'Brick 2 x 4',
        category_id: 'cat1',
        part_material: 'ABS',
        label_file: 'label_3001.pdf',
        ba_cat_id: null,
        ba_name: null,
        category_name: 'Bricks',
        ba_category_name: null
      }
      
      mockDb.get.mockResolvedValueOnce(partWithoutBACategory)
      mockDb.all.mockResolvedValueOnce([])
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.ba_cat_id).toBeNull()
      expect(data.ba_name).toBeNull()
      expect(data.ba_category_name).toBeNull()
    })

    test('should handle parts missing regular category gracefully', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      const partWithoutCategory = {
        id: '3001',
        name: 'Brick 2 x 4',
        category_id: null,
        part_material: 'ABS',
        label_file: 'label_3001.pdf',
        ba_cat_id: 'ba1',
        ba_name: 'Brick 2x4',
        category_name: null,
        ba_category_name: 'Basic Bricks'
      }
      
      mockDb.get.mockResolvedValueOnce(partWithoutCategory)
      mockDb.all.mockResolvedValueOnce([])
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.category_id).toBeNull()
      expect(data.category_name).toBeNull()
    })
  })

  describe('Edge cases', () => {
    test('should handle special characters in part ID', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001%2B')
      
      mockDb.get.mockResolvedValueOnce(null)
      
      const response = await GET(request)
      
      expect(response.status).toBe(404)
      expect(mockDb.get).toHaveBeenCalledWith(expect.any(String), '3001+')
    })

    test('should handle very long part IDs', async () => {
      const longId = 'a'.repeat(100)
      const request = createRequest(`http://localhost:3000/api/part?id=${longId}`)
      
      mockDb.get.mockResolvedValueOnce(null)
      
      const response = await GET(request)
      
      expect(response.status).toBe(404)
    })

    test('should handle empty relationship results', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce({
        id: '3001',
        name: 'Brick 2 x 4',
        category_id: 'cat1',
        part_material: 'ABS',
        label_file: 'label_3001.pdf',
        ba_cat_id: 'ba1',
        ba_name: 'Brick 2x4',
        category_name: 'Bricks',
        ba_category_name: 'Basic Bricks'
      })
      mockDb.all.mockResolvedValueOnce(null) // Null instead of empty array
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.alternateIds).toEqual([])
      expect(data.alternatesByType).toBeDefined()
    })
  })

  describe('Performance considerations', () => {
    test('should execute queries efficiently', async () => {
      const request = createRequest('http://localhost:3000/api/part?id=3001')
      
      mockDb.get.mockResolvedValueOnce({
        id: '3001',
        name: 'Brick 2 x 4',
        category_id: 'cat1',
        part_material: 'ABS',
        label_file: 'label_3001.pdf',
        ba_cat_id: 'ba1',
        ba_name: 'Brick 2x4',
        category_name: 'Bricks',
        ba_category_name: 'Basic Bricks'
      })
      mockDb.all.mockResolvedValueOnce([])
      
      const start = Date.now()
      await GET(request)
      const duration = Date.now() - start
      
      expect(duration).toBeLessThan(50)
      
      // Should only make 2 database calls
      expect(mockDb.get).toHaveBeenCalledTimes(1)
      expect(mockDb.all).toHaveBeenCalledTimes(1)
    })
  })
})