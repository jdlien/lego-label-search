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

    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error inside callback:', err)
          if (!responseSent && !res.headersSent) {
            responseSent = true
            res.status(500).json({ error: 'Error during form parsing.', details: err.message })
          }
          return reject(err)
        }
        resolve({ fields, files })
      })
    })

    if (!formData.files || Object.keys(formData.files).length === 0) {
      console.error('No files found in request')
      responseSent = true
      return res.status(400).json({ error: 'No image file provided' })
    }

    const fileKey = formData.files.query_image ? 'query_image' : Object.keys(formData.files)[0]
    const imageFile = formData.files[fileKey][0]

    const fileBuffer = await fs.readFile(imageFile.filepath)

    const apiFormData = new FormData()
    apiFormData.append('query_image', fileBuffer, {
      filename: imageFile.originalFilename || 'image.jpg',
      contentType: imageFile.mimetype || 'image/jpeg',
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
