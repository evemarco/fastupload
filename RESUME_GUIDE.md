# Resume & Persistence Guide

## Overview

FastUpload automatically remembers and can resume **interrupted uploads**, even if:
- ✅ Browser is closed or refreshed
- ✅ Server is restarted
- ✅ Network connection is lost
- ✅ Computer is shut down
- ✅ External disk is disconnected and reconnected

## How It Works

### 1. Server-Side Persistence

When an upload starts, TUS creates two files:

```
uploads/
├── 3aff8c6abb9a421cb0168a9da0e02b92        ← Upload file (partial or complete)
└── 3aff8c6abb9a421cb0168a9da0e02b92.json  ← Metadata file
```

The **metadata file** contains:
```json
{
  "id": "3aff8c6abb9a421cb0168a9da0e02b92",
  "metadata": {
    "filename": "large-video.mp4",
    "filetype": "video/mp4"
  },
  "size": 53687091200,      ← Total file size (5GB)
  "offset": 2684354560,      ← Bytes uploaded so far (2.6GB, 50%)
  "creation_date": "2026-01-25T10:41:40.419Z"
}
```

**Key Points**:
- `offset` shows progress (how many bytes uploaded)
- `size` is total file size
- `offset < size` = upload in progress or paused
- `offset = size` = upload complete
- Files are kept even if server restarts

### 2. Client-Side Persistence

The browser stores upload information in:
- **IndexedDB** (primary storage, large capacity)
- **localStorage** (fallback, limited)

This allows:
- Remembering uploads across browser sessions
- Detecting partial uploads when page loads
- Prompting to resume interrupted uploads

### 3. External Disk Support

If you use an external disk for uploads (e.g., `UPLOAD_DIR=/mnt/external/uploads`):

**When disk is connected**:
- Uploads work normally
- Partial uploads are saved to disk

**When disk is disconnected**:
- Server still starts successfully
- Uploads in memory are preserved
- When disk is reconnected, uploads can resume

## Resume Scenarios

### Scenario 1: Browser Closed

1. **Upload** starts → 60% complete
2. **Browser** is closed
3. **Reopen** browser → Go to upload page
4. **Partial upload** is displayed with "Paused" status
5. **Click** "Resume" button
6. **Select** the same file
7. **Upload** continues from 60%

### Scenario 2: Server Restarted

1. **Upload** starts → 45% complete
2. **Server** is restarted (`pnpm start`)
3. **Partial upload** is still on disk
4. **Reopen** browser → Partial upload shown
5. **Click** "Resume" button
6. **Upload** continues from 45%

### Scenario 3: Network Disconnected

1. **Upload** starts → 78% complete
2. **Network** disconnects
3. **Upload** automatically pauses
4. **Network** reconnects
5. **Click** "Resume" button
6. **Upload** continues from 78%

### Scenario 4: External Disk Disconnected

1. **Upload** starts → 30% complete
2. **External disk** is disconnected
3. **Server** detects directory not accessible
4. **Upload** is paused (in memory)
5. **Disk** is reconnected
6. **Click** "Resume" button
7. **Upload** continues from 30%

## API Endpoints

### List Completed Uploads

```bash
GET /api/uploads
```

Response:
```json
[
  {
    "id": "file-1706159234567.pdf",
    "name": "original-file.pdf",
    "size": 13235541,
    "modified": "2026-01-25T10:41:40.419Z",
    "url": "/upload/file-1706159234567.pdf",
    "status": "completed"
  }
]
```

### List Partial (In-Progress) Uploads

```bash
GET /api/uploads/partial
```

Response:
```json
[
  {
    "id": "3aff8c6abb9a421cb0168a9da0e02b92",
    "name": "large-video.mp4",
    "size": 2684354560,
    "totalSize": 53687091200,
    "progress": "50.00",
    "modified": "2026-01-25T10:41:40.419Z",
    "creationDate": "2026-01-25T10:20:00.000Z",
    "status": "paused",
    "metadata": {
      "id": "3aff8c6abb9a421cb0168a9da0e02b92",
      "size": 53687091200,
      "offset": 2684354560
    }
  }
]
```

**Status Values**:
- `in_progress` - Upload was actively running when interrupted
- `paused` - Upload was paused or stopped

## User Interface

### On Page Load

When you open the upload page:

1. **Auto-detect** partial uploads from server
2. **Display** each partial upload with:
   - Original filename
   - Progress percentage
   - Bytes uploaded / total bytes
   - Status (In Progress or Paused)
   - "Resume" button
   - "Delete" button

### Resuming an Upload

1. **Click** "Resume" button on partial upload
2. **Browser** prompts to select file
3. **Select** the same file (or a replacement)
4. **TUS client** detects partial upload from server
5. **Upload** continues from where it stopped

**File Matching**:
- If filename matches exactly → Resume automatically
- If filename doesn't match → Prompt to confirm
- This prevents resuming wrong file

### Deleting a Partial Upload

1. **Click** "Delete" button on partial upload
2. **Confirm** deletion
3. **Server** deletes:
   - Partial upload file
   - Metadata file
4. **UI** removes the item

## Cleanup

### Automatic Cleanup

Server cleans up on startup:

1. **Empty files** (0 bytes, failed uploads)
2. **Orphaned metadata** (`.json` files without corresponding files)

### Manual Cleanup

If you want to clean old partial uploads:

```bash
# List partial uploads
ls -la uploads/ | grep -E "^-.* 0 "

# Delete specific partial upload
rm uploads/PARTIAL_FILE_ID
rm uploads/PARTIAL_FILE_ID.json

# Or use the UI
# - Go to upload page
# - Click "Delete" on partial upload
```

