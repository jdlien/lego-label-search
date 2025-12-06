# CLAUDE.md

This is guidance to Claude Code when working in this repo.

## Project Overview

LEGO Part Label Search is a Next.js web application that allows users to search for LEGO parts and download printable labels for organizing collections. The app features comprehensive part database with thousands of unique parts, image search capabilities, and PWA functionality.

## Common Commands

### Development

- `pnpm dev` - Start development server (using Turbopack, usually already running)

### Production & Deployment

- `pnpm build` - Build for production with linting and type checking
- `pnpm start` - Start production server
- `pnpm deploy` - Run deployment script (on jdlien.com server)

### Database Management

- `pnpm db:rebuild` - Rebuild entire database from source data
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:update` - Update computed fields

### Testing

- `pnpm test` - Run all tests with clean output (console.log suppressed)
- `pnpm test --verbose` - Run tests with full console output for debugging
- `pnpm test <file>` - Run specific test file

### Maintenance Scripts

- `node scripts/maintenance/update_computed_fields.js` - Update all computed fields
- `node scripts/update_image_availability.js` - Update image availability flags

## Architecture

This application originally started as a loose collection of python scripts to scrape data from BrickArchitect label files and BrickArchitect.com, then Claude wrote a Next.js app to display the data. I since refactored it to the latest version of Next.js and Tailwind CSS.

### Tech Stack

- **Next.js 16** with App Router and TypeScript
- **SQLite3** database
- **Tailwind CSS 4.1.7** for styling
- **React Context API** for state management
- **Python scripts** for data processing and web scraping

### Database Structure

The SQLite database is mostly read-only for users, as LEGO part data is not updated frequently here. Given that, data is often denormalized as the priority is to make searches as fast as possible. To this end, there are also some computed fields that can be updated with the `pnpm db:update` command.

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
- When updating the database schema, usually it's safe to update 0001_create_initial_tables.js and rebuild the database with `pnpm db:rebuild`, as all the data in the database is easily recreated (for now).
- For significant new features, write tests first then we can iterate on the feature.
- When writing tests, ensure that logs and error output are not shown on the console unless running in verbose mode.
- After making significant changes (especially to multiple files at once) run the tests and fix any errors.

### Critical Search Implementation Notes

**⚠️ IMPORTANT: SearchBar.tsx Query State Management**

The SearchBar component has a carefully crafted approach to syncing query state with the URL that **must not be modified** without extreme care. The key principle is: **"local state is source of truth while typing"**.

**DO NOT** add `query` to the dependency array of the URL sync useEffect in SearchBar.tsx. This creates a feedback loop that breaks the typing experience:

1. User types → query state updates → effect runs → setQuery() called
2. React may re-render components, disrupting cursor position/focus
3. Debounced search (300ms) updates URL → searchParams changes → effect runs again
4. Creates a cycle that makes typing jerky and unresponsive

The current implementation only depends on `[searchParams]` and uses an ESLint disable comment. This ensures the effect only runs on:
- Initial page load
- Navigation (like clicking category pills) 
- URL changes from outside the component

This maintains smooth typing while still allowing category pills to clear the search field when navigating.

## Environment Variables

- `LBX_UTILS_PATH` - Path to label conversion utilities
- `UPDATE_COUNTS_ON_STARTUP` - Control startup database updates
- `CATEGORY_COUNT_CRON` - Schedule for category count updates

## File Structure Notes

- `/data/` - SQLite database, CSV files, and search indexes
- `/public/data/images/` - Part images (WebP format with original PNGs as fallback)
- `/scripts/` - Maintenance and data processing utilities
- Database connection pooling handles concurrent requests efficiently
