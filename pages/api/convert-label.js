/** @format */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Get LBX_UTILS_PATH from environment variable with fallback
const LBX_UTILS_PATH = process.env.LBX_UTILS_PATH || '../lbx-utils'
// Path to Python virtual environment
// Setup: (run as root or with sudo)
// 1. python3 -m venv /opt/lbx
// 2. /opt/lbx/bin/pip install -e /path/to/lbx-utils
// 3. chown -R www-data:www-data /opt/lbx  # adjust user as needed
const LBX_PYTHON_ENV = process.env.LBX_PYTHON_ENV || '/opt/lbx/bin/python3'

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
      console.log(`Output file ${outputFile} already exists. Skipping conversion.`)
      return res.status(200).json({ success: true, message: 'Converted file already exists.' })
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
      console.error(`Error checking file stats for ${inputFile}: ${statError}`)
      return res.status(500).json({
        success: false,
        message: 'Error verifying original label file integrity.',
      })
    }

    // Assuming lbx_utils package is inside an 'src' directory within LBX_UTILS_PATH
    const pythonPathForModule = path.join(LBX_UTILS_PATH, 'src')

    // Get the path to the lbx_change.py script using environment variable (for reference, not directly used in -m command)
    // const scriptPath = path.join(LBX_UTILS_PATH, 'src/lbx_utils', 'lbx_change.py') // Expected location

    // Check if the assumed 'src' directory for PYTHONPATH exists
    if (!fs.existsSync(pythonPathForModule)) {
      console.error(
        `PYTHONPATH directory not found: ${pythonPathForModule}. Check LBX_UTILS_PATH and project structure.`
      )
      return res.status(500).json({
        success: false,
        message: `Configuration error: Python package path not found at ${pythonPathForModule}.`,
      })
    }

    // Run the conversion script as a module
    const command = `cd "${LBX_UTILS_PATH}" && PYTHONPATH="${pythonPathForModule}" ${LBX_PYTHON_ENV} -W ignore -m lbx_utils.lbx_change "${inputFile}" "${outputFile}" -f 16 -b 20 -l 24 -c -s 1.5 -m 1 -t`
    console.log(`Executing conversion command: ${command}`)

    try {
      const { stdout, stderr } = await execAsync(command)

      // Always log stdout and stderr for debugging purposes
      if (stdout && stdout.trim()) {
        console.log('Python script stdout:', stdout)
      }
      // stderr might contain warnings even on success, or actual errors
      if (stderr && stderr.trim()) {
        console.warn('Python script stderr:', stderr)
      }

      // Check if the output file was created and has content
      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile)
        if (stats.size > 0) {
          console.log(`Conversion successful. Output file: ${outputFile} (${stats.size} bytes)`)
          return res.status(200).json({ success: true, warnings: stderr && stderr.trim() ? stderr.trim() : null })
        } else {
          console.error(`Output file ${outputFile} was created but is empty.`)
          return res.status(500).json({
            success: false,
            message: 'Conversion resulted in an empty file. ' + (stderr || 'Script error details unavailable.'),
          })
        }
      } else {
        // If output file does not exist, it's a failure. stderr should have the error.
        console.error('Output file not created by the script.')
        return res.status(500).json({
          success: false,
          message:
            'Failed to convert label: Output file not generated. ' + (stderr || 'Script error details unavailable.'),
        })
      }
    } catch (execError) {
      // Catch errors from execAsync (e.g., command fails, non-zero exit)
      console.error('Error executing Python script via execAsync:', execError.message)
      if (execError.stdout) {
        console.error('execAsync stdout on error:', execError.stdout)
      }
      if (execError.stderr) {
        console.error('execAsync stderr on error:', execError.stderr) // This will contain the ModuleNotFoundError
      }
      // For more detailed diagnostics, log the command that was attempted if available on the error object
      if (execError.cmd) {
        console.error('Failed command (from execError.cmd):', execError.cmd)
      }
      console.error('Full execAsync error object:', execError) // Log the whole error object for more details

      return res.status(500).json({
        success: false,
        message: 'Execution of conversion script failed: ' + (execError.stderr || execError.message || 'Unknown error'),
        details: {
          // Provide some non-sensitive details back if helpful
          stdout: execError.stdout || null,
          stderr: execError.stderr || null,
          exitCode: execError.code || null,
        },
      })
    }
  } catch (error) {
    // Catch other synchronous errors in the handler logic
    console.error('Unhandled error in /api/convert-label handler:', error)
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred: ' + (error.message || 'Unknown error'),
    })
  }
}
