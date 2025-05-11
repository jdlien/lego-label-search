/** @format */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Get LBX_UTILS_PATH from environment variable with fallback
const LBX_UTILS_PATH = process.env.LBX_UTILS_PATH || '../lbx-utils'

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
      console.error(`Original label not found at ${inputFile}`)
      return res.status(404).json({ success: false, message: 'Original label not found' })
    }

    // Check that the file is not empty
    try {
      const stats = fs.statSync(inputFile)
      if (stats.size === 0) {
        console.error(`Original label file is empty: ${inputFile}`)
        return res.status(500).json({
          success: false,
          message: 'Original label file exists but is empty or incomplete. Please try again.',
        })
      }
    } catch (statError) {
      console.error(`Error checking file stats: ${statError}`)
      return res.status(500).json({
        success: false,
        message: 'Error verifying original label file integrity.',
      })
    }

    // Get the path to the lbx_change.py script using environment variable
    const scriptPath = path.join(LBX_UTILS_PATH, 'src/lbx_utils', 'lbx_change.py')

    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Conversion script not found at ${scriptPath}`)
      return res.status(500).json({
        success: false,
        message: `Conversion script not found at ${scriptPath}. Please check LBX_UTILS_PATH environment variable.`,
      })
    }

    // Run the conversion script as a module
    const packageDir = LBX_UTILS_PATH
    const command = `cd "${packageDir}" && python3 -W ignore -m lbx_utils.lbx_change "${inputFile}" "${outputFile}" -f 16 -b 20 -l 24 -c -s 1.5 -m 1 -t`
    console.log(`Executing: ${command}`)

    const { stdout, stderr } = await execAsync(command)

    // Check if the output file was created despite warnings
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile)
      if (stats.size > 0) {
        // If the file exists and has content, consider it a success even if there were warnings
        console.log(`Conversion successful with warnings. Output file created: ${outputFile} (${stats.size} bytes)`)
        if (stderr && stderr.trim()) {
          console.warn('Script warnings (ignored):', stderr)
        }
        return res.status(200).json({ success: true })
      }
    }

    if (stderr && stderr.trim()) {
      console.error('Script error:', stderr)
      return res.status(500).json({ success: false, message: 'Failed to convert label: ' + stderr.trim() })
    }

    console.log('Conversion successful:', stdout)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error converting label:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to convert label: ' + (error.message || 'Unknown error'),
    })
  }
}
