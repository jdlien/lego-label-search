/** @format */
const { createServer } = require('http')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
// Note: turbo option removed - Turbopack is now default in Next.js 16
const handle = app.getRequestHandler()

// Removed startup database updates - these can be run manually when needed
// using the maintenance scripts

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    // Use WHATWG URL API instead of deprecated url.parse()
    const url = new URL(req.url, `http://${req.headers.host}`)

    // Explicitly handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Set proper headers for API routes
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    await handle(req, res)
  })

  // Cron jobs and startup database updates removed for simplicity
  // Database maintenance can be run manually or via separate cron service
  // Use: npm run db:update to update computed fields manually

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
