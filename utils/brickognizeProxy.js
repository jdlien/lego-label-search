/**
 * Proxy utilities for Brickognize API to handle CORS issues
 *
 * @format
 */

import formidable from 'formidable'
import { createReadStream, promises as fs } from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { Agent } from 'https'

const BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com'

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
    console.log('Health check response:', data)
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
    console.log('Request headers received by proxy:', JSON.stringify(req.headers, null, 2))
    console.log(`Is request complete before parsing? req.complete = ${req.complete}`)

    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB
    })

    console.log('About to call form.parse...')

    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        console.log('form.parse callback started.') // Log entry into the callback
        if (err) {
          console.error('Form parsing error inside callback:', err)
          // Ensure we don't try to send a response if one was already sent or if headers are sent.
          if (!responseSent && !res.headersSent) {
            responseSent = true
            res.status(500).json({ error: 'Error during form parsing.', details: err.message })
          }
          return reject(err) // Reject the promise to be caught by the outer try/catch
        }

        const fileKeys = files ? Object.keys(files) : []
        console.log('Form parsed successfully in callback, fileKeys:', fileKeys)

        if (files && fileKeys.length > 0) {
          const firstKey = fileKeys[0]
          console.log(`Found file in callback with key: ${firstKey}`, files[firstKey]?.[0]?.originalFilename)
        } else {
          console.log('No files found in parsed form data callback.')
        }
        resolve({ fields, files })
      })
    })

    console.log(
      'Form.parse promise resolved. formData.files keys:',
      formData.files ? Object.keys(formData.files) : 'N/A'
    )

    if (!formData.files || Object.keys(formData.files).length === 0) {
      console.error('No files found in request')
      responseSent = true
      return res.status(400).json({ error: 'No image file provided' })
    }

    // Get the file object - if query_image is not found, use the first file we find
    const fileKey = formData.files.query_image ? 'query_image' : Object.keys(formData.files)[0]
    const imageFile = formData.files[fileKey][0]

    console.log('Image file details:', {
      key: fileKey,
      name: imageFile.originalFilename,
      size: imageFile.size,
      path: imageFile.filepath,
      type: imageFile.mimetype,
    })

    // Read the file into buffer to avoid stream issues
    const fileBuffer = await fs.readFile(imageFile.filepath)
    console.log(`Read ${fileBuffer.length} bytes from file`)

    // Create form data for the API request
    const apiFormData = new FormData()
    apiFormData.append('query_image', fileBuffer, {
      filename: imageFile.originalFilename || 'image.jpg',
      contentType: imageFile.mimetype || 'image/jpeg',
    })

    // Get the combined headers from FormData (includes Content-Type with boundary)
    const formHeaders = apiFormData.getHeaders()

    // Get the fully rendered FormData buffer
    const formBuffer = apiFormData.getBuffer()

    console.log('Sending request to Brickognize API with proper form data')
    // console.log('FormData headers:', apiFormData.getHeaders()) // Keep for debugging if needed

    try {
      // Use a reasonable timeout
      const response = await fetch(`${BRICKOGNIZE_BASE_URL}/predict/parts/`, {
        method: 'POST',
        body: formBuffer, // Use the rendered buffer
        headers: {
          ...formHeaders, // Spread the headers from FormData (Content-Type with boundary)
          'Content-Length': formBuffer.length.toString(), // Explicitly set Content-Length
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        agent: httpsAgent,
        timeout: 60000, // 60 second timeout
      })

      console.log('Received response from Brickognize API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', response.status, errorText.substring(0, 500))

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { detail: errorText.substring(0, 500) }
        }

        responseSent = true
        return res.status(response.status).json(errorData)
      }

      // Try to get the response as text first
      const responseText = await response.text()
      console.log('API response received, length:', responseText.length)
      console.log('API response preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))

      let data
      try {
        data = JSON.parse(responseText)
        console.log('API response parsed successfully as JSON, keys:', Object.keys(data))
      } catch (e) {
        console.error('Failed to parse API response as JSON:', e)
        responseSent = true
        return res.status(500).json({
          error: 'Invalid JSON response from API',
          responsePreview: responseText.substring(0, 500),
        })
      }

      console.log('Sending successful response to client')
      responseSent = true
      return res.status(200).json(data)
    } catch (fetchError) {
      console.error('Fetch error during API call:', fetchError.message)
      responseSent = true

      if (fetchError.type === 'request-timeout' || fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'API request timed out' })
      }

      return res.status(500).json({
        error: `API call failed: ${fetchError.message}`,
      })
    }
  } catch (error) {
    console.error('Error proxying image prediction:', error)

    if (!responseSent && !res.headersSent) {
      res.status(500).json({
        error: error.message || 'Failed to process image prediction',
      })
    }
  } finally {
    console.log('Proxy image prediction finished.')
  }
}
