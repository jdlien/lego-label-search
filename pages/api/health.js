/** @format */

import { proxyHealthCheck } from '../../utils/brickognizeProxy'

/**
 * API route handler for Brickognize health checks
 * GET /api/health
 */
export default async function handler(req, res) {
  return proxyHealthCheck(req, res)
}
