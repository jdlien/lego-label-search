# About the Data Processing Scripts

This project originally started as a collection of Python scripts to get information from
BrickArchitect labels and other data sources, like Rebrickable.

I created a SQLite database to store the data, and then created a GUI that could run on macOS
to search the database. I then wanted to enhance the database with information from
BrickArchitect.com, so I built a script that scrapes the BrickArchitect.com website and updates
the database.

By accident, the LLM I was using to do this just spontaneously built a Next.js website that can
search the database, and that's how the modern version of this project started.

Version 2.0 rewrote all the front end code to use Tailwind CSS and a more modern Next.js
structure, instead of the original Chakra UI components.

The original scripts have been preserved here in the data_processing directory, as I may need
to use these in the future to update the database.
