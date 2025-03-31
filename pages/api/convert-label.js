/** @format */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    const inputFile = path.join(labelsDir, `${part_num}.lbx`)
    const outputFile = path.join(labelsDir, `${part_num}-24mm.lbx`)

    // Check if the 24mm version already exists
    if (fs.existsSync(outputFile)) {
      return res.status(200).json({ success: true })
    }

    // Check if the original label exists
    if (!fs.existsSync(inputFile)) {
      return res.status(404).json({ success: false, message: 'Original label not found' })
    }

    // Get the path to the change-lbx.py script
    const scriptPath = path.join(process.cwd(), '..', 'lbx-utils', 'change-lbx.py')

    // Run the conversion script
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${inputFile}" "${outputFile}" -f 14 -b 20 -l 24 -c -s 1.5 -m 0.5`
    )

    if (stderr) {
      console.error('Script error:', stderr)
      return res.status(500).json({ success: false, message: 'Failed to convert label' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error converting label:', error)
    return res.status(500).json({ success: false, message: 'Failed to convert label' })
  }
}
