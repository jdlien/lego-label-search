/** @format */

import { proxyImagePrediction } from '../../../utils/brickognizeProxy'

/**
 * API route handler for Brickognize image prediction
 * POST /api/predict/parts
 */
export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it with formidable
    sizeLimit: '25mb', // Increase the raw request size limit
  },
}

export default async function handler(req, res) {
  return proxyImagePrediction(req, res)
}
