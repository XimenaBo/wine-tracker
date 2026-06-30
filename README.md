# 🍷 Wine Tracker

**Ximena's wine tasting and cellar tracker for the Swiss Caves Ouvertes**

Record while tasting and keep a good overview of what's in the Swiss side of your cellar
(To include other countries/wine regions in your tastings and cellar, just record directly in the log tab. Some stats will not work great and there are only Swiss cellars currently preloaded...but this might change in the future 😜)


## Live app

**https://YOUR-USERNAME.github.io/wine-tracker**


## Features
- Log tastings on your phone, works offline
- Some pre-loaded Swiss wineries (Valais, Vaud, Bern, Neuchatel)
- Tap-to-select tags for grapes, aromas, taste & food pairings
- Star ratings, vintage comparison, stats & charts
- Google Drive sync (saves `wine_tastings.json` to your Drive)
- Export CSV / JSON at any time
- Install as a PWA (home screen icon on iPhone & Android) for easier access while at the Caves Ouvertes
- Focus on tasting instead of recording yet have all the info you need for ordering again and for planning next year's Caves Ouvertes!


## To jointly log wines with someone else
Suppose you always go wine tasting with someone, or that you share your cellar with someone. You might want to have a joint record of tastings, or a joint view of the cellar's contents. In that case, follow the following instructions:
1. Save to Drive after each tasting session
2. Share the wine_tastings.json file in Google Drive with your friend (right-click the file → Share → add their email)
3. They open the app, connect with their Google account, tap Load from Drive — they get the latest data from wine_tastings.json
4. They can add tastings and tap Save to Drive to update the shared file
5. You tap Load from Drive next time to get their additions


## Set up the app:

### Create the repository
1. Go to **github.com** → click **+** → **New repository**
2. Name it `wine-tracker`
3. Set it to **Public**
4. Click **Create repository**

### Upload the files
1. In your new empty repo, click **uploading an existing file**
2. Drag and drop the following files:

| File | Purpose |
|---|---|
| `index.html` | The app itself |
| `stats.js` | Stats tab — charts and drill-downs |
| `drive-sync.js` | Google Drive sync logic |
| `wineries.js` | Swiss winery database (used for autocomplete) |
| `wineries.json` | Source data for `wineries.js` — edit this to add wineries |
| `grapes.js` | Grape variety lists by wine type |
| `grapes.json` | Source data for `grapes.js` — edit this to customise grape suggestions |
| `demo.json` | Sample tastings shown via the "Load demo data" button |
| `manifest.json` | PWA manifest — enables "Add to Home Screen" |
| `sw.js` | Service worker — enables offline use and caching |
| `icon-192.png`, `icon-512.png`, `icon.svg` | App icons |

Upload **all of these** to the root of your repository — the app won't function correctly if any are missing, since `index.html` loads several of them directly.
3. Click **Commit changes**

### Enable GitHub Pages
1. Go to your repo **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Click **Save**
5. Wait ~60 seconds, then visit: `https://YOUR-USERNAME.github.io/wine-tracker`


## Set up Google Drive sync

1. Go to **console.cloud.google.com** and create a project
2. Go to **APIs & Services → Library** and enable **Google Drive API**
3. Go to **APIs & Services → OAuth consent screen**:
   - Set User Type to **External**
   - Under **Data access**, add scope: `drive.file`
   - Under **Audience**, add your Gmail as a **test user**
4. Go to **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
5. Type: **Web application**
6. Under **Authorised JavaScript origins** add: `https://YOUR-USERNAME.github.io`
7. Copy the **Client ID** and paste it into the app's Drive tab
8. Tap **Connect to Google Drive** — a Google popup will ask you to authorise

> The app only accesses files it creates itself (`drive.file` scope) — it cannot see the rest of your Google Drive.


## Importing your existing tastings

1. Prepare a JSON file with your tasting data (see the format below, or export from the app itself to see a working example)
2. Open the app → **Tastings** tab → tap **↑ JSON**
3. Select your file. Entries are merged with whatever you already have, matched by their `id` field, so re-importing the same file twice won't create duplicates but re-indexing would, so keep an eye on this.

### JSON format

The file should be either a plain array of tasting entries, or an object with `tastings` and `cellar` arrays, for example:

```json
{
  "tastings": [
    {
      "id": 1,
      "winery": "Cave Le Bosset",
      "name": "Petite Arvine",
      "year": "2023",
      "colour": "White",
      "region": "Valais",
      "city": "Leytron",
      "rating": 5,
      "date": "2025-06-01",
      "notes": "Apricot, mineral, long finish",
      "other_notes": "Lovely visit, friendly owners",
      "grapes": ["Petite Arvine"],
      "food": ["Fish / seafood"],
      "bottles_bought": "2",
      "how_many_left": "1"
    }
  ],
  "cellar": []
}
```

Key fields:
- `how_many_left` is the source of truth for your Cellar tab stock count — if missing, the app falls back to `bottles_bought`
- `date` should be in `YYYY-MM-DD` format and represents when you tasted the wine (not the vintage)
- `year` is the wine's vintage

  
## Backing up your data
- **Tastings tab → ↑/↓ JSON** — full backup of tastings + cellar, in the exact format the app uses; the best option for restoring or transferring between devices
- **Tastings tab → ↓ CSV** — tastings only (not cellar), useful for opening in Excel or Google Sheets to browse or analyse outside the app
- **Drive tab → Save to Drive** — saves the same JSON backup directly to your Google Drive (see setup above)

It is suggested to back up to JSON periodically, especially before any bulk re-import.


## And that's it!
You are all set up and ready for the next Caves Ouvertes or any other Swiss wine tasting event: to know what you tasted, what you thought of each wine, how they rank to other wines you've had, and what to buy again!
Cheers! 🥂 🍷 🎉

