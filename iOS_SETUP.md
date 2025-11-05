# iOS App Setup Guide - Focus Me 📱

This guide will help you set up Focus Me as an installable iOS app (PWA).

## What is a PWA?

A Progressive Web App (PWA) allows users to install your web app on their iOS device and use it like a native app - with an icon on the home screen, full-screen experience, and offline capabilities.

## Setup Steps

### 1. Create App Icons

You need to create two icon files:

**icon-192.png** (192x192 pixels)
- Used for Android and general PWA icons
- Should feature your cute tomato logo

**icon-512.png** (512x512 pixels)
- Used for splash screens and high-resolution displays
- Same design, higher resolution

**How to create icons:**
1. Use the tomato SVG from `index.html` as a base
2. Export as PNG at the required sizes
3. Place both files in the project root directory
4. Make sure they have transparent or solid backgrounds

**Quick creation options:**
- Use Figma/Sketch to export the SVG as PNG
- Use online tools like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- Use Photoshop/GIMP to create square icons with the tomato centered

### 2. Test on iOS Device

1. **Deploy to Vercel** (if not already done)
2. **Open Safari on iPhone/iPad**
3. **Navigate to your website** (e.g., `https://your-app.vercel.app`)
4. **Tap the Share button** (square with arrow)
5. **Scroll down and tap "Add to Home Screen"**
6. **Customize the name** (default: "Focus Me")
7. **Tap "Add"**

### 3. Features Enabled

✅ **Full-screen mode** - No browser UI
✅ **Home screen icon** - Appears like native app
✅ **Offline support** - Works without internet (via Service Worker)
✅ **App-like experience** - Smooth transitions, native feel

## Testing Checklist

- [ ] Icons display correctly on home screen
- [ ] App opens in full-screen mode
- [ ] Timer works offline
- [ ] Data persists (localStorage)
- [ ] Looks good on different iPhone sizes
- [ ] Splash screen shows correctly

## For App Store Distribution

If you want to publish to the **Apple App Store**, you'll need:

1. **Apple Developer Account** ($99/year)
2. **Native wrapper** - Use tools like:
   - **Capacitor** (recommended - easy to use)
   - **Cordova** (older, but still works)
   - **React Native** (requires rewriting)

### Using Capacitor (Recommended)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# Initialize
npx cap init

# Add iOS platform
npx cap add ios

# Build and open in Xcode
npx cap sync
npx cap open ios
```

Then:
- Configure app in Xcode
- Set up signing certificates
- Build and submit to App Store

## Current Status

✅ PWA manifest configured
✅ Service Worker added for offline support
✅ iOS meta tags added
⏳ Icons need to be created (see step 1)

## Next Steps

1. Create the icon files (icon-192.png and icon-512.png)
2. Add them to the project
3. Commit and push to GitHub
4. Test on iOS device
5. (Optional) Set up Capacitor for App Store distribution

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Capacitor Documentation](https://capacitorjs.com/docs)

