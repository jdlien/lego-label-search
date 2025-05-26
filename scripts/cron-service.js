/** @format */
const cron = require('node-cron')

// Import the update functions
const { updateCategoryCounts } = require('./maintenance/update_computed_fields')

// Define cron schedules from environment variables
const CRON_SCHEDULE = process.env.CATEGORY_COUNT_CRON || '0 2 * * *'

console.log('Starting LEGO Label Search Cron Service...')

// Schedule the category counts update job
console.log(`Scheduling category counts update with cron schedule: ${CRON_SCHEDULE}`)
cron.schedule(CRON_SCHEDULE, async () => {
  console.log('Running scheduled category counts update...')
  try {
    await updateCategoryCounts()
    console.log('Scheduled category counts update completed successfully')
  } catch (error) {
    console.error('Error in scheduled category counts update:', error)
  }
})

// Update counts on startup
if (process.env.UPDATE_COUNTS_ON_STARTUP !== 'false') {
  console.log('Running initial category counts update...')
  updateCategoryCounts()
    .then(() => console.log('Initial category counts update completed successfully'))
    .catch((error) => console.error('Error in initial category counts update:', error))
}

console.log('Cron service started successfully')

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Cron service shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Cron service shutting down...')
  process.exit(0)
})