### Clean Old Uploads (Cron Job)

```bash
# Delete partial uploads older than 7 days
find uploads/ -name "*.json" -mtime +7 -exec rm {} \;
find uploads/ -size 0 -mtime +7 -delete
```

## Configuration

### Keep Partial Uploads Longer

By default, partial uploads are kept indefinitely. To add expiration:

```javascript
// server.js

// In cleanupUploads function
const MAX_AGE_DAYS = 7; // Keep partials for 7 days

files.forEach(filename => {
  const filePath = path.join(UPLOAD_DIR, filename);
  const stats = fs.statSync(filePath);

  // Delete old partial files
  if (stats.size === 0) {
    const age = Date.now() - stats.mtime.getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);

    if (ageDays > MAX_AGE_DAYS) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old partial: ${filename}`);
    }
  }
});
```

## Troubleshooting

### Partial Uploads Not Showing

**Problem**: Page loads but partial uploads aren't displayed

**Solutions**:

1. **Check API endpoint**:
   ```bash
   curl http://YOUR_HOST:PORT/api/uploads/partial
   ```

2. **Check browser console**:
   - Open DevTools (F12)
   - Look for errors in Console tab

3. **Clear browser cache**:
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

4. **Check uploads directory**:
   ```bash
   ls -la uploads/
   # Should see both files and .json metadata files
   ```

### Resume Not Working

**Problem**: Clicking "Resume" doesn't continue from correct point

**Solutions**:

1. **Verify file is same**:
   - Filename must match original
   - File size must be same
   - File content must be same (use same file!)

2. **Check metadata file**:
   ```bash
   cat uploads/PARTIAL_ID.json
   # Check that "offset" and "size" are correct
   ```

3. **Check server logs**:
   ```bash
   pnpm start
   # Should see: "Upload completed: ..."
   ```

### Partial Uploads Piling Up

**Problem**: Too many partial uploads accumulating

**Solutions**:

1. **Delete old partials**:
   ```bash
   # Delete partial uploads older than 7 days
   find uploads/ -name "*.json" -mtime +7 -exec rm {} \;
   ```

2. **Add cleanup cron job**:
   ```bash
   # Run daily cleanup
   0 3 * * * /path/to/cleanup-script.sh
   ```

3. **Set automatic expiration**:
   - Modify `server.js` to delete old partials
   - See "Keep Partial Uploads Longer" section above

### External Disk Issues

**Problem**: Uploads fail when external disk is disconnected

**Solution**:

The server handles this gracefully:
1. Uploads in memory are preserved
2. When disk is reconnected, uploads can resume

**To improve**:
- Use a monitoring script to check disk connectivity
- Display disk status in UI
- Notify user when disk is disconnected

## Best Practices

### 1. Test Resume Functionality

Before relying on resume for important uploads:
1. Start a large upload (>100MB)
2. Pause or interrupt at 50%
3. Close browser
4. Reopen browser
5. Resume upload
6. Verify it continues from 50%

### 2. Monitor Disk Space

Partial uploads use disk space:
- Keep track of `uploads/` directory size
- Clean up old partials regularly
- Set up alerts for low disk space

```bash
# Monitor uploads directory
watch -n 10 'du -sh uploads/'
```

### 3. Backup Metadata Files

Metadata files are critical for resume:
- They contain progress information
- Losing them means starting over

**Backup strategy**:
```bash
# Backup metadata files periodically
rsync -av uploads/*.json /backup/metadata/
```

### 4. Use Appropriate Chunk Sizes

Chunk size affects resume:
- **Smaller chunks** (10-25MB): Better resume, more overhead
- **Larger chunks** (50-200MB): Faster, harder to resume

For unreliable connections, use smaller chunks.

## Advanced Topics

### Custom Resume Logic

You can customize resume behavior in `public/index.html`:

```javascript
// In startUpload function

upload.findPreviousUploads().then((previousUploads) => {
  if (previousUploads.length > 0) {
    // Custom logic: Only resume if file hasn't changed
    const previous = previousUploads[0];
    if (file.size === previous.size && file.name === file.name) {
      upload.resumeFromPreviousUpload(previous);
      updateChunkInfo(uploadId, 'Resuming previous upload...');
    } else {
      // File changed, start new upload
      console.log('File modified, starting fresh upload');
      upload.start();
    }
  } else {
    upload.start();
  }
});
```

### Resume with Different File

If you need to resume with a different file (same size, different content):

```javascript
// In resumePartialUpload function

// Bypass file name check
upload.resumeFromPreviousUpload(previousUpload);
```

⚠️ **Warning**: This can corrupt the upload if files are different!

### Track Resume Statistics

Add logging for resume attempts:

```javascript
// In resumePartialUpload function

console.log(`Resume attempt:`, {
  filename: originalFilename,
  uploadId: uploadId,
  timestamp: new Date().toISOString()
});

// Log to server for analytics
fetch('/api/resume-stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: originalFilename,
    timestamp: new Date().toISOString()
  })
});
```

## Summary

✅ **Automatic Persistence**: Uploads are saved automatically
✅ **Browser Restart**: Partial uploads remembered
✅ **Server Restart**: Partial uploads preserved on disk
✅ **Network Issues**: Can resume when connection returns
✅ **External Disks**: Works with removable storage
✅ **Easy Recovery**: Simple click-to-resume UI

FastUpload makes resuming uploads as easy as clicking a button! 🎉
