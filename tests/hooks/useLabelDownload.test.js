/**
 * Tests for useLabelDownload hook
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Mock the ToastPop module
const mockError = jest.fn()
const mockWarning = jest.fn()

jest.mock('../../app/components/ToastPop', () => ({
  useToastHelpers: () => ({
    error: mockError,
    warning: mockWarning,
  }),
}))

// Import after mocking
const { useLabelDownload } = require('../../app/hooks/useLabelDownload')

// Mock fetch
const originalFetch = global.fetch

// Create the test container once
let container

beforeAll(() => {
  container = document.createElement('div')
  container.setAttribute('id', 'test-root')
  document.body.appendChild(container)
})

afterAll(() => {
  if (container) {
    document.body.removeChild(container)
  }
})

describe('useLabelDownload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  // Helper to create renderHook options with container
  const hookOptions = { container }

  describe('Initial state', () => {
    test('should initialize with correct default values', () => {
      const { result } = renderHook(() => useLabelDownload('12345'))

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isConverting).toBe(false)
      expect(result.current.labelExists).toBeNull()
      expect(typeof result.current.download12mm).toBe('function')
      expect(typeof result.current.download24mm).toBe('function')
      expect(typeof result.current.resetLabelExists).toBe('function')
    })

    test('should handle null partId', () => {
      const { result } = renderHook(() => useLabelDownload(null))

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isConverting).toBe(false)
    })

    test('should handle undefined partId', () => {
      const { result } = renderHook(() => useLabelDownload(undefined))

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isConverting).toBe(false)
    })
  })

  describe('download12mm', () => {
    test('should download label successfully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'])),
        })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download12mm()
      })

      expect(result.current.labelExists).toBe(true)
      expect(result.current.isDownloading).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith('/api/download-label?part_num=12345')
    })

    test('should set labelExists to false when label not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download12mm()
      })

      expect(result.current.labelExists).toBe(false)
      expect(mockWarning).toHaveBeenCalledWith('This part does not have a label available.')
    })

    test('should call onLabelNotFound callback when label not found', async () => {
      const onLabelNotFound = jest.fn()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() =>
        useLabelDownload('12345', { onLabelNotFound })
      )

      await act(async () => {
        await result.current.download12mm()
      })

      expect(onLabelNotFound).toHaveBeenCalled()
    })

    test('should handle fetch error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download12mm()
      })

      expect(mockError).toHaveBeenCalledWith('There was an error downloading the label.')
      expect(result.current.isDownloading).toBe(false)
    })

    test('should not download if partId is null', async () => {
      const { result } = renderHook(() => useLabelDownload(null))

      await act(async () => {
        await result.current.download12mm()
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('should prevent concurrent downloads', async () => {
      let resolveFirstCall
      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstCall = () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              })
          })
      )

      const { result } = renderHook(() => useLabelDownload('12345'))

      // Start first download
      act(() => {
        result.current.download12mm()
      })

      // Try second download while first is in progress
      await act(async () => {
        await result.current.download12mm()
      })

      // Only one fetch call should be made
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Cleanup: resolve the first call
      await act(async () => {
        resolveFirstCall()
      })
    })

    test('should stop event propagation when event is provided', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download12mm(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })
  })

  describe('download24mm', () => {
    test('should convert and download label successfully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'])),
        })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download24mm()
      })

      expect(result.current.isConverting).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith('/api/download-label?part_num=12345')
      expect(global.fetch).toHaveBeenCalledWith('/api/convert-label?part_num=12345')
    })

    test('should handle missing original label', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download24mm()
      })

      expect(result.current.labelExists).toBe(false)
      expect(mockWarning).toHaveBeenCalledWith(
        'The original label is not available for conversion.'
      )
    })

    test('should handle conversion error', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: false, message: 'Conversion failed' }),
        })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download24mm()
      })

      expect(mockError).toHaveBeenCalledWith('Conversion failed')
    })

    test('should handle SyntaxWarning gracefully', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: false,
              message: 'SyntaxWarning: invalid escape sequence in script',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'])),
        })

      const { result } = renderHook(() => useLabelDownload('12345'))

      await act(async () => {
        await result.current.download24mm()
      })

      expect(mockWarning).toHaveBeenCalledWith(
        'There were some warnings during conversion, but your file should be ready.'
      )
    })

    test('should not convert if partId is null', async () => {
      const { result } = renderHook(() => useLabelDownload(null))

      await act(async () => {
        await result.current.download24mm()
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('resetLabelExists', () => {
    test('should reset labelExists to null', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result } = renderHook(() => useLabelDownload('12345'))

      // Set labelExists to false
      await act(async () => {
        await result.current.download12mm()
      })
      expect(result.current.labelExists).toBe(false)

      // Reset it
      act(() => {
        result.current.resetLabelExists()
      })
      expect(result.current.labelExists).toBeNull()
    })
  })

  describe('partId changes', () => {
    test('should use updated partId after rerender', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      })

      const { result, rerender } = renderHook(
        ({ partId }) => useLabelDownload(partId),
        { initialProps: { partId: '12345' } }
      )

      await act(async () => {
        await result.current.download12mm()
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/download-label?part_num=12345')

      // Clear mocks and rerender with new partId
      jest.clearAllMocks()
      rerender({ partId: '67890' })

      await act(async () => {
        await result.current.download12mm()
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/download-label?part_num=67890')
    })
  })
})
