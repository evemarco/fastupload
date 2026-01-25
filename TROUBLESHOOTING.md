# Troubleshooting Guide

This guide helps you diagnose and fix common issues with FastUpload.

---

## 🔴 TUS Upload Creation Error

### Error Message

```
tus: unexpected response while creating upload, originated from request
(method: POST, url: /upload, response code: 500,
response text: Something went wrong with that request
Cannot read properties of undefined (reading 'id'),
request id: n/a)
```

### Root Cause

This error occurs when the TUS server's event handlers are incorrectly configured. The code tries to access `event.upload.id` but `event.upload` is undefined.

### ✅ Solution (Already Fixed)

The issue has been fixed in the latest version. Event handlers now use the correct `@tus/server` syntax:

**Before (Incorrect)**:

```javascript
import { Server, EVENTS } from '@tus/server';

const tusServer = new Server({ ... });

tusServer.on(EVENTS.POST_CREATE, (event) => {
  console.log('Upload created:', event.upload.id); // ❌ event.upload is undefined
});
```

**After (Correct)**:

```javascript
import { Server } from '@tus/server';

const tusServer = new Server({
  ...,
  onUploadCreate(req, upload) {  // ✅ Correct signature
    console.log('Upload created:', upload.id);
  },
  onUploadFinish(req, upload) {  // ✅ Correct signature
    console.log('Upload completed:', upload.id);
  },
});
```

### How to Verify the Fix

1. Check your `server.js` file:

   ```bash
   cat server.js | grep -A 5 "onUploadCreate"
   ```

2. Should show:

   ```javascript
   onUploadCreate(req, upload) {
     console.log(`Upload created: ${upload.id}`);
   },
   ```

3. NOT this:

   ```javascript
   tusServer.on(EVENTS.POST_CREATE, (event) => {
     console.log('Upload created:', event.upload.id);
   });
   ```

### If Error Persists

1. **Restart the server**:

   ```bash
   pnpm start
   ```

2. **Clear browser cache**:
   - Chrome: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
   - Or: DevTools → Network tab → Disable cache checkbox

3. **Check server logs**:

   ```bash
   # Server should show: "Server running on http://..."
   # When uploading, should show: "Upload created: ..."
   ```

4. **Test with a small file**:
   - Start with a 1-5 MB file
   - Check if upload creation works
   - Then try larger files

---

## 🟡 CORS Errors

### Error Message

```
Access to XMLHttpRequest at 'http://...' has been blocked by CORS policy
```

### Root Cause

Server is not properly configured to allow cross-origin requests.

### ✅ Solution

The server now has comprehensive CORS configuration. Verify your `server.js` has:

```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Upload-Offset',
    'Tus-Resumable',
    'Upload-Length',
    'Upload-Metadata',
    'Upload-Defer-Length',
    'X-Requested-With',
    'Cache-Control'
  ],
  exposedHeaders: [
    'Upload-Offset',
    'Tus-Version',
    'Tus-Resumable',
    'Upload-Length',
    'Location'
  ],
  credentials: false,
}));
```

### If Error Persists

1. **Check browser console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for CORS errors

2. **Check server headers**:

   ```bash
   curl -I http://YOUR_HOST:PORT/upload

   # Should see:
   # Access-Control-Allow-Origin: *
   # Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
   ```

3. **Test with CORS disabled**:
   - Temporarily disable CORS in browser (for testing)
   - Or use browser extensions to bypass CORS (for testing only)

---

## 🟠 Upload Directory Errors

### Error Message

```
Error: ENOENT: no such file or directory, open '.../uploads/...'
```

### Root Cause

The `uploads/` directory doesn't exist.

### ✅ Solution

The server now automatically creates the uploads directory. If you still have issues:

```bash
# Create uploads directory manually
mkdir -p uploads

# Set proper permissions
chmod 755 uploads

# Verify it exists
ls -ld uploads
```

### If Error Persists

1. **Check directory path**:

   ```bash
   # In server.js, check:
   # const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

   # Verify:
   echo $(process.cwd())/uploads
   ```

