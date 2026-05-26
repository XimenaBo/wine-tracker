// ─── GOOGLE DRIVE SIMPLE SYNC ─────────────────────────────────────────────
// Uses Google Identity Services + Drive REST API with a simple OAuth popup.
// No service account, no API console setup beyond creating an OAuth Web Client ID.

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILENAME = 'wine_tastings.json';
let driveToken = null;
let driveFileId = null;

function driveLoadLibs(callback) {
  if (window._gisLoaded) { callback(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = () => { window._gisLoaded = true; callback(); };
  document.head.appendChild(s);
}

function driveSignIn(onSuccess, onError) {
  const clientId = localStorage.getItem('gapi_client_id') || '';
  if (!clientId) { onError('No Client ID saved — paste it below and try again.'); return; }
  driveLoadLibs(() => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) { onError(resp.error); return; }
        driveToken = resp.access_token;
        onSuccess();
      }
    });
    client.requestAccessToken({ prompt: '' });
  });
}

async function driveRequest(method, path, params, body, contentType) {
  const url = new URL('https://www.googleapis.com' + path);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Authorization': 'Bearer ' + driveToken,
      ...(contentType ? { 'Content-Type': contentType } : {})
    },
    body: body || undefined
  });
  if (!res.ok) throw new Error(`Drive API error ${res.status}: ${await res.text()}`);
  return res;
}

async function driveFindFile() {
  const res = await driveRequest('GET', '/drive/v3/files', {
    q: `name='${DRIVE_FILENAME}' and trashed=false`,
    fields: 'files(id,name)',
    spaces: 'drive'
  });
  const data = await res.json();
  return data.files && data.files.length ? data.files[0].id : null;
}

async function driveSaveFile(jsonContent) {
  const fileId = driveFileId || await driveFindFile();
  const meta = JSON.stringify({ name: DRIVE_FILENAME, mimeType: 'application/json' });
  const boundary = 'wine_boundary_42';
  const body = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonContent}\r\n--${boundary}--`;
  if (fileId) {
    await driveRequest('PATCH', `/upload/drive/v3/files/${fileId}`,
      { uploadType: 'multipart' }, body, `multipart/related; boundary=${boundary}`);
    driveFileId = fileId;
  } else {
    const res = await driveRequest('POST', '/upload/drive/v3/files',
      { uploadType: 'multipart' }, body, `multipart/related; boundary=${boundary}`);
    const data = await res.json();
    driveFileId = data.id;
  }
}

async function driveLoadFile() {
  const fileId = driveFileId || await driveFindFile();
  if (!fileId) return null;
  driveFileId = fileId;
  const res = await driveRequest('GET', `/drive/v3/files/${fileId}`, { alt: 'media' });
  return await res.json();
}
