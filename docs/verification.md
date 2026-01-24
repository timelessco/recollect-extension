# Extension Verification Checklist

Reusable checklist for verifying extension builds before release. Use this for both development testing and production release verification.

## Pre-flight Checks

### Build Commands

| Command         | Output Directory          | Purpose                    |
| --------------- | ------------------------- | -------------------------- |
| `bun run dev`   | `.output/chrome-mv3-dev/` | Development build with HMR |
| `bun run build` | `.output/chrome-mv3/`     | Production build           |

### Expected Manifest Permissions

Both builds should include:

```json
{
	"permissions": ["cookies", "storage"],
	"host_permissions": ["http://localhost/*", "https://app.recollect.so/*"]
}
```

### Loading Extension in Chrome

1. Navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the appropriate output directory
5. Verify extension appears with correct icon

## Development Environment Verification

### Prerequisites

- [ ] Local Recollect app running at `http://localhost:3000`
- [ ] Dev server running (`bun run dev`)

### Load Extension

- [ ] Load extension from `.output/chrome-mv3-dev/`
- [ ] Extension loads without errors in chrome://extensions
- [ ] Extension icon visible in toolbar

### HMR Verification

- [ ] Open popup by clicking extension icon
- [ ] Edit `src/components/popup/signed-out-view.tsx` (change text)
- [ ] Popup updates automatically without manual reload
- [ ] Close and reopen popup - changes persist

### Auth State Testing (Signed Out)

- [ ] Ensure logged OUT of `http://localhost:3000`
- [ ] Open popup
- [ ] Shows "Sign in to Recollect" button
- [ ] Button links to correct URL

### Auth State Testing (Signed In)

- [ ] Log INTO `http://localhost:3000`
- [ ] Close and reopen popup (required - no live polling)
- [ ] Shows "Sync Instagram" button (disabled state)
- [ ] Button shows "(coming soon)" indicator

### Debug Logging Verification (Dev Only)

- [ ] Open chrome://extensions
- [ ] Click "service worker" link on the extension
- [ ] In console, run: `await chrome.storage.local.get('auth_debug')`
- [ ] Should return object with:
  - `timestamp` - ISO date string
  - `cookieNames` - array of cookie names found
  - `result` - auth state result ('authenticated', 'no-session', 'expired')

## Production Environment Verification

### Prerequisites

- [ ] Production build exists (`bun run build`)
- [ ] Dev extension removed from Chrome

### Load Extension

- [ ] Load extension from `.output/chrome-mv3/`
- [ ] Extension loads without errors in chrome://extensions
- [ ] Extension icon visible in toolbar

### Auth State Testing (Signed Out)

- [ ] Ensure logged OUT of `https://app.recollect.so`
- [ ] Open popup
- [ ] Shows "Sign in to Recollect" button
- [ ] Button links to `https://app.recollect.so`

### Auth State Testing (Signed In)

- [ ] Log INTO `https://app.recollect.so`
- [ ] Close and reopen popup
- [ ] Shows "Sync Instagram" button (disabled state)

### Debug Logging Verification (Prod)

- [ ] Open service worker console
- [ ] Run: `await chrome.storage.local.get('auth_debug')`
- [ ] Should return empty object `{}` (no debug logging in prod)

## Expected Warnings (Not Errors)

These warnings are acceptable and do not indicate issues:

### CSP WebSocket Warning (Dev Only)

```
Refused to connect to 'ws://localhost:3001/' because it violates the following Content Security Policy directive...
```

This is related to HMR and only appears during development.

### Service Worker Registration

```
Service worker registration succeeded
```

Brief message during extension load/reload - informational, not an error.

### Deprecated Manifest Keys

Chrome may warn about deprecated keys. These are browser-level warnings, not extension bugs.

### Extension Context Invalidated

```
Extension context invalidated
```

Occurs if popup is open during extension reload. Close and reopen popup.

## Console Error Detection

### What Counts as a Failure

- **Red console errors** on popup load = FAIL
- Errors in service worker console = FAIL
- JavaScript exceptions = FAIL

### What's Acceptable

- Yellow warnings = OK (document if recurring)
- Network errors for external resources = Investigate, likely OK
- CSP warnings in dev = OK (HMR related)

## Troubleshooting

### Wrong Output Directory Loaded

**Symptom:** Auth detection not working, wrong environment.

**Fix:**

1. Verify which directory is loaded in chrome://extensions
2. Dev: `.output/chrome-mv3-dev/`
3. Prod: `.output/chrome-mv3/`
4. Remove and re-add if wrong

### Stale Extension State

**Symptom:** Old UI, cached behavior.

**Fix:**

1. Remove extension from chrome://extensions
2. Clear browser cache (optional)
3. Re-run build command
4. Load extension fresh

### Missing Cookies

**Symptom:** Always shows "Sign in" even when logged in.

**Fixes:**

1. Verify you're logged into the correct domain
2. Check if cookies are blocked (browser settings)
3. Verify cookie names in service worker: `await chrome.cookies.getAll({ domain: 'localhost' })`
4. Ensure session hasn't expired (log out and back in)

### Auth State Not Updating

**Symptom:** Popup shows old auth state after login/logout.

**Expected Behavior:** Popup must be closed and reopened to refresh auth state. This is by design for v1 (no real-time polling).

### Debug Storage Not Appearing

**Symptom:** `chrome.storage.local.get('auth_debug')` returns empty in dev.

**Fixes:**

1. Trigger auth check by opening popup
2. Verify dev build is loaded (not prod)
3. Check service worker console for errors

## Release Checklist

Before publishing a new version:

- [ ] `bun run build` completes without errors
- [ ] Production manifest has correct version number
- [ ] All production verification checks pass
- [ ] No console errors on load
- [ ] Auth flow works for both signed-in and signed-out states
- [ ] Debug logging is disabled (empty auth_debug storage)
