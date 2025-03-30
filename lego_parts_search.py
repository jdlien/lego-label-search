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
from PIL import Image, ImageTk
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

            # Set initial geometry or load from preferences
            default_geometry = "800x600"
            if "window_geometry" in self.preferences:
                # Use saved geometry but ensure window is on screen
                try:
                    self.geometry(self.preferences["window_geometry"])
                    logging.info(f"Loaded window geometry: {self.preferences['window_geometry']}")
                    # After setting geometry, check if the window is fully visible
                    self.after(100, self.ensure_on_screen)
                except Exception as e:
                    logging.error(f"Error setting window geometry: {e}", exc_info=True)
                    self.geometry(default_geometry)
            else:
                self.geometry(default_geometry)

            self.minsize(600, 400)

            # macOS specific settings to ensure window appears
            if sys.platform == 'darwin':
                self.createcommand('::tk::mac::ReopenApplication', self.handle_reopen)
                self.createcommand('::tk::mac::Quit', self.on_closing)
                logging.info("Added macOS-specific window commands")

            self.update_debug("Window configured")

            # Set up database connection
            db_path = os.path.expanduser(os.getenv("DB_PATH", "~/bin/lego-data/lego.sqlite"))
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
            self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var, width=10)
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
                                               values=category_names, width=15, state="readonly")
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
                text="Only Labels",
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
            visibility_label = ttk.Label(column_controls_frame, text="Show:")
            visibility_label.pack(side=tk.LEFT, padx=(0, 10))

            # Checkboxes for column visibility
            self.show_category_var = tk.BooleanVar(value=True)
            self.show_material_var = tk.BooleanVar(value=True)
            self.show_label_file_var = tk.BooleanVar(value=True)
            self.show_image_var = tk.BooleanVar(value=True)

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
            self.label_file_toggle.pack(side=tk.LEFT, padx=(0, 10))

            self.image_toggle = ttk.Checkbutton(
                column_controls_frame,
                text="Images",
                variable=self.show_image_var,
                command=self.toggle_image_panel
            )
            self.image_toggle.pack(side=tk.LEFT)

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

            # Results container with treeview and image panel
            results_container = ttk.Frame(main_container)
            results_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))

            # Create a PanedWindow for treeview and image panel
            self.paned = ttk.PanedWindow(results_container, orient=tk.HORIZONTAL)
            self.paned.pack(fill=tk.BOTH, expand=True)

            # Create frames for treeview and image panel
            self.results_frame = ttk.Frame(self.paned)
            self.image_panel = ttk.Frame(self.paned, width=100)

            # Add the frames to the paned window
            self.paned.add(self.results_frame, weight=4)

            # Only add image panel if show_image is true
            if self.show_image_var.get():
                self.paned.add(self.image_panel, weight=1)
                self.setup_image_panel()

            logging.debug("Results frame created")

            # Define all possible columns and their properties
            self.all_columns = {
                "part_num": {"text": "Part Number", "width": 100, "always_visible": True},
                "name": {"text": "Name", "width": 250, "always_visible": True},
                "category": {"text": "Category", "width": 120, "always_visible": False},
                "part_material": {"text": "Material", "width": 100, "always_visible": False},
                "label_file": {"text": "Label File", "width": 150, "always_visible": False},
            }

            # Store visible columns (initially all but without the image column)
            self.visible_columns = [col for col in self.all_columns.keys()]

            # Store image instances to prevent garbage collection
            self.image_cache = {}

            # Set images root path - it's in the same folder as the database file
            data_dir = os.path.expanduser(os.getenv("DATA_DIR", "~/bin/lego-data"))
            self.images_root = os.path.join(data_dir, "images")
            logging.info(f"Images folder set to: {self.images_root}")

            # Create initial treeview
            self.create_treeview()
            logging.debug("Initial treeview created")

            # Status bar
            self.status_var = tk.StringVar()
            self.status_var.set("Ready")
            status_bar = ttk.Label(self, textvariable=self.status_var, anchor=tk.W, padding=(10, 0))
            status_bar.pack(side=tk.BOTTOM, fill=tk.X)
            logging.debug("Status bar created")

            # Bind treeview click event for label files and selection
            self.tree.bind('<ButtonRelease-1>', self.on_treeview_click)
            self.tree.bind('<<TreeviewSelect>>', self.on_treeview_select)
            self.tree.bind('<Motion>', self.on_treeview_motion)

            logging.info("UI widgets created successfully")
        except Exception as e:
            logging.error(f"Error creating widgets: {e}", exc_info=True)
            self.update_debug(f"Widget creation ERROR: {e}")
            raise

    def setup_image_panel(self):
        """Set up the image panel to display images"""
        # Clear any existing widgets
        for widget in self.image_panel.winfo_children():
            widget.destroy()

        # Create a main container for the image panel with padding
        main_container = ttk.Frame(self.image_panel, padding=10)
        main_container.pack(fill=tk.BOTH, expand=True)

        # Add a title for the image panel
        title_label = ttk.Label(main_container, text="Part Image", font=('TkDefaultFont', 12, 'bold'))
        title_label.pack(side=tk.TOP, pady=(0, 10))

        # Create a centered, flexible container for the image - no border
        img_container = ttk.Frame(main_container)
        img_container.pack(fill=tk.BOTH, expand=True)

        # Create a label to display the image with a white background
        self.image_label = ttk.Label(img_container, anchor='center', background='white')
        self.image_label.pack(fill=tk.BOTH, expand=True)

        # Create a label for part number and name display
        self.part_num_label = ttk.Label(main_container, text="", anchor='center',
                                      font=('TkDefaultFont', 11), wraplength=230)
        self.part_num_label.pack(side=tk.BOTTOM, fill=tk.X, pady=(10, 0))

        # Start with "Select a part" message
        self.image_label.config(text="Select a part to view image")
        self.part_num_label.config(text="")

    def toggle_image_panel(self):
        """Toggle the image panel visibility"""
        if self.show_image_var.get():
            # Image panel should be visible
            if not self.image_panel.winfo_ismapped():
                # Set a good minimum width for the image panel
                self.image_panel.config(width=250)
                self.setup_image_panel()
                try:
                    self.paned.add(self.image_panel, weight=1)
                except Exception as e:
                    logging.debug(f"Could not add image panel, may already be added: {e}")
                # Update the selected item to display its image
                self.update_image_panel()

                # Bind configure event to update image when panel is resized
                self.image_panel.bind("<Configure>", self.on_panel_resize)
        else:
            # Image panel should be hidden
            if self.image_panel.winfo_ismapped():
                # Unbind configure event when hiding the panel
                self.image_panel.unbind("<Configure>")
                try:
                    self.paned.forget(self.image_panel)
                except Exception as e:
                    logging.debug(f"Could not forget image panel: {e}")

    def on_panel_resize(self, event):
        """Handle panel resize events to update the image scale"""
        # Only respond to actual size changes, not all configure events
        if event.width > 10 and hasattr(self, 'image_label'):
            # Update the image if there's a selection
            self.update_image_panel()

    def update_image_panel(self):
        """Update the image panel with the selected item"""
        if not self.show_image_var.get() or not hasattr(self, 'image_label'):
            return

        selection = self.tree.selection()
        if not selection:
            self.image_label.config(image='')
            self.part_num_label.config(text="No part selected")
            return

        # Get part number of selected item
        item = selection[0]
        values = self.tree.item(item, 'values')

        if not values:
            self.image_label.config(image='')
            self.part_num_label.config(text="No part data")
            return

        part_num = values[0]  # First column is always part_num
        part_name = values[1] if len(values) > 1 else ""  # Second column is name

        # Load and display the image
        img = self.load_part_image(part_num)
        if img:
            self.image_label.config(image=img, text="")
            # Display both part number and name
            self.part_num_label.config(text=f"{part_num}\n{part_name}")
        else:
            # Check if the image is actually being loaded but not displayed
            # by looking for it on disk
            for ext in ['webp', 'png']:
                image_path = os.path.join(self.images_root, f"{part_num}.{ext}")
                if os.path.exists(image_path):
                    self.image_label.config(image='')
                    self.part_num_label.config(text=f"{part_num}\n{part_name}\n(Image loading error)")
                    logging.warning(f"Image file exists but failed to display: {image_path}")
                    return

            # No image file exists
            self.image_label.config(image='', text="No Image")
            self.part_num_label.config(text=f"{part_num}\n{part_name}")

    def on_treeview_select(self, event):
        """Handle selection in the treeview"""
        self.update_image_panel()

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

        # Create the treeview with columns but without image column
        self.tree = ttk.Treeview(self.results_frame, columns=self.visible_columns, show='headings')

        # Configure columns
        for col in self.visible_columns:
            # Add a special indicator for the label file column
            if col == 'label_file':
                self.tree.heading(col, text=f"{col.replace('_', ' ').title()} (click to open)")
            else:
                self.tree.heading(col, text=col.replace('_', ' ').title())

            # Set column width based on predefined widths
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
        self.tree.bind('<<TreeviewSelect>>', self.on_treeview_select)
        self.tree.bind('<Motion>', self.on_treeview_motion)

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
            # Don't change cursor for image column
            elif col_name == 'image':
                self.tree.configure(cursor="")
            else:
                self.tree.configure(cursor="")
        except Exception as e:
            logging.error(f"Motion handling error: {e}", exc_info=True)
            self.tree.configure(cursor="")

    def fill_treeview_with_results(self, results):
        """Fill the treeview with search results"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)

        # Clear image cache when loading new results
        self.image_cache.clear()

        if not results:
            self.status_var.set("No results found")
            return

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
            self.tree.insert('', 'end', values=values)

        # Log the number of results
        num_results = len(results)
        logging.debug(f"Filled treeview with {num_results} results")
        self.status_var.set(f"Found {num_results} {'result' if num_results == 1 else 'results'}")

        # Select the first item if there are results and update image panel
        if results and self.tree.get_children():
            first_item = self.tree.get_children()[0]
            self.tree.selection_set(first_item)
            self.tree.focus(first_item)
            self.update_image_panel()

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
            elif column_name == "image":
                # Handle image toggle separately
                self.toggle_image_panel()
                return
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
            # Get current window position and size
            geometry = self.geometry()

            preferences = {
                "search_term": self.search_var.get() if hasattr(self, 'search_var') else "",
                "category": self.category_var.get() if hasattr(self, 'category_var') else "All Categories",
                "has_labels": self.has_labels_var.get() if hasattr(self, 'has_labels_var') else False,
                "show_category": self.show_category_var.get() if hasattr(self, 'show_category_var') else True,
                "show_material": self.show_material_var.get() if hasattr(self, 'show_material_var') else True,
                "show_label_file": self.show_label_file_var.get() if hasattr(self, 'show_label_file_var') else True,
                "show_image": self.show_image_var.get() if hasattr(self, 'show_image_var') else True,
                "label_files_root": self.label_files_root if hasattr(self, 'label_files_root') else "",
                "window_geometry": geometry
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

            if "show_image" in self.preferences:
                self.show_image_var.set(self.preferences["show_image"])
                # No need to call toggle_image_panel here as it will be handled after creating the treeview

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

            # Now handle the image panel toggle after treeview is created
            if hasattr(self, 'image_panel'):
                self.toggle_image_panel()

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

    def ensure_on_screen(self):
        """Ensure the window is visible on screen"""
        try:
            # Get window geometry
            x = self.winfo_x()
            y = self.winfo_y()
            width = self.winfo_width()
            height = self.winfo_height()

            # Get screen size
            screen_width = self.winfo_screenwidth()
            screen_height = self.winfo_screenheight()

            logging.debug(f"Window: {width}x{height}+{x}+{y}, Screen: {screen_width}x{screen_height}")

            # Check if window is off screen
            new_x, new_y = x, y
            if x < 0:
                new_x = 0
            elif x + width > screen_width:
                new_x = max(0, screen_width - width)

            if y < 0:
                new_y = 0
            elif y + height > screen_height:
                new_y = max(0, screen_height - height)

            # If position changed, update window position
            if new_x != x or new_y != y:
                logging.info(f"Moving window from {x},{y} to {new_x},{new_y}")
                self.geometry(f"+{new_x}+{new_y}")
        except Exception as e:
            logging.error(f"Error ensuring window on screen: {e}", exc_info=True)

    def handle_reopen(self):
        """Handle macOS app reopen event (when clicking dock icon)"""
        logging.info("Handling app reopen")
        self.deiconify()
        self.lift()
        self.focus_force()
        self.ensure_on_screen()

    def load_part_image(self, part_num):
        """Attempt to load an image for a part number"""
        if not self.show_image_var.get() or not part_num:
            return None

        # Try webp first, then png
        for ext in ['webp', 'png']:
            image_path = os.path.join(self.images_root, f"{part_num}.{ext}")
            if os.path.exists(image_path):
                try:
                    # Open the image
                    img = Image.open(image_path)

                    # Get the current panel width to scale the image accordingly
                    panel_width = self.image_panel.winfo_width() - 20  # Account for padding
                    if panel_width < 10:  # If panel not yet measured, use default
                        panel_width = 220

                    # Limit maximum width to 300
                    max_width = 300
                    if panel_width > max_width:
                        panel_width = max_width

                    # Calculate height to maintain aspect ratio
                    aspect_ratio = img.height / img.width
                    target_height = int(panel_width * aspect_ratio)

                    # Resize image to fit panel width
                    img = img.resize((panel_width, target_height), Image.Resampling.LANCZOS)

                    # Convert to PhotoImage for display
                    photo_img = ImageTk.PhotoImage(img)

                    # Store in cache to prevent garbage collection
                    self.image_cache[part_num] = photo_img

                    logging.debug(f"Loaded image for part {part_num} from {image_path}, resized to {panel_width}x{target_height}")
                    return photo_img
                except Exception as e:
                    logging.error(f"Error loading image for part {part_num}: {e}")
                    return None

        # Use debug level instead of info to reduce console noise
        logging.debug(f"No image found for part {part_num}")
        return None

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
        app.after(200, app.ensure_on_screen)  # Ensure window is visible on screen

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