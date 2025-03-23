#!/usr/bin/env python3
import os
import sys
import json
import sqlite3
import logging
import platform
import traceback
import argparse
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog
from pathlib import Path

# Parse command line arguments
parser = argparse.ArgumentParser(description='Lego Parts Search Application')
parser.add_argument('--debug', action='store_true', help='Enable debug mode with visible debug label')
args = parser.parse_args()

# Ensure we're in the script's directory
script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
os.chdir(script_dir)

# Set up logging
logs_dir = script_dir / "logs"
logs_dir.mkdir(exist_ok=True)
log_file = logs_dir / "lego_search.log"

# Configure more detailed logging
logging.basicConfig(
    filename=log_file,
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    force=True
)

# Add console handler for debugging
console = logging.StreamHandler()
console.setLevel(logging.DEBUG)
logging.getLogger('').addHandler(console)

# Log system information
logging.info(f"Python version: {sys.version}")
logging.info(f"Platform: {platform.platform()}")
logging.info(f"Tkinter version: {tk.TkVersion}")
logging.info(f"Environment variables: {os.environ.get('DISPLAY', 'DISPLAY not set')}")
logging.info(f"Current working directory: {os.getcwd()}")

# Import macOS specific modules if available
if sys.platform == 'darwin':
    try:
        from subprocess import call
        logging.info("Importing macOS-specific modules")
    except ImportError as e:
        logging.warning(f"Could not import macOS modules: {e}")

