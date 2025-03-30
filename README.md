<!-- @format -->

# Lego Label Search

A simple GUI application to search for Lego parts in a local SQLite database.

## Features

- Real-time search as you type
- Search by part number or name
- Display part details in a table view

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

## To Do

- Scrape each of the https://brickarchitect.com/parts/category-<number> pages and extract the list of parts by getting the list of PNG images
