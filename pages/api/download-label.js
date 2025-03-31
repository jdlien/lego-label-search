/** @format */

import fs from 'fs'
import path from 'path'
import https from 'https'

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

    // If label already exists, return success
    if (fs.existsSync(labelPath)) {
      return res.status(200).json({ success: true })
    }

    // Try to download the label from Brick Architect
    const url = `https://brickarchitect.com/label/${part_num}.lbx`

    const response = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          resolve(res)
        })
        .on('error', (err) => {
          reject(err)
        })
    })

    // Check if the label exists
    if (response.statusCode === 404) {
      return res.status(200).json({ success: false, message: 'Label not found' })
    }

    if (response.statusCode !== 200) {
      throw new Error(`Failed to download label: ${response.statusCode}`)
    }

    // Save the label file
    const fileStream = fs.createWriteStream(labelPath)
    response.pipe(fileStream)

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve)
      fileStream.on('error', reject)
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error downloading label:', error)
    return res.status(500).json({ success: false, message: 'Failed to download label' })
  }
}
