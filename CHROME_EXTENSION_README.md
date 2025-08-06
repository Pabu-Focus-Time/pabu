# RedPanda Focus Time - AI-Powered Chrome Extension

This React/Vite application has been converted to work as a sophisticated Chrome extension with AI-powered content analysis. The extension provides a productivity app to help you focus on your projects, track your time, and automatically detect distracting content using artificial intelligence.

## Building the Extension

To build the Chrome extension, run:

```bash
npm run build:extension
```

This will:

1. Build the React application using Vite
2. Copy the manifest.json file to the dist folder
3. Copy the extension icons to the dist folder
4. Copy the background script to the dist folder

## Installing the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" button
4. Select the `dist` folder from this project
5. The RedPanda Focus Time extension should now appear in your extensions list

## Using the Extension

1. Click on the RedPanda Focus Time icon in your Chrome toolbar
2. The extension will open as a full webpage in a new tab with the complete React application
3. Create and activate focus projects to enable AI-powered content monitoring
4. The extension will automatically analyze web content and show popup warnings for distracting sites
5. Random tab checking ensures you stay focused even when switching between tabs
6. Data is stored using Chrome's storage API, so your projects and sessions will persist

## Features

### Core Features

- **Project Management**: Create and manage your focus projects
- **Time Tracking**: Track time spent on different projects
- **Session History**: View your past focus sessions
- **Settings**: Customize your focus experience
- **Chrome Storage**: Data persists across browser sessions using Chrome's storage API

### AI-Powered Content Analysis

- **Real-time Content Checking**: AI analyzes every webpage you visit for relevance to your focus project
- **Smart Popup Warnings**: Beautiful, non-intrusive popups warn you about potentially distracting content
- **Relevance Scoring**: Each page gets a 0-100 relevance score based on your project type and description
- **Educational Value Assessment**: AI determines if content has educational value for your learning goals
- **Distraction Risk Analysis**: Identifies content that might lead you off-track

### Advanced Monitoring

- **Random Tab Checking**: Periodically checks random open tabs to catch distracting content
- **Automatic Content Script Injection**: Seamlessly injects warning popups into any webpage
- **Debounced Analysis**: Efficient processing that waits for pages to fully load before analysis
- **Activity Logging**: Comprehensive tracking of your browsing patterns and focus sessions

## Development

For development, you can still run the regular development server:

```bash
npm run dev
```

This will run the app in development mode at `http://localhost:8080`. The Chrome storage service will fall back to localStorage in development mode.

## Extension Structure

- `manifest.json`: Chrome extension manifest file
- `background.js`: Service worker for the extension
- `icons/`: Extension icons in various sizes (16x16, 32x32, 48x48, 128x128)
- `index.html`: Main application HTML file
- `assets/`: Built React application files

## Technical Details

### Extension Architecture

- Uses Manifest V3 (the latest Chrome extension format)
- Hash-based routing for compatibility with Chrome extension context
- Chrome storage API for data persistence with localStorage fallback
- Service worker background script for extension lifecycle management
- Full-page interface that opens in a new tab when clicking the extension icon

### AI Integration

- **Agent-based Content Checker**: Sophisticated AI analysis using GPT-4o-mini
- **Requesty AI Router**: High-performance AI API with automatic retries and error handling
- **JSON Response Parsing**: Robust parsing of AI responses with fallback handling
- **Batch Processing**: Efficient analysis of multiple URLs with rate limiting
- **Hybrid Analysis**: Combines AI insights with rule-based checking for accuracy

### Content Script System

- **Dynamic Injection**: Content scripts are injected only when needed
- **Beautiful UI**: Custom-styled popup warnings that match the RedPanda theme
- **Non-blocking**: Warnings don't prevent page functionality
- **Escape Handling**: Easy dismissal with ESC key or click-outside
- **Responsive Design**: Works on all screen sizes and websites

## Permissions

The extension requests the following permissions:

- `storage`: To save and retrieve user data
- `activeTab`: To interact with the current tab if needed
- `tabs`: To create new tabs when opening the application

## Troubleshooting

If the extension doesn't load properly:

1. Check the Chrome developer console for any errors
2. Ensure all files are present in the dist folder after building
3. Try reloading the extension in `chrome://extensions/`
4. Check that the manifest.json file is valid JSON

## Building for Production

The extension is ready for production use. To distribute it:

1. Build using `npm run build:extension`
2. Zip the contents of the `dist` folder
3. Upload to the Chrome Web Store (requires developer account)
