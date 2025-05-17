/** @format */

import fs from 'fs'
import path from 'path'
import https from 'https'

// Simple check for LBX file signature/magic bytes
function isValidLbxFile(buffer) {
  // LBX files should be a ZIP file format starting with PK\x03\x04
  if (buffer.length < 4) return false

  // Check for ZIP file signature/magic bytes
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { part_num } = req.query

  if (!part_num) {
    return res.status(400).json({ success: false, message: 'Part number is required' })
  }

  try {
    // Create labels directory if it doesn't exist
    const labelsDir = path.join(process.cwd(), 'public', 'data', 'labels')
    if (!fs.existsSync(labelsDir)) {
      fs.mkdirSync(labelsDir, { recursive: true })
    }

    const labelPath = path.join(labelsDir, `${part_num}.lbx`)

    // If label already exists, verify it's not empty and return success
    if (fs.existsSync(labelPath)) {
      try {
        const stats = fs.statSync(labelPath)
        if (stats.size === 0) {
          // If file exists but is empty, delete it and re-download
          fs.unlinkSync(labelPath)
          console.log(`Deleted empty label file: ${labelPath}`)
        } else {
          // Check if the file contains an error message
          const fileBuffer = fs.readFileSync(labelPath)

          // Check if it's a text file with error message
          if (fileBuffer.length < 1000) {
            // Only check small files
            const fileContent = fileBuffer.toString('utf8').trim()
            if (fileContent.startsWith('ERROR:') || fileContent.includes('Part image not found')) {
              // Delete file with error message and re-download
              fs.unlinkSync(labelPath)
              console.log(`Deleted label file with error message: ${labelPath}`)
            } else if (!isValidLbxFile(fileBuffer)) {
              // Not a valid LBX/ZIP file
              fs.unlinkSync(labelPath)
              console.log(`Deleted invalid LBX file: ${labelPath}`)
            } else {
              // File exists and has valid content
              return res.status(200).json({ success: true })
            }
          } else if (!isValidLbxFile(fileBuffer)) {
            // Not a valid LBX/ZIP file
            fs.unlinkSync(labelPath)
            console.log(`Deleted invalid LBX file: ${labelPath}`)
          } else {
            // File exists and has valid content
            return res.status(200).json({ success: true })
          }
        }
      } catch (statError) {
        console.error(`Error checking existing file: ${statError}`)
        // Continue with download attempt
      }
    }

    // Try to download the label from Brick Architect
    const url = `https://brickarchitect.com/label/${part_num}.lbx`
    console.log(`Downloading label from: ${url}`)

    // Download the entire response content first to check its validity
    const responseBuffer = await new Promise((resolve, reject) => {
      const chunks = []
      const request = https.get(url, (response) => {
        // Even if status is 200, we'll check content
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP status ${response.statusCode}`))
        }

        response.on('data', (chunk) => {
          chunks.push(chunk)
        })

        response.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      request.on('error', (err) => {
        reject(err)
      })
    })

    // Check if the response contains an error message
    const responseStart = responseBuffer.slice(0, Math.min(1000, responseBuffer.length))
    const responseStartText = responseStart.toString('utf8')

    if (
      responseStartText.startsWith('ERROR:') ||
      responseStartText.includes('Part image not found') ||
      responseStartText.includes('<html') ||
      responseStartText.includes('<!DOCTYPE')
    ) {
      console.log(`Invalid label response for part ${part_num}: "${responseStartText.substring(0, 100)}..."`)
      return res.status(200).json({
        success: false,
        message: 'Label not found',
      })
    }

    // Check if the file appears to be a valid LBX file (ZIP format)
    if (!isValidLbxFile(responseBuffer)) {
      console.log(`Downloaded file for part ${part_num} is not a valid LBX/ZIP file`)
      return res.status(200).json({
        success: false,
        message: 'Downloaded file is not a valid LBX file',
      })
    }

    // If we got here, the response is valid, so save it to file
    fs.writeFileSync(labelPath, responseBuffer)

    // Verify the file was written correctly
    const stats = fs.statSync(labelPath)
    if (stats.size === 0) {
      fs.unlinkSync(labelPath)
      throw new Error('Written file is empty')
    }

    console.log(`Successfully downloaded label: ${labelPath} (${stats.size} bytes)`)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error downloading label:', error)

    // Remove any partial or invalid files
    try {
      const labelPath = path.join(process.cwd(), 'public', 'data', 'labels', `${part_num}.lbx`)
      if (fs.existsSync(labelPath)) {
        fs.unlinkSync(labelPath)
        console.log(`Removed invalid label file: ${labelPath}`)
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }

    return res.status(200).json({
      success: false,
      message: 'Label not available: ' + (error.message || 'Unknown error'),
    })
  }
}
