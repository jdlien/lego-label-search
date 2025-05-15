/**
 * Proxy utilities for Brickognize API to handle CORS issues
 *
 * @format
 */

import formidable from 'formidable'
import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Agent } from 'https'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

const BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com'

// Define MIME types to be converted to WEBP by sharp
const CONVERT_TO_WEBP_MIME_TYPES = ['image/avif', 'image/tiff', 'image/gif']
const HEIC_MIME_TYPES = ['image/heic', 'image/heif']

// Create an HTTPS agent with relaxed SSL settings
const httpsAgent = new Agent({
  rejectUnauthorized: false,
})

/**
 * Proxies a health check request to the Brickognize API
 */
export async function proxyHealthCheck(req, res) {
  try {
    console.log('Proxying health check request to Brickognize API')
    const response = await fetch(`${BRICKOGNIZE_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      agent: httpsAgent,
      timeout: 10000, // 10 second timeout
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Error proxying health check:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Proxies an image prediction request to the Brickognize API
 * Handles multipart form data with the image file
 */
export async function proxyImagePrediction(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let responseSent = false

  try {
    console.log('Processing image prediction request')

    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB
    })

    const { files: parsedFiles } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error inside callback:', err)
          if (!responseSent && !res.headersSent) {
            responseSent = true
            res.status(500).json({ error: 'Error during form parsing.', details: err.message })
          }
          return reject(new Error('Form parsing failed'))
        }
        resolve({ fields, files })
      })
    })

    if (!parsedFiles || Object.keys(parsedFiles).length === 0) {
      console.error('No files found in request')
      return res.status(400).json({ error: 'No image file provided' })
    }

    const fileKey = parsedFiles.query_image ? 'query_image' : Object.keys(parsedFiles)[0]
    const imageFile = parsedFiles[fileKey][0]

    let originalFileBuffer = await fs.readFile(imageFile.filepath)
    let targetMimeType = imageFile.mimetype || 'image/jpeg'
    let targetFilename = imageFile.originalFilename || 'image.jpg'
    let targetFileBuffer = originalFileBuffer

    // Step 1: Convert HEIC/HEIF to JPEG using heic-convert
    if (HEIC_MIME_TYPES.includes(targetMimeType)) {
      console.log(`Attempting to convert ${targetFilename} from ${targetMimeType} to JPEG using heic-convert.`)
      try {
        targetFileBuffer = await heicConvert({
          buffer: originalFileBuffer, // Pass the buffer directly
          format: 'JPEG',
          quality: 0.9, // JPEG quality
        })
        targetMimeType = 'image/jpeg'
        targetFilename = `${targetFilename.substring(0, targetFilename.lastIndexOf('.') || targetFilename.length)}.jpg`
        console.log(`Successfully converted ${targetFilename} to JPEG using heic-convert.`)
      } catch (heicConversionError) {
        console.error(`Failed to convert ${targetFilename} from HEIC/HEIF to JPEG:`, heicConversionError)
        if (!responseSent && !res.headersSent) {
          responseSent = true
          return res.status(500).json({
            error: 'HEIC/HEIF image conversion to JPEG failed.',
            originalMimeType: imageFile.mimetype,
            details: heicConversionError.message,
          })
        }
        return // Stop further execution
      }
    }

    // Step 2: Convert other specified types (or the JPEG from HEIC) to WEBP using sharp
    if (
      CONVERT_TO_WEBP_MIME_TYPES.includes(targetMimeType) ||
      (HEIC_MIME_TYPES.includes(imageFile.mimetype) && targetMimeType === 'image/jpeg')
    ) {
      // The second part of the OR condition ensures that images originally HEIC (now JPEG) are also converted to WEBP
      const convertToWebpLogName = HEIC_MIME_TYPES.includes(imageFile.mimetype)
        ? `${imageFile.originalFilename} (originally HEIC)`
        : targetFilename
      console.log(`Attempting to convert ${convertToWebpLogName} from ${targetMimeType} to WEBP using sharp.`)
      try {
        targetFileBuffer = await sharp(targetFileBuffer).webp({ quality: 75 }).toBuffer()
        targetMimeType = 'image/webp'
        targetFilename = `${targetFilename.substring(0, targetFilename.lastIndexOf('.') || targetFilename.length)}.webp`
        console.log(`Successfully converted ${convertToWebpLogName} to WEBP using sharp.`)
      } catch (sharpConversionError) {
        console.error(`Failed to convert ${convertToWebpLogName} to WEBP using sharp:`, sharpConversionError)
        // If sharp fails, we might decide to send the JPEG (if it was HEIC) or the original,
        // or return an error. For now, let's return an error if sharp fails.
        if (!responseSent && !res.headersSent) {
          responseSent = true
          return res.status(500).json({
            error: 'Image conversion to WEBP failed using sharp.',
            originalMimeType: imageFile.mimetype, // report original for clarity
            attemptedInputToSharp: HEIC_MIME_TYPES.includes(imageFile.mimetype) ? 'image/jpeg' : imageFile.mimetype,
            details: sharpConversionError.message,
          })
        }
        return // Stop further execution
      }
    }

    const apiFormData = new FormData()
    apiFormData.append('query_image', targetFileBuffer, {
      filename: targetFilename,
      contentType: targetMimeType,
    })

    const formHeaders = apiFormData.getHeaders()
    const formBuffer = apiFormData.getBuffer()

    console.log('Sending request to Brickognize API...')

    try {
      const response = await fetch(`${BRICKOGNIZE_BASE_URL}/predict/parts/`, {
        method: 'POST',
        body: formBuffer,
        headers: {
          ...formHeaders,
          'Content-Length': formBuffer.length.toString(),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        agent: httpsAgent,
        timeout: 60000,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error response: ${response.status}`, errorText.substring(0, 500))
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { detail: errorText.substring(0, 500) }
        }
        responseSent = true
        return res.status(response.status).json(errorData)
      }

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse API response as JSON:', e)
        responseSent = true
        return res.status(500).json({
          error: 'Invalid JSON response from API',
          responsePreview: responseText.substring(0, 500),
        })
      }

      console.log('Successfully proxied image prediction.')
      responseSent = true
      return res.status(200).json(data)
    } catch (fetchError) {
      console.error('Fetch error during API call:', fetchError)
      responseSent = true
      if (fetchError.type === 'request-timeout' || fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'API request timed out' })
      }
      return res.status(500).json({
        error: `API call failed: ${fetchError.message}`,
      })
    }
  } catch (error) {
    console.error('Error in proxyImagePrediction handler:', error)
    if (!responseSent && !res.headersSent) {
      res.status(500).json({
        error: error.message || 'Failed to process image prediction',
      })
    }
  }
}
