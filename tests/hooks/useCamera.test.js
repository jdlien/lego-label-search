/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useCamera } from '../../app/hooks/useCamera'

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn()
const mockStop = jest.fn()

const mockMediaStream = {
  getTracks: () => [{ stop: mockStop }],
}

beforeAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
    configurable: true,
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserMedia.mockResolvedValue(mockMediaStream)
})

describe('useCamera', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCamera())

      expect(result.current.isStreamActive).toBe(false)
      expect(result.current.cameraError).toBeNull()
      expect(result.current.videoRef).toBeDefined()
      expect(result.current.canvasRef).toBeDefined()
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useCamera())

      expect(typeof result.current.startCamera).toBe('function')
      expect(typeof result.current.stopCamera).toBe('function')
      expect(typeof result.current.takePicture).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('startCamera', () => {
    it('should request camera permissions with environment facing mode by default', async () => {
      const { result } = renderHook(() => useCamera())

      await act(async () => {
        await result.current.startCamera()
      })

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
      })
    })

    it('should request camera with user facing mode when specified', async () => {
      const { result } = renderHook(() => useCamera({ facingMode: 'user' }))

      await act(async () => {
        await result.current.startCamera()
      })

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'user' },
      })
    })

    it('should set error when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

      const { result } = renderHook(() => useCamera())

      await act(async () => {
        await result.current.startCamera()
      })

      expect(result.current.cameraError).toBe(
        'Could not access camera. Please ensure permissions are granted and a camera is available.'
      )
      expect(result.current.isStreamActive).toBe(false)
    })

    it('should call onError callback when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const onError = jest.fn()

      const { result } = renderHook(() => useCamera({ onError }))

      await act(async () => {
        await result.current.startCamera()
      })

      expect(onError).toHaveBeenCalledWith(
        'Could not access camera. Please ensure permissions are granted and a camera is available.'
      )
    })
  })

  describe('stopCamera', () => {
    it('should stop all tracks and set isStreamActive to false', async () => {
      const { result } = renderHook(() => useCamera())

      // Manually set up a mock video element with srcObject
      const mockVideo = document.createElement('video')
      mockVideo.srcObject = mockMediaStream

      // Override the ref's current value
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      })

      act(() => {
        result.current.stopCamera()
      })

      expect(mockStop).toHaveBeenCalled()
      expect(result.current.isStreamActive).toBe(false)
    })

    it('should handle case when video element has no srcObject', () => {
      const { result } = renderHook(() => useCamera())

      // Should not throw
      act(() => {
        result.current.stopCamera()
      })

      expect(result.current.isStreamActive).toBe(false)
    })
  })

  describe('takePicture', () => {
    it('should return null when stream is not active', () => {
      const { result } = renderHook(() => useCamera())

      let file
      act(() => {
        file = result.current.takePicture()
      })

      expect(file).toBeNull()
      expect(result.current.cameraError).toBe('Could not take picture. Camera not ready.')
    })

    it('should return null when video ref is not set', () => {
      const { result } = renderHook(() => useCamera())

      let file
      act(() => {
        file = result.current.takePicture()
      })

      expect(file).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear the camera error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

      const { result } = renderHook(() => useCamera())

      await act(async () => {
        await result.current.startCamera()
      })

      expect(result.current.cameraError).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.cameraError).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('should stop camera on unmount', async () => {
      const mockVideo = document.createElement('video')
      mockVideo.srcObject = mockMediaStream

      const { result, unmount } = renderHook(() => useCamera())

      // Set up video ref
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      })

      unmount()

      expect(mockStop).toHaveBeenCalled()
    })
  })
})