2. **Check file system permissions**:

   ```bash
   # Check if user has write permission
   touch uploads/test
   rm uploads/test
   ```

3. **Check disk space**:

   ```bash
   df -h
   # Ensure sufficient disk space for uploads
   ```

---

## 🔵 Server Startup Errors

### Error Message

```
Error: listen EADDRINUSE: address already in use :::3000
```

### Root Cause

Port 3000 is already in use by another process.

### ✅ Solution

1. **Find process using port**:

   ```bash
   # Linux/Mac
   lsof -i :3000
   # or
   netstat -tulpn | grep 3000

   # Windows
   netstat -ano | findstr :3000
   ```

2. **Kill the process**:

   ```bash
   # Linux/Mac
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. **Or use a different port**:

   ```bash
   # In .env file
   PORT=3001
   ```

### Error Message

```
Error: listen EADDRNOTAVAIL: address not available
```

### Root Cause

HOST address is invalid or not available.

### ✅ Solution

1. **Check your VPN/local IP**:

   ```bash
   # Linux/Mac
   ip addr show

   # Windows
   ipconfig
   ```

2. **Update .env with correct IP**:

   ```bash
   # Use valid IP addresses:
   HOST=0.0.0.0           # All interfaces
   HOST=127.0.0.1           # Localhost only
   HOST=10.8.0.1            # Your VPN IP
   HOST=192.168.1.100       # Your local IP
   ```

---

## 🟣 Upload Progress Issues

### Issue: Progress not updating

### ✅ Solution

1. **Check TUS endpoint**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Filter by "upload"
   - Check if PATCH requests are being sent

2. **Check browser console**:
   - Look for JavaScript errors
   - Check if tus-js-client is loaded correctly

3. **Verify chunk size**:

   ```javascript
   // In public/index.html
   const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB

   // If too large, reduce:
   const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
   ```

4. **Test with small file**:
   - Start with 1-5 MB file
   - Verify progress updates
   - Then try larger files

### Issue: Upload stuck at same percentage

### ✅ Solution

1. **Check network connection**:

   ```bash
   ping google.com
   # or
   ping 8.8.8.8
   ```

2. **Check server logs**:

   ```bash
   # Should see upload progress
   # Upload created: ...
   # Upload completed: ...
   ```

3. **Check available disk space**:

   ```bash
   df -h uploads/
   # Ensure sufficient space
   ```

4. **Restart server**:

   ```bash
   pnpm start
   ```

---

## 🟡 Resume Not Working

### Issue: Cannot resume interrupted upload

### ✅ Solution

1. **Check browser storage**:
   - Open DevTools (F12)
   - Go to Application tab → Storage → Local Storage
   - Look for tus-js-client entries
   - They should contain upload IDs

2. **Check server for partial uploads**:

   ```bash
   # Look for .info files or partial uploads
   ls -la uploads/
   ```

3. **Test resume**:
   - Start an upload
   - Pause it or kill network
   - Resume upload
   - Should continue from where it stopped

4. **Check TUS endpoint**:
   - Verify HEAD request works:

   ```bash
   curl -I http://YOUR_HOST:PORT/upload/UPLOAD_ID
   ```

---

## 🟤 Large File Upload Issues

### Issue: Upload fails with large files (>10GB)

### ✅ Solution

1. **Check max file size limit**:

   ```javascript
   // In server.js
   const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

   // Increase if needed:
   const MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB
   ```

2. **Check available disk space**:

   ```bash
   df -h
   # Need at least 2x file size (for temp storage)
   ```

3. **Check timeout settings**:
   - Increase server timeout
   - Increase client timeout
   - Reduce chunk size for stability

4. **Monitor memory usage**:

   ```bash
   # Check if server runs out of memory
   htop
   # or
   top
   ```

---

## 🟠 Network Connection Issues

### Issue: Cannot connect to server via VPN

### ✅ Solution

1. **Check VPN is connected**:

   ```bash
   ping YOUR_VPN_IP
   # Example: ping 10.8.0.1
   ```

2. **Check firewall**:

   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 3000

   # Windows
   # Windows Firewall → Allow an app through firewall
   ```

