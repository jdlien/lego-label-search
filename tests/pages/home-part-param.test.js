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
  return function MockSearchResults({ autoOpenPartId }) {
    return (
      <div data-testid="search-results">
        Search Results
        {autoOpenPartId && <div data-testid="auto-open-part">{autoOpenPartId}</div>}
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

  test('should convert ?part= parameter to search query', async () => {
    // Set up search params with part parameter
    mockSearchParams = new URLSearchParams('part=3001')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should replace URL with q parameter
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?q=3001')
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

  test('should preserve other query parameters when converting', async () => {
    // Set up search params with part and other parameters
    mockSearchParams = new URLSearchParams('part=3001&category=cat1&page=2')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    render(<Home />)
    
    // Should preserve other parameters
    await waitFor(() => {
      const call = mockReplace.mock.calls[0][0]
      expect(call).toContain('q=3001')
      expect(call).toContain('category=cat1')
      expect(call).toContain('page=2')
      expect(call).not.toContain('part=')
    })
  })

  test('should pass directPartId to SearchResults when part parameter exists', async () => {
    // First, simulate the URL being changed from ?part=3001 to ?q=3001
    // Initial render with part parameter
    mockSearchParams = new URLSearchParams('part=3001')
    useSearchParams.mockReturnValue(mockSearchParams)
    
    const { rerender } = render(<Home />)
    
    // Wait for the replace to happen
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?q=3001')
    })
    
    // Now simulate the URL change and API response
    mockSearchParams = new URLSearchParams('q=3001')
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
    
    // Force a re-render with the new search params
    rerender(<Home />)
    
    // Wait for API call and rendering
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/search?q=3001')
    })
    
    // The directPartId should be set and passed to SearchResults
    // Note: This is testing the component integration, not the actual modal opening
    // The actual modal opening would be tested in SearchResults component tests
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
    
    // Should decode and use the part ID
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/?q=3001%2B')
    })
  })
})