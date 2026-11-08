# Crop Library

A Chrome Manifest V3 extension by Ian Rosenthal for the Intro to AgTech crop research assignment.

Save crop names, hydroponic or soil-based growing methods, research categories, notes, and source URLs. Search, combine filters, edit entries, delete with confirmation, and export all notes as JSON.

## Install the extension

1. Download and extract `crop-library-extension.zip` from the deployed preview, or download this repository using **Code → Download ZIP** and extract it.
2. Open `chrome://extensions` in Chrome (or the equivalent extensions page in a Chromium browser).
3. Enable **Developer mode**, click **Load unpacked**, and select the folder containing `manifest.json`.
4. Open **Crop Library** from the extensions menu. Click **Add 4 example notes** for the source-based starter collection.
5. Save a note, close the popup, and reopen it to check persistence. **Open full library** gives more room.

Safari can run the website preview but cannot load this Chrome extension package directly.

## Website preview

No build is needed. Serve this folder with a static server, or deploy its contents to Netlify. The web version uses browser localStorage. The installed extension uses chrome.storage.local. These are separate collections and do not sync across browsers or devices.

The **Use current tab** button is available only in the installed extension; open a regular webpage and invoke the extension from its icon first. You can always paste a source URL.

## Files

- `manifest.json`: extension name, version, permissions, and popup.
- `index.html`: accessible form and research library.
- `styles.css`: responsive layout and visual design.
- `script.js`: storage, validation, filtering, editing, deletion, and export.
- `samples.js`: four optional starter entries.
- `research-entries.json`: four-entry research export.

## Research

The example collection contains lettuce and basil, with hydroponic pH notes and soil-based watering/harvesting notes. These are summaries of published advice, not personal growing observations. Each includes its source URL. Advice should be checked against the selected cultivar, system, and environment.

Sources reviewed November 8, 2026:
- Oklahoma State Extension: https://extension.okstate.edu/fact-sheets/electrical-conductivity-and-ph-guide-for-hydroponics
- Minnesota Extension (lettuce): https://extension.umn.edu/vegetables/growing-lettuce-endive-and-radicchio
- Minnesota Extension (basil): https://extension.umn.edu/vegetables/growing-basil

## Privacy and permissions

Only `storage` and `activeTab` are requested. There is no server, analytics, account, or browsing-history permission. Source links open only when clicked. Notes stay on the current device; export a backup before removing the extension or clearing site data. JSON import is not included in this version.

## Verification

Web preview: saved-note persistence after reload, editing, combined filtering, and source links checked. Installed Chrome extension testing requires loading the unpacked package; Safari preview testing does not establish that the extension was installed. See the delivery notes for recording and deployment status.
