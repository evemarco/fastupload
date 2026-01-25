# TUS Protocol Guide

## Overview

This guide explains the **TUS protocol** (The Upload Standard) in simple terms, focusing on why it's essential for large file uploads.

---

## Table of Contents

1. [What is TUS?](#what-is-tus)
2. [Why is it Great for Large Files?](#why-is-it-great-for-large-files)
3. [How Does it Work?](#how-does-it-work)
4. [Moving Analogy](#moving-analogy)
5. [Problems that TUS Solves](#problems-that-tus-solves)
6. [TUS vs Traditional Upload](#tus-vs-traditional-upload)
7. [In Your FastUpload Project](#in-your-fastupload-project)
8. [FAQ](#faq)

---

## 🎯 What is the TUS Protocol?

**TUS** = **T**he **U**pload **S**tandard

It's a standardized way to transfer files between a computer (your browser) and a server. It's like a common language that both understand to ensure the transfer is done correctly.

### Key Points:

- ✅ **Open Standard** - Free and accessible to everyone
- ✅ **Automatic Resume** - If it cuts off, it resumes where it stopped
- ✅ **Compatible** - Works everywhere (Chrome, Firefox, Safari, mobile...)
- ✅ **Secure** - No corrupted files
- ✅ **Reliable** - Perfect for unstable internet connections

## 🚀 Why is it Great for Large Files?

Imagine you need to send a **50 GB file** (size of 50 full movies or 10,000 photos).

### Without TUS (traditional method):

50 GB file → Upload in one block → ❌ Problem if it cuts off at 99%

**Result**: You must **restart from the beginning**! 😢

### With TUS:

50 GB file → Divided into 1,000 pieces → Upload piece by piece

**If it cuts off at 99%**:

- ✅ You already have 990 pieces sent
- ✅ You have 10 pieces left
- ✅ **You resume at 99%, not 0%**! 🎉

**Time saved**: Instead of re-uploading 50 GB, you upload only 0.5 GB (10 pieces)!

## 🔄 How Does it Work?

### The Conversation Between Browser and Server

The browser and server "talk":

```json
Browser: "Hello, I want to upload this 50 GB file"
Server: "OK, I'll create an upload with ID abc123"
Browser: "Sending first piece (1-50 MB)"
Server: "Received, offset: 50 MB"
Browser: "Sending second piece (51-100 MB)"
Server: "Received, offset: 100 MB"
... (continues until 50 GB)
Server: "All pieces received! Upload complete!"
```text

### Key Concept: **Offset**

The **offset** is the position where the upload is:

- **Offset: 0** → 0 bytes uploaded (start)
- **Offset: 100 MB** → 100 MB uploaded (20%)
- **Offset: 50 GB** → 50 GB uploaded (100%)

When you resume an upload:

1. Server checks offset (e.g., 30 GB)
2. Browser uploads from offset (30 GB to 50 GB)
3. Only the remaining 20 GB is uploaded!

## 📦 Moving Analogy

Imagine you're moving from one house to another.

### Without TUS (One Trip)

- Load entire house into **one giant truck**
- Drive to new house
- If the truck breaks down halfway...
- **You restart from the beginning**! 😢

### With TUS (Multiple Trips)

- Load house into **100 small boxes**
- Drive each box separately
- If the truck breaks down after 60 boxes...
- ✅ You still have 60 boxes at new house
- ✅ Only 40 boxes left to move
- ✅ **You resume from box 61, not 1**! 🎉

**Result**: Instead of moving entire house again, you only move the remaining boxes.

## 🎯 Problems that TUS Solves

### Problem 1: Unstable Internet

**Without TUS**:

- Upload starts at 0%
- Internet cuts at 95%
- You restart at **0%**! 😢

**With TUS**:

- Upload starts at 0%
- Internet cuts at 95%
- You resume at **95%**! 🎉

### Problem 2: Network Timeout

**Without TUS**:

- Large file takes 2 hours to upload
- Server timeout after 1 hour
- Upload fails, restart at **0%**!

**With TUS**:

- Large file divided into small pieces
- Each piece takes 10 seconds
- Server timeout: 1 hour (3600 seconds)
- 360 pieces per hour → No timeout!
- Upload continues smoothly.

### Problem 3: Full Upload Corrupted

**Without TUS**:

- 50 GB file uploaded in one piece
- One byte corrupted during transfer
- Entire file corrupted!
- Restart from **0%**!

**With TUS**:

- 50 GB file divided into 1,000 pieces
- One piece corrupted during transfer
- Only that one piece is corrupted!
- Server detects corrupted piece
- Browser re-uploads **only that one piece**!
- All other pieces remain intact.

## 📊 TUS vs Traditional Upload

|Aspect| Traditional Upload |TUS Upload|
|---------|-------------------|-------------|
|**File Division**| One piece |Multiple pieces|
|**Resume Capability**| ❌ No |✅ Yes|
|**Upload Interruption**| Restart from 0% |Resume from where stopped|
|**Corrupted Piece**| Entire file corrupted |Only piece corrupted|
|**Network Timeout**| Fails on large files |No timeout (small pieces)|
|**Memory Usage**| Full file in RAM |Streaming (low RAM)|
|**Progress Tracking**| Difficult |Easy (offset tracking)|

### Real Example: 50 GB File

**Without TUS**:

- 50 GB uploaded in one piece
- If it cuts off at 99%...
- **You restart from 0%** (50 GB to upload again!)

**With TUS**:

- 50 GB divided into 1,000 pieces (50 MB each)
- If it cuts off at 99% (990 pieces)...
- **You resume at 99%** (only 10 pieces left to upload)
- **10 pieces × 50 MB = 500 MB**
- Instead of re-uploading 50 GB, you upload 500 MB!

**Result**: **You only re-upload 1% of the file!** 🎉

## 💡 In Your FastUpload Project

### How FastUpload Uses TUS

FastUpload implements TUS protocol in two parts:

#### 1. TUS Server (Backend)

```javascript
// server.js - The server that receives files

// CORS Configuration (from .env)
app.use(cors({
  origin: CORS_ORIGIN,  // Use CORS_ORIGIN from .env
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Upload-Offset', 'Tus-Resumable', 'Upload-Length', 'Upload-Metadata'],
  exposedHeaders: ['Upload-Offset', 'Tus-Version', 'Tus-Resumable', 'Upload-Length', 'Location'],
}));

// Server Configuration Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    maxFileSize: MAX_FILE_SIZE_GB,
    chunkSize: CHUNK_SIZE_MB,
    corsOrigin: CORS_ORIGIN,
  });
});

// TUS server configuration
const tusServer = new Server({
  path: '/upload',
  datastore: new FileStore({
    directory: UPLOAD_DIR,
  }),
  maxFileSize: MAX_FILE_SIZE,
  respectForwardedHeaders: true,

  // File renaming on upload complete
  async onUploadFinish(req, upload) {
    try {
      const originalFilename = getFilenameFromUpload(upload.id);
      const ext = getExtension(originalFilename);
      const baseName = getBaseFilename(originalFilename);

      // Create new filename: original-name-timestamp.ext
      const timestamp = Date.now();
      const newFilename = `${baseName}-${timestamp}${ext}`;

      // Rename file
      fs.renameSync(
        path.join(UPLOAD_DIR, upload.id),
        path.join(UPLOAD_DIR, newFilename)
      );

      // Rename metadata file
      const oldMetadataPath = path.join(UPLOAD_DIR, `${upload.id}.json`);
      const newMetadataPath = path.join(UPLOAD_DIR, `${newFilename}.json`);
      if (fs.existsSync(oldMetadataPath)) {
        fs.renameSync(oldMetadataPath, newMetadataPath);
      }

      console.log(`Upload completed: ${newFilename}`);
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  },
});

// Express route for TUS
app.all('/upload', (req, res) => {
  tusServer.handle(req, res);
});
```text

#### 2. TUS Client (Frontend)

```javascript
// public/index.html - The browser that uploads files

let CHUNK_SIZE = 50 * 1024 * 1024; // Default 50MB chunks

// Load server configuration
async function loadServerConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (config.chunkSize) {
      CHUNK_SIZE = config.chunkSize * 1024 * 1024; // Convert MB to bytes
    }
  } catch (error) {
    console.warn('Using default chunk size:', error);
  }
}

const upload = new tus.Upload(file, {
  endpoint: '/upload',  // TUS server endpoint
  chunkSize: CHUNK_SIZE,  // Use server-provided chunk size
  retryDelays: [0, 1000, 3000, 5000],  // Retry delays

  // Upload progress callback
  onProgress: (bytesUploaded, bytesTotal) => {
    const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
    updateProgress(uploadId, percentage);
  },

  // Upload complete callback
  onSuccess: () => {
    updateStatus(uploadId, 'completed');
  },

  // Upload error callback
  onError: (error) => {
    console.error('Upload failed:', error);
    updateStatus(uploadId, 'error', error.message);
  },
});

// Start upload
upload.start();
```text

### Metadata File

TUS creates a metadata file for each upload:

```json
{
  "id": "abc123def456",
  "metadata": {
    "filename": "large-video.mp4",
    "filetype": "video/mp4"
  },
  "size": 53687091200,  // 50 GB
  "offset": 26843545600,  // 25 GB (50% uploaded)
  "creation_date": "2026-01-25T10:00:00.000Z"
}
```text

**`offset`** indicates where upload is:

- **offset: 0** → 0 bytes (0%)
- **offset: 26843545600** → 25 GB (50%)
- **offset: 53687091200** → 50 GB (100%)

When you resume:

- Browser reads `offset` from server
- Uploads from `offset` to end
- Only remaining bytes are uploaded

## ⚙️ Configuration

### Chunk Size

**Default**: 50 MB

**Configuration**: FastUpload uses server-side configuration for chunk size. The frontend automatically loads the chunk size from the server.

**In `.env`**:

```text
CHUNK_SIZE_MB=50
```text

**How it works**:

1. Server reads `CHUNK_SIZE_MB` from `.env`
2. Server exposes configuration via `/api/config` endpoint
3. Frontend fetches config on page load
4. Frontend uses server-provided chunk size for uploads

**Trade-offs**:

|Chunk Size| Speed |Resume Capability| Network Condition |
|------------|--------|------------------|-------------------|
|**10 MB**| Slower |More resilient| Unstable/slow |
|**50 MB**| Balanced |Good| Standard broadband |
|**100 MB**| Faster |Less resilient| Fast/stable |
|**200 MB**| Very fast |Difficult to resume| Ultra-fast |

You can increase or decrease based on your server storage.

**Recommendation**: Use 50 MB for most cases. Smaller (10-25 MB) for unstable networks. Larger (100-200 MB) for very fast networks.

**Note**: To change chunk size, update `CHUNK_SIZE_MB` in `.env` and restart the server. The frontend will automatically use the new chunk size on next page load.

### Server Configuration Endpoint

FastUpload provides a `/api/config` endpoint that returns server configuration to the frontend.

**Request**:

```http
GET /api/config
```text

**Response**:

```json
{
  "maxFileSize": 50,
  "chunkSize": 50,
  "corsOrigin": "*"
}
```text

**Fields**:

- `maxFileSize`: Maximum file size in GB (from `MAX_FILE_SIZE_GB`)
- `chunkSize`: Chunk size in MB (from `CHUNK_SIZE_MB`)
- `corsOrigin`: CORS origin setting (from `CORS_ORIGIN`)

**Usage**: The frontend automatically fetches this configuration on page load and uses it for uploads.

### CORS Configuration

**Default**: `*` (allow all origins)

**In `.env`**:

```text
CORS_ORIGIN=*
```text

**Examples**:

- `*` - Allow all origins (default, public access)
- `https://yourdomain.com` - Allow specific domain only
- `http://localhost:3000` - Allow localhost only
- `https://*.yourdomain.com` - Allow subdomains

**Security**: For production, set `CORS_ORIGIN` to your specific domain to prevent unauthorized access from other websites.

### Upload Directory

**Default**: `uploads/`

Files are stored in `uploads/` directory with hash IDs and metadata files.

**Example**:

```text
uploads/
├── abc123def456              ← Partial file (25 GB)
├── abc123def456.json          ← Metadata file
├── xyz789ghi012              ← Complete file (50 GB)
└── xyz789ghi012.json          ← Metadata file
```text

## ❓ FAQ

### Q1: What happens if I close my browser?

**A**: Nothing is lost. TUS saves progress in metadata files on the server.

**How it works**:

- Browser closes at 50% upload
- Server has 50% of file saved
- Metadata file shows offset: 50%
- When you reopen browser...
- TUS reads metadata file
- Resume from 50%

### Q2: Is TUS secure?

**A**: Yes, TUS is secure when properly implemented.

**Security features**:

- ✅ HTTPS/TLS encryption (recommended)
- ✅ File integrity verification (each chunk)
- ✅ Unique upload IDs (prevents conflicts)
- ✅ Server-side validation (file type, size)
- ✅ No partial file exposure (only when complete)

**Note**: Security also depends on your server configuration (HTTPS, access control, etc.).

### Q3: Is TUS slower than traditional upload?

**A**: No, speed is almost identical. In fact, it's **faster** because:

- Less data to upload (resume capability)
- Streaming (low memory usage)
- Parallel uploads possible
- No full file upload on resume

**Overhead**: Very small (few KB per chunk for metadata).

**Example**: 50 GB file at 10 MB/s

- Traditional upload: 5000 seconds (83.3 minutes)
- TUS upload: 5000 seconds (same)
- Resume at 50%: Only 2500 seconds (41.7 minutes) to finish!

### Q4: Can I upload multiple files at the same time?

**A**: Yes! FastUpload supports parallel uploads. You can upload 5, 10, or even 20 files simultaneously, each with its own progress.

**How it works**:

- Each file gets its own TUS upload ID
- Each file has its own offset
- Each file uploads independently
- UI shows progress for each file

### Q5: What happens if the server restarts?

**A**: Uploads are not lost. Metadata files are saved on disk.

**How it works**:

- Upload at 75% when server restarts
- Server restarts
- Metadata file on disk shows offset: 75%
- Server reads metadata file on startup
- Resume from 75%

**Note**: Only uploads with data on disk can be resumed. Uploads with 0 bytes are considered failed.

### Q6: Can I resume from a different computer?

**A**: No, you must resume from the same computer with the same file.

**Why**:

- TUS tracks progress by upload ID and file checksum
- Different computer = different file path/ID
- To resume, you need:
  - Same upload ID (from server)
  - Same file (same content, same size)
  - Same TUS client configuration

**Alternative**: Copy partial file to new computer and continue upload manually.

### Q7: Can I upload files of 100 GB or 200 GB?

**A**: Yes, with proper configuration.

**Requirements**:

- Sufficient disk space on server
- `MAX_FILE_SIZE_GB` set high enough in `.env`
- `client_max_body_size` set high enough in Nginx (if using)
- Fast and stable internet connection

**Configuration**:

```bash
# .env
MAX_FILE_SIZE_GB=200  # Allow 200 GB files
```text

**Note**: Larger files take longer and have higher risk of interruption. Ensure good network stability.

### Q8: Are files corrupted if there's a network error?

**A**: No! TUS verifies each chunk. If a chunk is corrupted, it's automatically re-uploaded. At the end, the server verifies complete integrity.

**How it works**:

- Chunk uploaded → Server verifies checksum
- Checksum mismatch → Chunk corrupted
- Server rejects chunk
- Browser re-uploads chunk
- Final verification → Server combines all chunks and verifies complete file

### Q9: How does the server remember upload progress?

**A**: Thanks to the **unique upload ID**. Each upload has a serial number. The server keeps in memory: "For ID abc123, I received 450 chunks".

**Metadata file**:

```json
{
  "id": "abc123",
  "offset": 22500000000,  // 450 chunks × 50 MB
  "size": 50000000000
}
```text

When you resume:

- Browser provides upload ID: abc123
- Server reads metadata file
- Returns offset: 22500000000 (45%)
- Browser uploads from offset to end

### Q10: Is TUS complicated to use?

**A**: **No!** For the end user, it's as simple as drag-and-drop a file. TUS works in the background, automatically.

**User experience**:

- Drag and drop file
- Upload starts with progress bar
- If interrupted, resume automatically
- No manual intervention needed

**Developer experience**:

- TUS server: Easy to configure (like Express routes)
- TUS client: Simple API (upload.start(), upload.resume())
- Well-documented
- Community support

## 📝 Summary

### Key Benefits of TUS

1. ✅ **Divide** large files into small pieces
2. ✅ **Resume** interrupted uploads
3. ✅ **Save** bandwidth and time
4. ✅ **Reliable** for unstable networks
5. ✅ **Secure** with file integrity verification
6. ✅ **Memory efficient** with streaming
7. ✅ **Track** progress easily (offset)

### In FastUpload

- **Backend**: TUS server (`@tus/server` package)
- **Frontend**: TUS client (`tus-js-client` CDN)
- **Chunk size**: 50 MB (configurable)
- **Max file size**: 50 GB (configurable)
- **Resume**: Automatic
- **Progress tracking**: Real-time

### Next Steps

1. ✅ Upload a large file (>10 MB)
2. ✅ Interrupt at 50% (pause or close browser)
3. ✅ Resume upload
4. ✅ Verify it continues from 50%!

## Additional Resources

- [TUS Protocol Specification](https://tus.io/protocols/resumable-upload.html)
- [TUS GitHub Repository](https://github.com/tus/tus-node-server)
- [TUS Client Library](https://github.com/tus/tus-js-client)
- [FastUpload README](./README.md)

---

**Need help?** Check out [Troubleshooting Guide](./TROUBLESHOOTING.md) or [Resume Guide](./RESUME_GUIDE.md)
