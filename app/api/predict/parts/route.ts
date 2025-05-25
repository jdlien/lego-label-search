import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

const BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com'

// Define MIME types to be converted to WEBP by sharp
const CONVERT_TO_WEBP_MIME_TYPES = ['image/avif', 'image/tiff', 'image/gif']
const HEIC_MIME_TYPES = ['image/heic', 'image/heif']

/**
 * API route handler for Brickognize image prediction
 * POST /api/predict/parts
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Processing image prediction request')

    const formData = await request.formData()
    const imageFile = formData.get('query_image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    let targetMimeType = imageFile.type || 'image/jpeg'
    let targetFilename = imageFile.name || 'image.jpg'
    let targetFileBuffer: Buffer = imageBuffer

    // Step 1: Convert HEIC/HEIF to JPEG using heic-convert
    // Note: Frontend now handles HEIC conversion to JPEG, so this is a fallback
    if (HEIC_MIME_TYPES.includes(targetMimeType)) {
      console.log(`Attempting to convert ${targetFilename} from ${targetMimeType} to JPEG using heic-convert.`)
      try {
        const convertedBuffer = await heicConvert({
          buffer: imageBuffer,
          format: 'JPEG',
          quality: 0.9,
        })
        targetFileBuffer = Buffer.from(convertedBuffer)
        targetMimeType = 'image/jpeg'
        targetFilename = `${targetFilename.substring(0, targetFilename.lastIndexOf('.') || targetFilename.length)}.jpg`
        console.log(`Successfully converted ${targetFilename} to JPEG using heic-convert.`)
      } catch (heicConversionError) {
        const errorMessage = heicConversionError instanceof Error ? heicConversionError.message : 'Unknown error'
        console.error(`Failed to convert ${targetFilename} from HEIC/HEIF to JPEG:`, heicConversionError)
        return NextResponse.json(
          {
            error: 'HEIC/HEIF image conversion to JPEG failed.',
            originalMimeType: imageFile.type,
            details: errorMessage,
          },
          { status: 500 }
        )
      }
    }

    // Step 2: Convert specified types to WEBP using sharp
    // Skip WEBP conversion for JPEG files that have "_converted" in the name (frontend converted)
    const isAlreadyConverted = targetFilename.includes('_converted')
    if (
      CONVERT_TO_WEBP_MIME_TYPES.includes(targetMimeType) ||
      (HEIC_MIME_TYPES.includes(imageFile.type) && targetMimeType === 'image/jpeg' && !isAlreadyConverted)
    ) {
      const convertToWebpLogName = HEIC_MIME_TYPES.includes(imageFile.type)
        ? `${imageFile.name} (originally HEIC)`
        : targetFilename
      console.log(`Attempting to convert ${convertToWebpLogName} from ${targetMimeType} to WEBP using sharp.`)
      try {
        targetFileBuffer = await sharp(targetFileBuffer).webp({ quality: 75 }).toBuffer()
        targetMimeType = 'image/webp'
        targetFilename = `${targetFilename.substring(0, targetFilename.lastIndexOf('.') || targetFilename.length)}.webp`
        console.log(`Successfully converted ${convertToWebpLogName} to WEBP using sharp.`)
      } catch (sharpConversionError) {
        const errorMessage = sharpConversionError instanceof Error ? sharpConversionError.message : 'Unknown error'
        console.error(`Failed to convert ${convertToWebpLogName} to WEBP using sharp:`, sharpConversionError)
        return NextResponse.json(
          {
            error: 'Image conversion to WEBP failed using sharp.',
            originalMimeType: imageFile.type,
            attemptedInputToSharp: HEIC_MIME_TYPES.includes(imageFile.type) ? 'image/jpeg' : imageFile.type,
            details: errorMessage,
          },
          { status: 500 }
        )
      }
    } else if (isAlreadyConverted) {
      console.log(`Skipping backend conversion for ${targetFilename} - already converted by frontend`)
    }

    // Create form data for the API request
    const apiFormData = new FormData()
    const blob = new Blob([targetFileBuffer], { type: targetMimeType })
    apiFormData.append('query_image', blob, targetFilename)

    console.log('Sending request to Brickognize API...')

    const response = await fetch(`${BRICKOGNIZE_BASE_URL}/predict/parts/`, {
      method: 'POST',
      body: apiFormData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error response: ${response.status}`, errorText.substring(0, 500))
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { detail: errorText.substring(0, 500) }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    console.log('Successfully proxied image prediction.')
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in image prediction handler:', error)
    return NextResponse.json(
      {
        error: errorMessage || 'Failed to process image prediction',
      },
      { status: 500 }
    )
  }
}
