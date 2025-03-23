#!/bin/bash

echo "Rebuilding Lego Parts Search.app..."

# Remove old app if it exists
if [ -d "Lego Parts Search.app" ]; then
    rm -rf "Lego Parts Search.app"
    echo "Removed old app bundle"
fi

# Create logs directory if it doesn't exist
mkdir -p logs
echo "Created logs directory"

# Create app structure
mkdir -p "Lego Parts Search.app/Contents/MacOS"
mkdir -p "Lego Parts Search.app/Contents/Resources"

# Copy the icon file to the Resources directory
cp icon.icns "Lego Parts Search.app/Contents/Resources/"
echo "Copied icon file to Resources"

# Create Info.plist
cat > "Lego Parts Search.app/Contents/Info.plist" << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>AppLauncher</string>
    <key>CFBundleIdentifier</key>
    <string>com.lego.parts.search</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Lego Parts Search</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>10.9.0</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>CFBundleIconFile</key>
    <string>3001.icns</string>
</dict>
</plist>
EOL

# Create launcher script
cat > "Lego Parts Search.app/Contents/MacOS/AppLauncher" << EOL
#!/bin/bash
set -e  # Exit on any error

# Get the directory of this script
DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="\$( cd "\$DIR/../.." && pwd )"
PARENT_DIR="\$( cd "\$APP_DIR/.." && pwd )"

# Create logs directory if it doesn't exist
mkdir -p "\$PARENT_DIR/logs"

# Change to the parent directory
cd "\$PARENT_DIR"

# Log the launch attempt
LOGFILE="\$PARENT_DIR/logs/app_launcher.log"
echo "===== App Launch: \$(date) =====" >> "\$LOGFILE"
echo "Working directory: \$(pwd)" >> "\$LOGFILE"
echo "Python path: \$(which python3)" >> "\$LOGFILE"
echo "Environment:" >> "\$LOGFILE"
env | sort >> "\$LOGFILE"

# Make sure we have the right Python paths
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH"
export PYTHONPATH="\$PARENT_DIR"
export DISPLAY=":0"
export PYTHONUNBUFFERED=1

# Launch in background and activate with AppleScript
echo "Launching Python in background and activating with AppleScript..." >> "\$LOGFILE"
/usr/bin/env python3 "\$PARENT_DIR/lego_parts_search.py" > "\$LOGFILE" 2>&1 &

# Give Python a moment to start
sleep 0.5

# Run AppleScript to activate the application
echo "Running activation script..." >> "\$LOGFILE"
osascript "\$PARENT_DIR/activate_app.scpt" >> "\$LOGFILE" 2>&1
EOL

# Make the launcher executable
chmod +x "Lego Parts Search.app/Contents/MacOS/AppLauncher"

# Copy the activation script to the app resources
cp activate_app.scpt "Lego Parts Search.app/Contents/Resources/"

echo "App bundle rebuilt successfully!"
echo "You can now launch the app by double-clicking 'Lego Parts Search.app' in Finder"
echo "Log files will be stored in the 'logs' directory within the app folder"