/** @format */
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const cron = require('node-cron')

const dev = process.env.NODE_ENV !== 'production'
const app = next({
  dev,
  turbo: process.env.USE_TURBOPACK === 'true' || dev, // Enable Turbopack based on env var or dev mode
})
const handle = app.getRequestHandler()

// These now only run in production
const { updateAllCategoryCounts, openDb } = require('./scripts/update_category_counts')
// const { updateAllAltPartIds } = require('./scripts/update_alt_part_ids')

// Define how often to update the category counts (by default, once per day at 2 AM)
const CRON_SCHEDULE = process.env.CATEGORY_COUNT_CRON || '0 2 * * *'
// Define how often to update alt part IDs (by default, once per day at 3 AM)
// const ALT_PARTS_CRON_SCHEDULE = process.env.ALT_PARTS_CRON || '0 3 * * *'

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)

    // Explicitly handle API routes
    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/api/')) {
      console.log(`Handling API route: ${parsedUrl.pathname}`)
      // Set proper headers for API routes
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    await handle(req, res, parsedUrl)
  })

  // Schedule the category counts update job only in production
  if (process.env.NODE_ENV === 'production') {
    console.log(`Scheduling category counts update with cron schedule: ${CRON_SCHEDULE}`)
    cron.schedule(CRON_SCHEDULE, async () => {
      console.log('Running scheduled category counts update...')
      try {
        const db = await openDb()
        await updateAllCategoryCounts(db)
        console.log('Scheduled category counts update completed successfully')
      } catch (error) {
        console.error('Error in scheduled category counts update:', error)
      }
    })
  }

  // Schedule the alt part IDs update job only in production
  // if (process.env.NODE_ENV === 'production') {
  //   console.log(`Scheduling alt part IDs update with cron schedule: ${ALT_PARTS_CRON_SCHEDULE}`)
  //   cron.schedule(ALT_PARTS_CRON_SCHEDULE, async () => {
  //     console.log('Running scheduled alt part IDs update...')
  //     try {
  //       const db = await openDb()
  //       await updateAllAltPartIds(db)
  //       console.log('Scheduled alt part IDs update completed successfully')
  //     } catch (error) {
  //       console.error('Error in scheduled alt part IDs update:', error)
  //     }
  //   })
  // }

  // Also update counts and alt part IDs on startup only in production
  if (process.env.NODE_ENV === 'production' && process.env.UPDATE_COUNTS_ON_STARTUP !== 'false') {
    console.log('Running initial category counts update...')
    openDb()
      .then((db) => updateAllCategoryCounts(db))
      .then(() => console.log('Initial category counts update completed successfully'))
      .catch((error) => console.error('Error in initial category counts update:', error))
  }

  // if (process.env.NODE_ENV === 'production' && process.env.UPDATE_ALT_PARTS_ON_STARTUP !== 'false') {
  //   console.log('Running initial alt part IDs update...')
  //   openDb()
  //     .then((db) => updateAllAltPartIds(db))
  //     .then(() => console.log('Initial alt part IDs update completed successfully'))
  //     .catch((error) => console.error('Error in initial alt part IDs update:', error))
  // }

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
