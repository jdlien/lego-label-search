# CLAUDE.md

This is guidance to Claude Code when working in this repo.

## Project Overview

LEGO Part Label Search is a Next.js web application that allows users to search for LEGO parts and download printable labels for organizing collections. The app features comprehensive part database with thousands of unique parts, image search capabilities, and PWA functionality.

## Common Commands

### Development

- `npm run dev` - Start development server (using Turbopack)
- `npm run dev:no-turbo` - Start without Turbopack

### Production & Deployment

- `npm run build` - Build for production with linting and type checking
- `npm start` - Start production server
- `npm run deploy` - Run deployment script (on jdlien.com server)

### Database Management

- `npm run db:rebuild` - Rebuild entire database from source data
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:update` - Update computed fields

### Maintenance Scripts

- `node scripts/maintenance/update_computed_fields.js` - Update all computed fields
- `node scripts/update_category_sort_order.js` - Update category ordering
- `node scripts/update_image_availability.js` - Update image availability flags

## Architecture

This application originally started as a loose collection of python scripts to scrape data from BrickArchitect label files and BrickArchitect.com, then Claude wrote a Next.js app to display the data. I since refactored it to the latest version of Next.js and Tailwind CSS.

### Tech Stack

- **Next.js 15.3.2** with App Router and TypeScript
- **SQLite3** database
- **Tailwind CSS 4.1.7** for styling
- **React Context API** for state management
- **Python scripts** for data processing and web scraping

### Database Structure

The SQLite database is mostly read-only for users, as LEGO part data is not updated frequently here. Given that, data is often denormalized as the priority is to make searches as fast as possible. To this end, there are also some computed fields that can be updated with the `npm run db:update` command.

The SQLite database contains multiple tables:

- `parts` - Core part information with computed fields
- `ba_categories` - BrickArchitect categories with hierarchy
- `part_categories` - Legacy part categories
- `part_relationships` - Part relationships (alternates, replacements)
- `colors` and `elements` - Color definitions and part-color combinations

You can view the entire database schema in the scripts/migrations/000\*.js files, particularly 0001_create_initial_tables.js.

### API Design

- RESTful API with Next.js App Router in `/app/api/`
- Complex search with multi-word AND logic, dimension pattern recognition
- Recursive category filtering with cached counts for performance
- Database connection pooling and sophisticated query building with UNION ALL

### Data Processing Workflow

1. Python scripts scrape BrickArchitect and Rebrickable
2. Data normalized and stored in SQLite
3. Search indexes generated for performance
4. Images processed to WebP format with availability tracking

## Development Guidelines

- Don't automatically kill/restart the development server. Usually it's running already.
- Create atomic commits for each specific change to enable easy auditing/reverting
- Database updates are cached - use maintenance scripts when schema changes
- Image availability is tracked in database to avoid filesystem checks during searches
- When updating the database schema, usually it's safe to update 0001_create_initial_tables.js and rebuild the database with `npm run db:rebuild`, as all the data in the database is easily recreated (for now).

## Environment Variables

- `LBX_UTILS_PATH` - Path to label conversion utilities
- `UPDATE_COUNTS_ON_STARTUP` - Control startup database updates
- `CATEGORY_COUNT_CRON` - Schedule for category count updates

## File Structure Notes

- `/data/` - SQLite database, CSV files, and search indexes
- `/public/data/images/` - Part images (WebP format with original PNGs as fallback)
- `/scripts/` - Maintenance and data processing utilities
- Database connection pooling handles concurrent requests efficiently
