# 🍷 Wine Tracker

Personal wine tasting tracker for Swiss Caves Ouvertes.

## Live app
**https://XimenaBo.github.io/wine-tracker**

## Features
- Log tastings on your phone, works offline
- Some pre-loaded Swiss wineries (Valais, Vaud, Bern, Neuchatel)
- Tap-to-select tags for grapes, aromas, taste & food pairings
- Star ratings, vintage comparison, stats & charts
- Google Drive sync (saves `wine_tastings.json` to your Drive)
- Export CSV / JSON at any time
- Installable as a PWA (home screen icon on iPhone & Android)

---

## Deploy to GitHub Pages (one-time, ~5 minutes)

### Step 1 — Create the repository
1. Go to **github.com** → click **+** → **New repository**
2. Name it exactly: `wine-tracker`
3. Set it to **Public**
4. Click **Create repository**

### Step 2 — Upload the files
1. In your new empty repo, click **uploading an existing file**
2. Drag and drop ALL files from this folder:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
3. Click **Commit changes**

### Step 3 — Enable GitHub Pages
1. Go to your repo **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Click **Save**
5. Wait ~60 seconds, then visit: `https://YOUR-USERNAME.github.io/wine-tracker`

---

## Set up Google Drive sync (optional, ~10 minutes)

### Step 1 — Google Cloud Console
1. Go to **console.cloud.google.com**
2. Click **Select a project** → **New Project** → name it `Wine Tracker` → **Create**
3. Make sure your new project is selected

### Step 2 — Enable APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable: **Google Drive API**

### Step 3 — Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **API key**
3. Copy the key, click **Edit** → restrict it to **Google Drive API**

### Step 4 — Create OAuth Client ID
1. Click **+ Create Credentials** → **OAuth client ID**
2. If prompted, configure the consent screen first:
   - User type: **External** → fill in app name "Wine Tracker", your email
   - Scopes: add `https://www.googleapis.com/auth/drive.file`
   - Test users: add your Gmail address
3. Back to Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Wine Tracker`
   - Authorised JavaScript origins: add `https://YOUR-USERNAME.github.io`
4. Click **Create** → copy the **Client ID**

### Step 5 — Connect in the app
1. Open your Wine Tracker app
2. Go to **☁ Drive** tab
3. Paste the **Client ID** and **API Key**
4. Click **Connect to Google Drive**
5. Authorise access — done!

From now on, tap **Save to Drive** after each tasting session. Your `wine_tastings.json` will appear in the root of your Google Drive.

---

## Import your existing tastings
1. Open the app → **Tastings** tab → **↑ JSON**
2. Select the `wine_import.json` file Claude provided
3. All 320 entries will be imported instantly
