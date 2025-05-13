<!-- @format -->

# LEGO Part Label Maker

An application for searching LEGO parts and downloading printable labels to organize your collection.

## Features

- Search for LEGO parts by number or name
- Browse parts by category
- Data includes 2,423 unique parts across 191 categories
- Responsive design that works on desktop and mobile

## Data Source

Some of the data and categories for this application comes from the Brick Architect website, which provides a comprehensive classification system for LEGO parts. The data was extracted and processed using Python scripts included in this repository.

## Technologies Used

- Next.js React framework
- Chakra UI for the component library
- Python for data processing

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/jdlien/lego-label-search.git
   cd lego-label-search
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Data Processing

If you want to update the data from the source:

1. Run the data extraction script:

   ```
   python parse_ba_categories.py
   ```

2. Generate the search index:
   ```
   python create_search_index.py
   ```

## Build for Production

```
npm run build
npm start
```

## Acknowledgments

- Brick Architect for the comprehensive LEGO part classification system
- Rebrickable for extensive data on LEGO parts
- The LEGO Group for creating the amazing building blocks we all love

## Performance Optimizations

### Category Counts Caching

The API caches the count of parts for each category and its subcategories in a `parts_count` column in the `ba_categories` table. This avoids expensive recursive queries when retrieving categories.

The counts are updated:

- Automatically when parts are added, updated, or deleted via the API
- On server startup (configurable with `UPDATE_COUNTS_ON_STARTUP` environment variable)
- On a scheduled basis using a cron job (default: daily at 2 AM, configurable with `CATEGORY_COUNT_CRON` environment variable)
- Manually by calling the `/api/categories/update-counts` endpoint

The caching system ensures fast API responses while keeping count data up-to-date.

## TODO

- When a part has many alternates, they may all show at once. I might prefer to consolidate the search results to only show one record if it has many alternates.
