#!/bin/bash

# Script to convert PNG images to lossless WebP format with transparency
# Uses magick (ImageMagick) with parallel processing for maximum speed

# Create a log file
LOG_FILE="webp_conversion.log"
echo "Starting conversion process at $(date)" > "$LOG_FILE"

# Source directory containing PNG images
SRC_DIR="public/data/images"

# Create output directory if it doesn't exist already
mkdir -p "$SRC_DIR"

# Check if magick command is available
if ! command -v magick &> /dev/null; then
    echo "Error: 'magick' command not found. Please ensure ImageMagick is installed."
    echo "Try installing with: brew install imagemagick"
    echo "Error: 'magick' command not found" >> "$LOG_FILE"
    exit 1
fi

# Check if parallel command is available
if ! command -v parallel &> /dev/null; then
    echo "Error: 'parallel' command not found. Please ensure GNU Parallel is installed."
    echo "Try installing with: brew install parallel"
    echo "Error: 'parallel' command not found" >> "$LOG_FILE"
    exit 1
fi

# Count total number of PNG files
total_files=$(find "$SRC_DIR" -name "*.png" | wc -l)

if [ "$total_files" -eq 0 ]; then
    echo "Warning: No PNG files found in $SRC_DIR"
    echo "Warning: No PNG files found in $SRC_DIR" >> "$LOG_FILE"
    exit 0
fi

# Get CPU count for optimal parallel processing
CPU_COUNT=$(sysctl -n hw.ncpu)
echo "Converting $total_files PNG files to WebP format using $CPU_COUNT CPU cores..."

# Define conversion function
convert_to_webp() {
    local png_file="$1"
    local filename=$(basename "$png_file" .png)
    local directory=$(dirname "$png_file")
    local webp_file="$directory/$filename.webp"

    # Convert PNG to lossless WebP with transparency and maximum effort
    output=$(magick "$png_file" -define webp:lossless=true -define webp:method=6 -define webp:alpha-quality=100 "$webp_file" 2>&1)
    status=$?

    if [ $status -ne 0 ]; then
        echo "Error converting $png_file: $output" >> "$LOG_FILE"
        return 1
    else
        # Verify the webp file was created successfully
        if [ ! -f "$webp_file" ]; then
            echo "Warning: WebP file was not created despite successful command for $png_file" >> "$LOG_FILE"
            return 1
        elif [ ! -s "$webp_file" ]; then
            echo "Warning: WebP file is empty for $png_file" >> "$LOG_FILE"
            return 1
        fi
        return 0
    fi
}

# Export the function so parallel can use it
export -f convert_to_webp

# Start time
start_time=$(date +%s)

# Use GNU Parallel to process files in parallel, with less verbose output
echo "Converting files... (This may take a while)"
find "$SRC_DIR" -name "*.png" | parallel --bar --jobs "$CPU_COUNT" convert_to_webp

# End time
end_time=$(date +%s)
duration=$((end_time - start_time))

# Format duration as minutes and seconds
minutes=$((duration / 60))
seconds=$((duration % 60))
time_formatted="${minutes}m ${seconds}s"

# Count successful conversions
success_count=$(find "$SRC_DIR" -name "*.webp" | wc -l)
success_count=$(echo "$success_count" | tr -d ' ')
failed=$((total_files - success_count))

# Summary
echo "✅ Conversion complete!"
echo "⏱️  Total time: $time_formatted"
echo "🟢 Successfully converted: $success_count files"
if [ $failed -gt 0 ]; then
    echo "🔴 Failed conversions: $failed files (See $LOG_FILE for details)"
else
    echo "✨ All conversions successful!"
fi
