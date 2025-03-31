/** @format */
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const cron = require('node-cron')
const { updateAllCategoryCounts, openDb } = require('./scripts/update_category_counts')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Define how often to update the category counts (by default, once per day at 2 AM)
const CRON_SCHEDULE = process.env.CATEGORY_COUNT_CRON || '0 2 * * *'

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  // Schedule the category counts update job
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

  // Also update counts on startup
  if (process.env.UPDATE_COUNTS_ON_STARTUP !== 'false') {
    console.log('Running initial category counts update...')
    openDb()
      .then((db) => updateAllCategoryCounts(db))
      .then(() => console.log('Initial category counts update completed successfully'))
      .catch((error) => console.error('Error in initial category counts update:', error))
  }

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
