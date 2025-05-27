/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import PartPage from '../../app/part/[id]/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

describe('Part Dynamic Route Page', () => {
  let mockPush
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create mock router push function
    mockPush = jest.fn()
    
    // Setup default mocks
    useRouter.mockReturnValue({
      push: mockPush,
    })
    
    useParams.mockReturnValue({
      id: '3001',
    })
  })

  test('should redirect to home page with part query parameter', async () => {
    render(<PartPage />)
    
    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?part=3001')
    })
  })

  test('should handle different part IDs', async () => {
    useParams.mockReturnValue({
      id: '3004',
    })
    
    render(<PartPage />)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?part=3004')
    })
  })

  test('should handle special characters in part ID', async () => {
    useParams.mockReturnValue({
      id: '3001+',
    })
    
    render(<PartPage />)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?part=3001%2B')
    })
  })

  test('should not redirect if no ID is provided', async () => {
    useParams.mockReturnValue({
      id: undefined,
    })
    
    render(<PartPage />)
    
    // Wait a bit to ensure useEffect runs
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('should not redirect if ID is empty string', async () => {
    useParams.mockReturnValue({
      id: '',
    })
    
    render(<PartPage />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('should render null (no visible content)', () => {
    const { container } = render(<PartPage />)
    
    expect(container.firstChild).toBeNull()
  })
})