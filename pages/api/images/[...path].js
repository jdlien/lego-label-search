/** @format */
import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  // Get the file path from the URL
  const { path: filePath } = req.query
  const imagePath = path.join(process.cwd(), 'data', 'images', ...filePath)

  // Check if the file exists
  if (!fs.existsSync(imagePath)) {
    res.status(404).end()
    return
  }

  // Read the file
  const fileContents = fs.readFileSync(imagePath)

  // Set the content type based on file extension
  const extension = path.extname(imagePath).toLowerCase()
  let contentType = 'application/octet-stream'

  if (extension === '.png') {
    contentType = 'image/png'
  } else if (extension === '.webp') {
    contentType = 'image/webp'
  } else if (extension === '.jpg' || extension === '.jpeg') {
    contentType = 'image/jpeg'
  }

  // Return the file
  res.setHeader('Content-Type', contentType)
  res.status(200).send(fileContents)
}