class LegoPartsSearch(tk.Tk):
    def __init__(self):
        logging.info("Initializing LegoPartsSearch application")
        try:
            super().__init__()
            logging.info("Tkinter root window initialized")

            # Set up preferences file path
            self.preferences_file = os.path.join(script_dir, "preferences.json")
            self.preferences = self.load_preferences()
            logging.info(f"Loaded preferences: {self.preferences}")

            # Debug information on screen (only if --debug flag is set)
            self.debug_mode = args.debug
            if self.debug_mode:
                self.debug_label = tk.Label(self, text="Initializing...", bg="yellow", fg="black")
                self.debug_label.pack(side=tk.BOTTOM, fill=tk.X)
                self.update_debug("Window created")
            else:
                self.debug_label = None
                logging.debug("Debug mode disabled, no debug label shown")

            # Configure window
            self.title("Lego Parts Search")
            self.geometry("800x600")
            self.minsize(600, 400)

            # macOS specific settings to ensure window appears
            if sys.platform == 'darwin':
                self.createcommand('::tk::mac::ReopenApplication', self.deiconify)
                self.createcommand('::tk::mac::Quit', self.on_closing)
                logging.info("Added macOS-specific window commands")

            self.update_debug("Window configured")

            # Set up database connection
            db_path = os.path.expanduser("~/bin/lego-data/lego.sqlite")
            logging.info(f"Connecting to database at: {db_path}")
            try:
                self.connection = sqlite3.connect(db_path)
                self.connection.row_factory = sqlite3.Row
                self.cursor = self.connection.cursor()
                logging.info("Database connection established")
                self.update_debug("Database connected")

                # Load categories for dropdown
                self.categories = self.load_categories()
                logging.info(f"Loaded {len(self.categories)} categories")
            except sqlite3.Error as e:
                error_msg = f"Database error: {e}"
                logging.error(error_msg)
                self.update_debug(f"DB ERROR: {e}")
                self.show_error(error_msg)
                return

            # Initialize label files root path from preferences or empty string
            self.label_files_root = self.preferences.get("label_files_root", "")

            # Create UI elements
            try:
                self.create_widgets()
                self.update_debug("UI created successfully")

                # Apply saved preferences after UI is created
                self.apply_preferences()
            except Exception as e:
                error_msg = f"UI creation error: {e}"
                logging.error(error_msg, exc_info=True)
                self.update_debug(f"UI ERROR: {str(e)[:50]}")
                self.show_error(error_msg)
                return

            # Remove the grid layout configuration since we're using pack
            try:
                # self.columnconfigure(0, weight=1)  # Removed
                # self.rowconfigure(1, weight=1)     # Removed
                logging.info("Layout manager configured")
            except Exception as e:
                logging.error(f"Layout manager error: {e}", exc_info=True)
                self.update_debug(f"Layout ERROR: {e}")

            # Initial focus
            try:
                self.search_entry.focus_set()
                logging.info("Initial focus set")
            except Exception as e:
                logging.error(f"Focus error: {e}")
                self.update_debug(f"Focus ERROR: {e}")

            logging.info("Application initialized successfully")
            self.update_debug("Ready")

        except Exception as e:
            logging.critical(f"Initialization failure: {e}", exc_info=True)
            # Try to show something even if initialization fails
            try:
                if self.debug_mode and not hasattr(self, 'debug_label'):
                    self = tk.Tk()
                    self.debug_label = tk.Label(self, text=f"CRITICAL ERROR: {e}", bg="red", fg="white")
                    self.debug_label.pack(fill=tk.BOTH, expand=True)
            except:
                logging.critical("Could not even create fallback UI", exc_info=True)

    def update_debug(self, message):
        """Update the debug label with a message"""
        logging.debug(f"UI Update: {message}")
        try:
            if self.debug_mode and self.debug_label:
                self.debug_label.config(text=f"Debug: {message}")
                self.update_idletasks()  # Force update
        except Exception as e:
            logging.error(f"Could not update debug label: {e}")

    def show_error(self, message):
        """Display error message in a popup window"""
        logging.error(f"Showing error dialog: {message}")
        try:
            error_window = tk.Toplevel(self)
            error_window.title("Error")
            error_window.geometry("400x200")

            error_label = ttk.Label(error_window, text=message, wraplength=380)
            error_label.pack(padx=20, pady=20)

            ok_button = ttk.Button(error_window, text="OK", command=error_window.destroy)
            ok_button.pack(pady=20)

            # Make sure error window is visible
            error_window.lift()
            error_window.attributes("-topmost", True)
            error_window.after(100, lambda: error_window.attributes("-topmost", False))
        except Exception as e:
            logging.error(f"Could not show error dialog: {e}", exc_info=True)
            if self.debug_mode:
                self.update_debug(f"Error dialog failed: {e}")

    def load_categories(self):
        """Load part categories from database for the dropdown filter"""
        try:
            self.cursor.execute("SELECT id, name FROM part_categories ORDER BY name")
            categories = [{"id": row["id"], "name": row["name"]} for row in self.cursor.fetchall()]
            # Add "All Categories" option at the beginning
            categories.insert(0, {"id": 0, "name": "All Categories"})
            return categories
        except sqlite3.Error as e:
            logging.error(f"Error loading categories: {e}", exc_info=True)
            return [{"id": 0, "name": "All Categories"}]

    def create_widgets(self):
        logging.info("Creating UI widgets")

        try:
            # Create main container frame that will use pack
            main_container = ttk.Frame(self)
            main_container.pack(fill=tk.BOTH, expand=True)

            # Search frame
            search_frame = ttk.Frame(main_container)
            search_frame.pack(fill=tk.X, padx=10, pady=10)
            logging.debug("Search frame created")

            # Search label
            search_label = ttk.Label(search_frame, text="Search parts:")
            search_label.pack(side=tk.LEFT, padx=(0, 5))
            logging.debug("Search label created")

            # Search entry
            self.search_var = tk.StringVar()
            self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var, width=30)
            self.search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
            logging.debug("Search entry created")

            # Category filter label
            category_label = ttk.Label(search_frame, text="Category:")
            category_label.pack(side=tk.LEFT, padx=(10, 5))
            logging.debug("Category label created")

            # Category dropdown
            self.category_var = tk.StringVar()
            self.category_var.set("All Categories")

            # Create a list of category names for the dropdown
            category_names = [category["name"] for category in self.categories]

            self.category_dropdown = ttk.Combobox(search_frame, textvariable=self.category_var,
                                               values=category_names, width=20, state="readonly")
            self.category_dropdown.pack(side=tk.LEFT, padx=(0, 5))
            self.category_dropdown.bind("<<ComboboxSelected>>", self.on_category_change)
            logging.debug("Category dropdown created")

            # Checkbox for showing only items with labels
            self.has_labels_var = tk.BooleanVar()
            self.has_labels_var.set(False)

            # Create a frame for the checkbox to make it more visible
            checkbox_frame = ttk.Frame(search_frame, padding=(5, 0))
            checkbox_frame.pack(side=tk.LEFT)

            self.has_labels_checkbutton = ttk.Checkbutton(
                checkbox_frame,
                text="With Labels",
                variable=self.has_labels_var,
                command=self.on_has_labels_change
            )
            self.has_labels_checkbutton.pack(side=tk.LEFT, padx=5)
            logging.debug("Has labels checkbox created")

            # Updated trace method for newer Tkinter versions
            self.search_var.trace_add("write", self.on_search_change)
            logging.debug("Search trace added")

            # Column visibility controls
            column_controls_frame = ttk.Frame(main_container)
            column_controls_frame.pack(fill=tk.X, padx=10, pady=(0, 5))

            # Label for column visibility
            visibility_label = ttk.Label(column_controls_frame, text="Columns:")
            visibility_label.pack(side=tk.LEFT, padx=(0, 10))

            # Checkboxes for column visibility
            self.show_category_var = tk.BooleanVar(value=True)
            self.show_material_var = tk.BooleanVar(value=True)
            self.show_label_file_var = tk.BooleanVar(value=True)

            self.category_toggle = ttk.Checkbutton(
                column_controls_frame,
                text="Category",
                variable=self.show_category_var,
                command=lambda: self.toggle_column_visibility("category")
            )
            self.category_toggle.pack(side=tk.LEFT, padx=(0, 10))

            self.material_toggle = ttk.Checkbutton(
                column_controls_frame,
                text="Material",
                variable=self.show_material_var,
                command=lambda: self.toggle_column_visibility("part_material")
            )
            self.material_toggle.pack(side=tk.LEFT, padx=(0, 10))

            self.label_file_toggle = ttk.Checkbutton(
                column_controls_frame,
                text="Label File",
                variable=self.show_label_file_var,
                command=lambda: self.toggle_column_visibility("label_file")
            )
            self.label_file_toggle.pack(side=tk.LEFT)

            # Add separator
            separator = ttk.Separator(column_controls_frame, orient='vertical')
            separator.pack(side=tk.LEFT, padx=15, fill='y')

            # Label files folder selector
            label_path_label = ttk.Label(column_controls_frame, text="Labels folder:")
            label_path_label.pack(side=tk.LEFT, padx=(0, 5))

            # Label path display
            self.label_path_var = tk.StringVar()
            self.label_path_var.set("Not selected")
            label_path_entry = ttk.Entry(column_controls_frame, textvariable=self.label_path_var, width=20)
            label_path_entry.pack(side=tk.LEFT, padx=(0, 5))

            # Browse button
            browse_button = ttk.Button(column_controls_frame, text="Browse...", command=self.select_label_folder)
            browse_button.pack(side=tk.LEFT)

            logging.debug("Column visibility controls created")

            # Results area
            results_frame = ttk.Frame(main_container)
            results_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
            logging.debug("Results frame created")

            # Store this frame for later reference when rebuilding treeview
            self.results_frame = results_frame

            # Define all possible columns and their properties
            self.all_columns = {
                "part_num": {"text": "Part Number", "width": 100, "always_visible": True},
                "name": {"text": "Name", "width": 250, "always_visible": True},
                "category": {"text": "Category", "width": 120, "always_visible": False},
                "part_material": {"text": "Material", "width": 100, "always_visible": False},
                "label_file": {"text": "Label File", "width": 150, "always_visible": False}
            }

            # Store visible columns (initially all)
            self.visible_columns = list(self.all_columns.keys())

            # Create initial treeview
            self.create_treeview()
            logging.debug("Initial treeview created")

            # Status bar
            self.status_var = tk.StringVar()
            self.status_var.set("Ready")
            status_bar = ttk.Label(self, textvariable=self.status_var, anchor=tk.W, padding=(10, 0))
            status_bar.pack(side=tk.BOTTOM, fill=tk.X)
            logging.debug("Status bar created")

            # Bind treeview click event for label files
            self.tree.bind('<ButtonRelease-1>', self.on_treeview_click)

            logging.info("UI widgets created successfully")
        except Exception as e:
            logging.error(f"Error creating widgets: {e}", exc_info=True)
            self.update_debug(f"Widget creation ERROR: {e}")
            raise

    def on_search_change(self, *args):
        """Handle search input changes"""
        try:
            self.search_parts(self.search_var.get())
        except Exception as e:
            logging.error(f"Search change error: {e}", exc_info=True)
            self.update_debug(f"Search ERROR: {e}")
            self.status_var.set(f"Error: {e}")

    def on_category_change(self, event):
        """Handle category selection change"""
        try:
            # Trigger a new search with the current search term and selected category
            self.search_parts(self.search_var.get())
        except Exception as e:
            logging.error(f"Category change error: {e}", exc_info=True)
            self.update_debug(f"Category ERROR: {e}")
            self.status_var.set(f"Error: {e}")

    def on_has_labels_change(self):
        """Handle label filter checkbox change"""
        try:
            # Update status bar to indicate the filter state
            if self.has_labels_var.get():
                self.status_var.set("Filter: Showing only items with labels")
            else:
                self.status_var.set("Filter: Showing all items")

            # Trigger a new search with the current settings
            self.search_parts(self.search_var.get())
        except Exception as e:
            logging.error(f"Label filter change error: {e}", exc_info=True)
            self.update_debug(f"Label filter ERROR: {e}")
            self.status_var.set(f"Error: {e}")

    def search_parts(self, search_term):
        """Search for parts based on the search term and selected category"""
        # Clear previous results
        for i in self.tree.get_children():
            self.tree.delete(i)

        if not search_term:
            self.status_var.set("Enter a search term")
            return

        # Get selected category
        selected_category = self.category_var.get()
        category_id = 0  # Default to All Categories

        # Find the category ID based on the selected name
        for category in self.categories:
            if category["name"] == selected_category:
                category_id = category["id"]
                break

        # Construct the query with join to part_categories to get category names
        query = """
            SELECT
                p.part_num,
                p.name,
                c.name as category,
                p.part_material,
                p.label_file
            FROM parts p
            LEFT JOIN part_categories c ON p.part_cat_id = c.id
            WHERE (p.part_num LIKE ? OR p.name LIKE ?)
        """

        # Add category filter if a specific category is selected
        params = [f"%{search_term}%", f"%{search_term}%"]

        if category_id != 0:  # Not "All Categories"
            query += " AND p.part_cat_id = ?"
            params.append(category_id)

        # Add label filter if checkbox is checked
        if self.has_labels_var.get():
            query += " AND p.label_file IS NOT NULL AND p.label_file != ''"

        query += " ORDER BY p.part_num LIMIT 1000"  # Increased from 100 to 1000

        logging.debug(f"Searching for: '{search_term}' in category ID: {category_id}, has_labels: {self.has_labels_var.get()}")

        try:
            self.cursor.execute(query, params)
            results = self.cursor.fetchall()

            # Cache results for when visibility changes
            self.cached_results = results

            # Fill treeview with results
            self.fill_treeview_with_results(results)

            result_count = len(results)
            self.status_var.set(f"Found {result_count} {'result' if result_count == 1 else 'results'}")
            logging.debug(f"Found {result_count} results for '{search_term}'")

        except sqlite3.Error as e:
            logging.error(f"Database search error: {e}", exc_info=True)
            self.status_var.set(f"Database error: {e}")
            self.update_debug(f"Search DB ERROR: {e}")

    def on_closing(self):
        """Clean up resources when the application closes"""
        logging.info("Application closing, cleaning up resources")

        # Save preferences before closing
        self.save_preferences()

        if hasattr(self, 'connection') and self.connection:
            self.connection.close()
            logging.info("Database connection closed")

        self.destroy()

    def create_treeview(self):
        """Create the treeview widget with columns"""
        # Clear existing contents of the results_frame
        for widget in self.results_frame.winfo_children():
            widget.destroy()

        # Create the treeview
        self.tree = ttk.Treeview(self.results_frame, columns=self.visible_columns, show='headings')

        # Configure columns
        for col in self.visible_columns:
            # Add a special indicator for the label file column
            if col == 'label_file':
                self.tree.heading(col, text=f"{col.replace('_', ' ').title()} (clickable)")
            else:
                self.tree.heading(col, text=col.replace('_', ' ').title())
            self.tree.column(col, width=self.all_columns[col]["width"], minwidth=50)

        # Add scrollbars
        y_scrollbar = ttk.Scrollbar(self.results_frame, orient="vertical", command=self.tree.yview)
        x_scrollbar = ttk.Scrollbar(self.results_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=y_scrollbar.set, xscrollcommand=x_scrollbar.set)

        # Grid layout
        self.tree.grid(row=0, column=0, sticky="nsew")
        y_scrollbar.grid(row=0, column=1, sticky="ns")
        x_scrollbar.grid(row=1, column=0, sticky="ew")

        # Configure grid weights
        self.results_frame.grid_rowconfigure(0, weight=1)
        self.results_frame.grid_columnconfigure(0, weight=1)

        # Bind events
        self.tree.bind('<ButtonRelease-1>', self.on_treeview_click)
        self.tree.bind('<Motion>', self.on_treeview_motion)
        self.tree.bind('<Expose>', self.on_treeview_expose)

        # If we have cached results, refill the treeview
        if hasattr(self, 'cached_results') and self.cached_results:
            self.fill_treeview_with_results(self.cached_results)

    def on_treeview_motion(self, event):
        """Handle mouse motion over the treeview"""
        try:
            # Get the item and column under the cursor
            item = self.tree.identify_row(event.y)
            column = self.tree.identify_column(event.x)

            if not (item and column):
                self.tree.configure(cursor="")
                return

            # Convert column number to column name
            col_idx = int(column[1:]) - 1
            if col_idx >= len(self.visible_columns):
                self.tree.configure(cursor="")
                return

            col_name = self.visible_columns[col_idx]

            # Get item values
            values = self.tree.item(item, 'values')

            # Only show hand cursor for label file column with content
            if col_name == 'label_file' and col_idx < len(values) and values[col_idx]:
                self.tree.configure(cursor="hand2")
            else:
                self.tree.configure(cursor="")
        except Exception as e:
            logging.error(f"Motion handling error: {e}", exc_info=True)
            self.tree.configure(cursor="")

    def on_treeview_expose(self, event):
        """Handle treeview expose events to reapply styling after scrolling"""
        if not 'label_file' in self.visible_columns:
            return

        # Get the blue color for macOS UI
        blue_color = '#0A84FF' if self.is_dark_mode() else '#0066CC'

        # Reapply colors to all visible cells
        label_idx = self.visible_columns.index('label_file')
        for item in self.tree.get_children():
            values = self.tree.item(item, 'values')
            if label_idx < len(values) and values[label_idx]:
                # Schedule with a small delay to ensure rendering is complete
                self.after(10, lambda item=item, idx=label_idx:
                         self.highlight_label_cell(item, idx, blue_color))

    def fill_treeview_with_results(self, results):
        """Fill the treeview with search results"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)

        if not results:
            self.status_var.set("No results found")
            return

        # Get the blue color for macOS UI
        blue_color = '#0A84FF' if self.is_dark_mode() else '#0066CC'

        # Insert items
        for result in results:
            # Get values for visible columns only
            values = []
            for col in self.visible_columns:
                if col in result.keys():
                    values.append(str(result[col]) if result[col] is not None else '')
                else:
                    values.append('')

            # Insert the row
            item = self.tree.insert('', 'end', values=values)

            # Apply color to the label file column if it exists
            if 'label_file' in self.visible_columns:
                label_idx = self.visible_columns.index('label_file')
                if label_idx < len(values) and values[label_idx]:
                    # Schedule a call to highlight the cell after it's drawn
                    self.after(10, lambda item=item, idx=label_idx:
                             self.highlight_label_cell(item, idx, blue_color))

        # Log the number of results
        num_results = len(results)
        logging.debug(f"Filled treeview with {num_results} results")
        self.status_var.set(f"Found {num_results} {'result' if num_results == 1 else 'results'}")

    def is_dark_mode(self):
        """Check if system is using dark mode"""
        try:
            if sys.platform == 'darwin':
                # Check macOS appearance
                is_dark = self.tk.call('tk', 'windowingsystem') == 'aqua' and \
                          'dark' in self.tk.call('::tk::mac::isDark')
                return is_dark
            # For other platforms, default to False
            return False
        except:
            return False

    def highlight_label_cell(self, item, col_idx, color):
        """Apply a highlight color to just the label cell using widget access"""
        try:
            # Directly access the canvas and modify the text color
            # This works because ttk.Treeview uses a tk.Canvas to draw its items
            canvas = None

            # Find the canvas within the treeview widget
            for child in self.tree.winfo_children():
                if isinstance(child, tk.Canvas):
                    canvas = child
                    break

            if not canvas:
                return

            # Find the text item for our particular cell
            for item_id in canvas.find_all():
                tags = canvas.gettags(item_id)
                # The tag format is "text#" where # is the column number (1-based)
                if f"text{col_idx+1}" in tags and f"item{item}" in tags:
                    # This is the text for our cell - set its color
                    canvas.itemconfigure(item_id, fill=color)
                    break

        except Exception as e:
            logging.error(f"Error highlighting cell: {e}", exc_info=True)

    def on_treeview_click(self, event):
        """Handle clicks on the treeview, opening label files when clicking on label file column"""
        try:
            # Get the clicked item and column
            region = self.tree.identify_region(event.x, event.y)
            if region != "cell":
                return

            column = self.tree.identify_column(event.x)
            column_index = int(column[1:]) - 1  # Column index is 1-based in ttk

            # Check if clicked column is label_file
            if column_index >= len(self.visible_columns) or self.visible_columns[column_index] != "label_file":
                return

            # Get the clicked item
            item_id = self.tree.identify_row(event.y)
            if not item_id:
                return

            # Get the label file value
            values = self.tree.item(item_id, "values")
            if not values or column_index >= len(values):
                return

            label_file = values[column_index]
            if not label_file or label_file.lower() == "none":
                return

            # Process the label file click
            self.process_label_file_click(label_file)

        except Exception as e:
            logging.error(f"Error handling treeview click: {e}", exc_info=True)
            self.update_debug(f"Treeview click ERROR: {e}")

    def open_label_file(self, file_path):
        """Open the label file with the appropriate application"""
        try:
            logging.info(f"Opening label file: {file_path}")

            if sys.platform == "darwin":  # macOS
                subprocess.Popen(["open", file_path])
            elif sys.platform == "win32":  # Windows
                os.startfile(file_path)
            else:  # Linux and others
                subprocess.Popen(["xdg-open", file_path])

        except Exception as e:
            logging.error(f"Error opening file: {e}", exc_info=True)
            self.update_debug(f"File open ERROR: {e}")
            self.status_var.set(f"Error opening file: {e}")

    def toggle_column_visibility(self, column_name):
        """Toggle visibility of a specific column"""
        try:
            if column_name == "category":
                show = self.show_category_var.get()
            elif column_name == "part_material":
                show = self.show_material_var.get()
            elif column_name == "label_file":
                show = self.show_label_file_var.get()
            else:
                return

            # Update visible_columns list based on checkbox state
            if show and column_name not in self.visible_columns:
                # Make sure mandatory columns are at the beginning
                if column_name == "category":
                    self.visible_columns.insert(2, column_name)
                elif column_name == "part_material":
                    # Make sure it's after category if visible
                    if "category" in self.visible_columns:
                        idx = self.visible_columns.index("category") + 1
                    else:
                        idx = 2
                    self.visible_columns.insert(idx, column_name)
                else:
                    # Add to the end
                    self.visible_columns.append(column_name)
            elif not show and column_name in self.visible_columns:
                self.visible_columns.remove(column_name)

            # Recreate treeview with updated visible columns
            self.create_treeview()

            logging.debug(f"Column '{column_name}' visibility set to {show}, visible columns: {self.visible_columns}")
        except Exception as e:
            logging.error(f"Error toggling column visibility: {e}", exc_info=True)
            self.update_debug(f"Column visibility ERROR: {e}")

    def load_preferences(self):
        """Load user preferences from file"""
        try:
            if os.path.exists(self.preferences_file):
                with open(self.preferences_file, 'r') as f:
                    return json.load(f)
            else:
                return {}
        except Exception as e:
            logging.error(f"Error loading preferences: {e}", exc_info=True)
            return {}

    def save_preferences(self):
        """Save current user preferences to file"""
        try:
            preferences = {
                "search_term": self.search_var.get() if hasattr(self, 'search_var') else "",
                "category": self.category_var.get() if hasattr(self, 'category_var') else "All Categories",
                "has_labels": self.has_labels_var.get() if hasattr(self, 'has_labels_var') else False,
                "show_category": self.show_category_var.get() if hasattr(self, 'show_category_var') else True,
                "show_material": self.show_material_var.get() if hasattr(self, 'show_material_var') else True,
                "show_label_file": self.show_label_file_var.get() if hasattr(self, 'show_label_file_var') else True,
                "label_files_root": self.label_files_root if hasattr(self, 'label_files_root') else ""
            }

            with open(self.preferences_file, 'w') as f:
                json.dump(preferences, f, indent=2)

            logging.info(f"Preferences saved: {preferences}")
        except Exception as e:
            logging.error(f"Error saving preferences: {e}", exc_info=True)

    def apply_preferences(self):
        """Apply loaded preferences to UI components"""
        try:
            # Set checkbox states
            if "show_category" in self.preferences:
                self.show_category_var.set(self.preferences["show_category"])

            if "show_material" in self.preferences:
                self.show_material_var.set(self.preferences["show_material"])

            if "show_label_file" in self.preferences:
                self.show_label_file_var.set(self.preferences["show_label_file"])

            if "has_labels" in self.preferences:
                self.has_labels_var.set(self.preferences["has_labels"])

            # Update visible columns based on checkbox states
            self.visible_columns = ["part_num", "name"]
            if self.show_category_var.get():
                self.visible_columns.append("category")
            if self.show_material_var.get():
                self.visible_columns.append("part_material")
            if self.show_label_file_var.get():
                self.visible_columns.append("label_file")

            # Recreate treeview with correct columns
            self.create_treeview()

            # Set category dropdown
            if "category" in self.preferences:
                self.category_var.set(self.preferences["category"])

            # Set label files root and update display
            if "label_files_root" in self.preferences and self.preferences["label_files_root"]:
                self.label_files_root = self.preferences["label_files_root"]
                display_path = self.label_files_root
                if len(display_path) > 20:
                    display_path = "..." + display_path[-17:]
                self.label_path_var.set(display_path)

            # Set search term and trigger search (do last so it populates treeview)
            if "search_term" in self.preferences and self.preferences["search_term"]:
                self.search_var.set(self.preferences["search_term"])
                self.search_parts(self.preferences["search_term"])

            logging.info("Applied preferences to UI")
        except Exception as e:
            logging.error(f"Error applying preferences: {e}", exc_info=True)
            self.update_debug(f"Preferences ERROR: {e}")

    def process_label_file_click(self, label_file):
        """Process a label file click"""
        try:
            # Check if label files root is set
            if not self.label_files_root:
                self.status_var.set("Please select a labels folder first")
                return

            # Construct the full path
            full_path = os.path.join(self.label_files_root, label_file)

            # Check if file exists
            if not os.path.exists(full_path):
                self.status_var.set(f"Label file not found: {full_path}")
                return

            # Open the file
            self.open_label_file(full_path)
            self.status_var.set(f"Opening label file: {label_file}")

        except Exception as e:
            logging.error(f"Error handling label file click: {e}", exc_info=True)
            self.status_var.set(f"Error: {e}")

    def select_label_folder(self):
        """Open a folder selection dialog for label files root"""
        folder_path = filedialog.askdirectory(
            title="Select Labels Root Folder",
            initialdir=os.path.expanduser("~")
        )

        if folder_path:
            self.label_files_root = folder_path
            # Display the path (shortened if too long)
            display_path = folder_path
            if len(display_path) > 20:
                display_path = "..." + display_path[-17:]
            self.label_path_var.set(display_path)
            logging.info(f"Label files root set to: {folder_path}")
            self.status_var.set(f"Labels folder set to: {folder_path}")

if __name__ == "__main__":
    try:
        logging.info("Starting Lego Parts Search application")
        app = LegoPartsSearch()
        app.protocol("WM_DELETE_WINDOW", app.on_closing)

        # Force window to be shown - particularly important on macOS
        logging.info("Raising window and calling lift()")
        app.lift()  # Bring window to front
        app.attributes("-topmost", True)  # Make window topmost
        app.after(100, lambda: app.attributes("-topmost", False))  # Remove topmost after showing

        # Try macOS-specific window activation
        if sys.platform == 'darwin':
            try:
                # Try to activate the app via AppleScript
                logging.info("Attempting macOS window activation")
                script = '''
                tell application "System Events"
                    set frontmost of process "Python" to true
                end tell
                '''
                call(["osascript", "-e", script])
                logging.info("macOS activation script executed")
            except Exception as e:
                logging.error(f"macOS activation error: {e}", exc_info=True)

        # Log that we're entering the main loop
        logging.info("Entering Tkinter mainloop")
        app.mainloop()
        logging.info("Exited mainloop")

    except Exception as e:
        logging.critical(f"Critical application error: {e}", exc_info=True)
        print(f"Error: {e}")
        # If we can't even create the main window, show a basic error dialog
        try:
            if 'app' not in locals() or not hasattr(app, '_windowingsystem'):
                import tkinter.messagebox
                tkinter.messagebox.showerror("Error", f"Failed to start application: {e}")
        except:
            logging.critical("Could not show error message", exc_info=True)

        # Write the full traceback to the log
        with open(log_file, "a") as f:
            f.write(f"\n\nFULL TRACEBACK:\n{traceback.format_exc()}\n\n")

        sys.exit(1)