3. **Check HOST and PORT**:

   ```bash
   # Verify .env file
   cat .env | grep -E "^HOST|^PORT"
   ```

4. **Test with curl**:

   ```bash
   curl http://YOUR_VPN_IP:PORT
   # Should return HTML content
   ```

---

## 📊 Server Logs

### How to View Logs

```bash
# View server output
pnpm start

# Logs are shown in console:
# - Upload created: ...
# - Upload completed: ...
# - Server running on ...
```

### Enable File Logging (Optional)

If you want to save logs to a file:

```javascript
// Add at top of server.js
import fs from 'fs';
import path from 'path';

// Create logs directory
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create write stream
const logStream = fs.createWriteStream(
  path.join(logDir, `fastupload-${new Date().toISOString().split('T')[0]}.log`),
  { flags: 'a' }
);

// Redirect console to log file
console.log = function(message) {
  logStream.write(`${new Date().toISOString()} - ${message}\n`);
  process.stdout.write(`${message}\n`);
};
```

---

## 🔍 Debug Mode

### Enable Detailed Logging

In `public/index.html`, find the tus.Upload configuration and add:

```javascript
const upload = new tus.Upload(file, {
  endpoint: TUS_ENDPOINT,
  chunkSize: CHUNK_SIZE,
  retryDelays: [0, 1000, 3000, 5000],
  metadata: {
    filename: file.name,
    filetype: file.type,
  },

  // ADD THIS FOR DEBUGGING:
  log: function(message, ...args) {
    console.log('[tus-js-client]', message, args);
  },

  onStart() {
    console.log('Upload started:', file.name);
  },

  onProgress(bytesUploaded, bytesTotal) {
    console.log(`Progress: ${(bytesUploaded / bytesTotal * 100).toFixed(2)}%`);
  },

  onSuccess() {
    console.log('Upload completed successfully!');
  },

  onError(error) {
    console.error('Upload failed:', error);
  }
});
```

---

## 🆘 Getting Help

### Before Asking for Help

1. **Check this guide** - Your issue might already be documented
2. **Search the internet** - Others might have had the same issue
3. **Collect information**:
   - Server version
   - Node.js version
   - Browser name and version
   - Error message (exact text)
   - Steps to reproduce
   - Server logs (if available)
   - Browser console logs (if available)

### Where to Ask

- **GitHub Issues** - [Create a new issue](https://github.com/your-repo/issues)
- **TUS Documentation** - [tus.io/protocols](https://tus.io/protocols)
- **Stack Overflow** - [Tag with `tus-js-client`](https://stackoverflow.com/questions/tagged/tus-js-client)

### Template for Bug Reports

```markdown
## Description
Brief description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens (error messages, etc.)

## Environment
- Node.js version: `node --version`
- FastUpload version: `1.0.0`
- Browser: Chrome/Firefox/Safari + version
- OS: Windows/Linux/Mac

## Logs
### Server Logs
```

Paste server logs here

```

### Browser Console
```

Paste browser console logs here

```

### Network Tab
```

Relevant request/response headers from Network tab

```
```

---

## ✅ Common Solutions Summary

| Issue | Solution |
|-------|----------|
| Cannot read properties of undefined | Use correct `onUploadCreate` syntax |
| CORS errors | Check CORS configuration in server.js |
| Port already in use | Kill process or change PORT |
| Uploads directory error | Create `uploads/` directory |
| Cannot connect via VPN | Check VPN IP and firewall |
| Progress not updating | Check network and TUS endpoint |
| Resume not working | Check browser storage and server partials |
| Large file failures | Increase MAX_FILE_SIZE and disk space |

---

## 📚 Related Documentation

- [README.md](./README.md) - Main documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [TUS_GUIDE.md](./TUS_GUIDE.md) - TUS protocol guide
- [VPN_GUIDE.md](./VPN_GUIDE.md) - VPN configuration guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide
