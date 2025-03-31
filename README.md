<!-- @format -->

# LEGO Part Label Maker

An application for searching LEGO parts and creating printable labels to organize your collection.

## Features

- Search for LEGO parts by number or name
- Browse parts by category
- Select parts to print labels
- Data includes 2,423 unique parts across 191 categories
- Responsive design that works on desktop and mobile

## Data Source

The data for this application comes from the Brick Architect website, which provides a comprehensive classification system for LEGO parts. The data was extracted and processed using Python scripts included in this repository.

## Technologies Used

- Next.js React framework
- Chakra UI for the component library
- Fuse.js for fuzzy search functionality
- Python for data processing

## Getting Started

### Prerequisites

- Node.js 14.6.0 or newer
- Python 3.6 or newer (for data processing scripts)

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

## License

This project is for educational and personal use only. The LEGO part data is sourced from Brick Architect and is used with permission for educational purposes.

## Acknowledgments

- Brick Architect for the comprehensive LEGO part classification system
- The LEGO Group for creating the amazing building blocks we all love

## Requirements

- Python 3.6+
- Tkinter (must be installed separately on some systems)
- SQLite3 (comes with Python)
- python-dotenv (for loading environment variables)

## Setup

### Install Dependencies

```
pip install python-dotenv pillow
```

### Configure Environment

The application uses environment variables from a `.env` file for configuration:

```
# Database path for Lego Parts Search application
DB_PATH=~/bin/lego-data/lego.sqlite
# Base data directory (contains images folder)
DATA_DIR=~/bin/lego-data
```

Copy the example above to a file named `.env` in the project root and adjust the paths as needed.

### Install Tkinter (if not already installed)

#### macOS (using Homebrew):

```
brew install python-tk
```

#### Linux (Ubuntu/Debian):

```
sudo apt-get install python3-tk
```

### Run the Application

You have several options to run the application:

#### Option 1: Direct Python Command (shows terminal window)

```
python3 lego_parts_search.py
```

#### Option 2: Launch Script (no terminal window)

```
./launch_app.py
```

#### Option 3: macOS App (created with create_app.sh)

Double-click the generated `Lego Parts Search.app` in Finder

## Launch Options Explained

1. **Python Direct** - Runs the app but keeps a terminal window open. If you close the terminal, the app closes.
2. **Launch Script** - Uses Python's subprocess to launch the app without keeping a terminal window. Simple and works on most platforms.
3. **macOS App** - A proper macOS application bundle you can double-click in Finder. No terminal window appears.

## How to Use

1. Start the application using one of the methods above
2. Type part of a name or part number in the search box
3. Results will automatically update as you type
4. The status bar at the bottom shows the number of results found

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS "parts" (
    part_num TEXT PRIMARY KEY,
    name TEXT,
    part_cat_id INTEGER,
    part_material TEXT,
    label_file TEXT DEFAULT NULL
);
CREATE INDEX idx_parts_label_file ON parts(label_file);
```

## Performance Optimizations

### Category Counts Caching

The API caches the count of parts for each category and its subcategories in a `parts_count` column in the `ba_categories` table. This avoids expensive recursive queries when retrieving categories.

The counts are updated:

- Automatically when parts are added, updated, or deleted via the API
- On server startup (configurable with `UPDATE_COUNTS_ON_STARTUP` environment variable)
- On a scheduled basis using a cron job (default: daily at 2 AM, configurable with `CATEGORY_COUNT_CRON` environment variable)
- Manually by calling the `/api/categories/update-counts` endpoint

The caching system ensures fast API responses while keeping count data up-to-date.

## To Do

- Scrape each of the https://brickarchitect.com/parts/category-<number> pages and extract the list of parts by getting the list of PNG images
