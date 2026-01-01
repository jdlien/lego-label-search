/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHeicConverter } from '../../app/hooks/useHeicConverter'

// Mock heic-convert
jest.mock('heic-convert', () => {
  return jest.fn().mockImplementation(async ({ buffer, format, quality }) => {
    // Return a mock JPEG buffer
    return new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) // JPEG magic bytes
  })
})

import convert from 'heic-convert'

// Helper to create a mock File with arrayBuffer method (jsdom's File lacks it)
function createMockFile(name, type) {
  const buffer = new ArrayBuffer(10)
  const blob = new Blob([buffer], { type })
  const file = new File([blob], name, { type })
  // Add arrayBuffer method if missing
  if (!file.arrayBuffer) {
    file.arrayBuffer = () => Promise.resolve(buffer)
  }
  return file
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useHeicConverter', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useHeicConverter())

      expect(result.current.isConverting).toBe(false)
      expect(typeof result.current.convertToJpeg).toBe('function')
      expect(typeof result.current.isHeicFile).toBe('function')
      expect(typeof result.current.processFile).toBe('function')
    })
  })

  describe('isHeicFile', () => {
    it('should return true for .heic files', () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')
      expect(result.current.isHeicFile(heicFile)).toBe(true)
    })

    it('should return true for .heif files', () => {
      const { result } = renderHook(() => useHeicConverter())

      const heifFile = createMockFile('photo.heif', 'image/heif')
      expect(result.current.isHeicFile(heifFile)).toBe(true)
    })

    it('should return true for uppercase extensions', () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.HEIC', 'image/heic')
      expect(result.current.isHeicFile(heicFile)).toBe(true)
    })

    it('should return false for .jpg files', () => {
      const { result } = renderHook(() => useHeicConverter())

      const jpgFile = createMockFile('photo.jpg', 'image/jpeg')
      expect(result.current.isHeicFile(jpgFile)).toBe(false)
    })

    it('should return false for .png files', () => {
      const { result } = renderHook(() => useHeicConverter())

      const pngFile = createMockFile('photo.png', 'image/png')
      expect(result.current.isHeicFile(pngFile)).toBe(false)
    })
  })

  describe('convertToJpeg', () => {
    it('should convert HEIC file to JPEG', async () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      let convertedFile
      await act(async () => {
        convertedFile = await result.current.convertToJpeg(heicFile)
      })

      expect(convertedFile).toBeInstanceOf(File)
      expect(convertedFile.name).toBe('photo_converted.jpg')
      expect(convertedFile.type).toBe('image/jpeg')
    })

    it('should use default quality of 0.85', async () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      await act(async () => {
        await result.current.convertToJpeg(heicFile)
      })

      expect(convert).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'JPEG',
          quality: 0.85,
        })
      )
    })

    it('should use custom quality when specified', async () => {
      const { result } = renderHook(() => useHeicConverter({ quality: 0.5 }))

      const heicFile = createMockFile('photo.heic', 'image/heic')

      await act(async () => {
        await result.current.convertToJpeg(heicFile)
      })

      expect(convert).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 0.5,
        })
      )
    })

    it('should set isConverting to true during conversion', async () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      // Start conversion but don't await
      let conversionPromise
      act(() => {
        conversionPromise = result.current.convertToJpeg(heicFile)
      })

      // During conversion
      expect(result.current.isConverting).toBe(true)

      // After conversion
      await act(async () => {
        await conversionPromise
      })

      expect(result.current.isConverting).toBe(false)
    })

    it('should handle conversion errors', async () => {
      convert.mockRejectedValueOnce(new Error('Conversion failed'))

      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      await expect(
        act(async () => {
          await result.current.convertToJpeg(heicFile)
        })
      ).rejects.toThrow('Failed to convert HEIC image. Please try a different image format.')
    })

    it('should call onError callback when conversion fails', async () => {
      convert.mockRejectedValueOnce(new Error('Conversion failed'))
      const onError = jest.fn()

      const { result } = renderHook(() => useHeicConverter({ onError }))

      const heicFile = createMockFile('photo.heic', 'image/heic')

      try {
        await act(async () => {
          await result.current.convertToJpeg(heicFile)
        })
      } catch {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalledWith('Failed to convert HEIC image. Please try a different image format.')
    })

    it('should reset isConverting to false after error', async () => {
      convert.mockRejectedValueOnce(new Error('Conversion failed'))

      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      try {
        await act(async () => {
          await result.current.convertToJpeg(heicFile)
        })
      } catch {
        // Expected to throw
      }

      expect(result.current.isConverting).toBe(false)
    })
  })

  describe('processFile', () => {
    it('should convert HEIC files', async () => {
      const { result } = renderHook(() => useHeicConverter())

      const heicFile = createMockFile('photo.heic', 'image/heic')

      let processedFile
      await act(async () => {
        processedFile = await result.current.processFile(heicFile)
      })

      expect(processedFile.name).toBe('photo_converted.jpg')
      expect(processedFile.type).toBe('image/jpeg')
    })

    it('should return original file for non-HEIC files', async () => {
      const { result } = renderHook(() => useHeicConverter())

      const jpgFile = createMockFile('photo.jpg', 'image/jpeg')

      let processedFile
      await act(async () => {
        processedFile = await result.current.processFile(jpgFile)
      })

      expect(processedFile).toBe(jpgFile)
      expect(convert).not.toHaveBeenCalled()
    })
  })
})
