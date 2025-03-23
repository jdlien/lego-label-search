#!/usr/bin/osascript

tell application "Finder"
    set appName to "Python"

    -- Wait briefly for the application to launch
    delay 1

    -- Activate the Python application
    tell application "System Events"
        set frontmost of process appName to true
    end tell

    -- Make sure it's visible
    tell application appName
        activate
    end tell
end tell