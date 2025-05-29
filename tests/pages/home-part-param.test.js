/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Home from '../../app/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock the fetch API
global.fetch = jest.fn()

// Mock components that might cause issues in tests
jest.mock('../../app/components/SearchBar', () => {
  return function MockSearchBar() {
    return <div data-testid="search-bar">Search Bar</div>
  }
})

jest.mock('../../app/components/SearchResults', () => {
  return function MockSearchResults({ results }) {
    return (
      <div data-testid="search-results">
        Search Results
        {results && results.length > 0 && <div data-testid="results-count">{results.length}</div>}
      </div>
    )
  }
})

jest.mock('../../app/components/ImageSearchModal', () => {
  return function MockImageSearchModal() {
    return null
  }
})

describe('Home Page - Part Parameter Handling', () => {
  let mockReplace
  let mockSearchParams
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create mock router functions
    mockReplace = jest.fn()
    
    // Setup router mock
    useRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
    })
    
    // Default search params
    mockSearchParams = new URLSearchParams()
    useSearchParams.mockReturnValue(mockSearchParams)
    
    // Default fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        total: 0,
        returned: 0,
        categories: [],
        pagination: {
          page: 1,
          limit: 100,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      }),
    })
  })

  test('should convert ?part= parameter to ?q=&part= parameters', async () => {
    // Set up search params with part parameter
    mockSearchParams = new URLSearchParams('part=3001')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should replace URL with both q and part parameters
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?part=3001&q=3001', { scroll: false })
    })
  })

  test('should not convert if q parameter already exists', async () => {
    // Set up search params with both part and q parameters
    mockSearchParams = new URLSearchParams('part=3001&q=brick')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should not replace URL
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('should preserve all query parameters when converting part to search', async () => {
    // Set up search params with part and other parameters (but no category or q)
    mockSearchParams = new URLSearchParams('part=3001&page=2&limit=50')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should preserve other parameters while adding q
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
      const call = mockReplace.mock.calls[0][0]
      expect(call).toContain('q=3001')
      expect(call).toContain('part=3001')
      expect(call).toContain('page=2')
      expect(call).toContain('limit=50')
    })
  })

  test('should not redirect when both part and query parameters exist', async () => {
    // Set up with both part and q parameters
    mockSearchParams = new URLSearchParams('q=3001&part=3001')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: '3001', name: 'Brick 2 x 4' }],
        total: 1,
        returned: 1,
        categories: [],
        pagination: {
          page: 1,
          limit: 100,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
    })
    
    render(<Home />)
    
    // Wait for API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/search?q=3001')
    })
    
    // Should not replace URL since both q and part exist
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('should handle part search and update URL correctly', async () => {
    // First set up with a successful search
    mockSearchParams = new URLSearchParams('q=3001')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: '3001', name: 'Brick 2 x 4' }
        ],
        total: 1,
        returned: 1,
        categories: [],
        pagination: {
          page: 1,
          limit: 100,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
    })
    
    render(<Home />)
    
    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/search?q=3001')
    })
  })

  test('should handle special characters in part parameter', async () => {
    // Set up search params with encoded special characters
    mockSearchParams = new URLSearchParams('part=3001%2B')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should preserve encoding in the URL replacement
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?part=3001%2B&q=3001%2B', { scroll: false })
    })
  })
})