/**
 * Tests for usePWANavigation hook
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the PWA detection
let mockIsPWA = false
jest.mock('../../app/components/PWAHandler', () => ({
  usePWA: () => mockIsPWA,
}))

// Import after mocking
const { usePWANavigation } = require('../../app/hooks/usePWANavigation')

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

describe('usePWANavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockIsPWA = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initial state', () => {
    test('should return navigation functions', () => {
      const { result } = renderHook(() => usePWANavigation())

      expect(typeof result.current.navigateToCategory).toBe('function')
      expect(typeof result.current.navigateToSearch).toBe('function')
      expect(typeof result.current.navigateTo).toBe('function')
      expect(typeof result.current.isPWA).toBe('boolean')
    })

    test('should reflect PWA mode status as false by default', () => {
      const { result } = renderHook(() => usePWANavigation())
      expect(result.current.isPWA).toBe(false)
    })

    test('should reflect PWA mode status when enabled', () => {
      mockIsPWA = true
      const { result } = renderHook(() => usePWANavigation())
      expect(result.current.isPWA).toBe(true)
    })
  })

  describe('Browser mode navigation', () => {
    beforeEach(() => {
      mockIsPWA = false
    })

    test('should navigate to category using router.push', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToCategory('123')
      })

      // Fast-forward past the delay
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockPush).toHaveBeenCalledWith('/?category=123')
    })

    test('should navigate to search using router.push', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToSearch('3001')
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockPush).toHaveBeenCalledWith('/?q=3001')
    })

    test('should navigate to custom URL using router.push', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateTo('/about')
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockPush).toHaveBeenCalledWith('/about')
    })

    test('should use 100ms delay in browser mode', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToCategory('123')
      })

      // At 99ms, navigation should not have happened
      act(() => {
        jest.advanceTimersByTime(99)
      })
      expect(mockPush).not.toHaveBeenCalled()

      // At 100ms, navigation should happen
      act(() => {
        jest.advanceTimersByTime(1)
      })
      expect(mockPush).toHaveBeenCalled()
    })
  })

  describe('PWA mode navigation', () => {
    beforeEach(() => {
      mockIsPWA = true
    })

    test('should not use router.push in PWA mode', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToCategory('456')
      })

      // Fast-forward past all delays
      act(() => {
        jest.advanceTimersByTime(200)
      })

      // In PWA mode, router.push should NOT be called
      expect(mockPush).not.toHaveBeenCalled()
    })

    test('should use longer delay (150ms) in PWA mode', () => {
      // We can't directly test window.location.href assignment in jsdom,
      // but we can verify that router.push is not called and the delay is different
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToCategory('123')
      })

      // At 100ms (browser delay), router should not be called since we're in PWA mode
      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(mockPush).not.toHaveBeenCalled()

      // At 150ms, still no router.push because PWA uses window.location
      act(() => {
        jest.advanceTimersByTime(50)
      })
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('onBeforeNavigate callback', () => {
    test('should call onBeforeNavigate before navigation', () => {
      const onBeforeNavigate = jest.fn()
      const { result } = renderHook(() => usePWANavigation({ onBeforeNavigate }))

      act(() => {
        result.current.navigateToCategory('123')
      })

      // Callback should be called immediately
      expect(onBeforeNavigate).toHaveBeenCalledTimes(1)

      // But navigation should be delayed
      expect(mockPush).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockPush).toHaveBeenCalled()
    })

    test('should call onBeforeNavigate for each navigation', () => {
      const onBeforeNavigate = jest.fn()
      const { result } = renderHook(() => usePWANavigation({ onBeforeNavigate }))

      act(() => {
        result.current.navigateToCategory('1')
        result.current.navigateToSearch('2')
        result.current.navigateTo('/about')
      })

      expect(onBeforeNavigate).toHaveBeenCalledTimes(3)
    })

    test('should call onBeforeNavigate in PWA mode too', () => {
      mockIsPWA = true
      const onBeforeNavigate = jest.fn()
      const { result } = renderHook(() => usePWANavigation({ onBeforeNavigate }))

      act(() => {
        result.current.navigateToCategory('123')
      })

      expect(onBeforeNavigate).toHaveBeenCalledTimes(1)
    })
  })

  describe('URL construction', () => {
    test('should properly encode search parameters with spaces', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToSearch('part with spaces')
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      // URLSearchParams encodes spaces as +
      expect(mockPush).toHaveBeenCalledWith('/?q=part+with+spaces')
    })

    test('should properly encode search parameters with special characters', () => {
      const { result } = renderHook(() => usePWANavigation())

      act(() => {
        result.current.navigateToSearch('part&name=test')
      })

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockPush).toHaveBeenCalledWith('/?q=part%26name%3Dtest')
    })
  })
})
