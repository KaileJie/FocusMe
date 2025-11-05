# Electron Setup Guide - Focus Me for Mac 🍎

This guide will help you turn Focus Me into a native Mac desktop application.

## What is Electron?

Electron allows you to package your web app as a native Mac application (.app file) that can be installed and run like any other Mac app.

## Setup Steps

### 1. Install Node.js (if not already installed)

Check if you have Node.js:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `electron` - The framework to run the app
- `electron-builder` - Tool to build Mac app

### 3. Run the App Locally

```bash
npm start
```

This will open the app in an Electron window (not a browser!).

### 4. Build Mac Application

To create a distributable Mac app:

```bash
npm run build:mac
```

This will create:
- `dist/Focus Me-1.0.0.dmg` - Installer file
- `dist/Focus Me-1.0.0-mac.zip` - App bundle

### 5. Install on Mac

1. Open the `.dmg` file
2. Drag "Focus Me" to Applications folder
3. Open from Applications
4. Right-click → Open (first time, to bypass Gatekeeper)

## Features

✅ Native Mac app experience
✅ Menu bar integration
✅ Dock icon
✅ macOS style window controls
✅ Can be distributed to others
✅ Works offline (all files bundled)

## Creating App Icon

You need to create an `.icns` file for the Mac app icon:

1. Use `icon-512.png` as base
2. Convert to `.icns` format using:
   - Online tool: https://cloudconvert.com/png-to-icns
   - Or command line: `iconutil -c icns icon.iconset`

## Troubleshooting

- **App won't open?** Right-click → Open (first time only)
- **Build fails?** Make sure you have Xcode Command Line Tools installed
- **Window not showing?** Check console for errors

## Distribution

Once built, you can:
- Share the `.dmg` file with others
- Upload to your website for download
- Distribute through Mac App Store (requires Apple Developer account)

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm start` to test locally
3. Run `npm run build:mac` to create installer
4. Share with others!

