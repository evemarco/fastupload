# FastUpload - Resumable Large File Upload System

A web-based file upload system optimized for large files (up to 50GB) with chunked uploads, resume capability, and progress tracking.

## Features

✅ **Chunked Uploads** - Files are split into 50MB chunks for efficient upload  
✅ **Resume Capability** - Continue interrupted uploads from where they left off  
✅ **Progress Tracking** - Real-time progress display with speed and ETA  
✅ **Memory Efficient** - Streams files without loading into memory  
✅ **Parallel Uploads** - Upload multiple files simultaneously  
✅ **TUS Protocol** - Uses industry-standard TUS resumable upload protocol  
✅ **Web Interface** - Beautiful, drag-and-drop interface  

## Technology Stack

### Package Manager
- **pnpm** - Fast, disk space efficient package manager

### Backend
- **Node.js** (>=20.0.0) + **Express** (5.2.1) - Web server
- **@tus/server** (2.3.0) - TUS protocol server implementation
- **@tus/file-store** (2.0.0) - File storage with chunking support
- **cors** (2.8.6) - Cross-origin support

### Frontend
- **Vanilla JavaScript** - Lightweight, no framework dependencies
- **tus-js-client** (3.1.3) - Client-side TUS protocol implementation
- **Drag & Drop API** - Intuitive file selection

## Package Versions

All packages are using the latest stable versions as of January 2026:
- `express@5.2.1` - Latest stable Express release
- `@tus/server@2.3.0` - Latest TUS server
- `@tus/file-store@2.0.0` - Latest file store
- `cors@2.8.6` - Latest CORS middleware
- `tus-js-client@3.1.3` (CDN) - Latest client library

## Installation

### Prerequisites

- **Node.js** >= 20.0.0 (required for ES modules support)
- **pnpm** package manager

### Install pnpm (if not already installed)

```bash
# Using npm
npm install -g pnpm

# Or using Homebrew (macOS)
brew install pnpm

# Or using Homebrew (Linux)
brew install pnpm

# Or using the standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Install Dependencies

```bash
# Install dependencies
pnpm install
```

## Usage

### Start the Server

```bash
# Default port 3000
pnpm start

# Or with watch mode (auto-restart on file changes)
pnpm run dev

# Or specify a custom port
PORT=8080 node server.js
```

The server will start at `http://localhost:3000`

### Upload Files

1. Open your browser to `http://localhost:3000`
2. Drag and drop files onto the upload zone
3. Or click the upload zone to browse for files
4. Watch the real-time progress with:
   - Upload percentage
   - Bytes uploaded vs. total
   - Upload speed
   - Estimated time remaining
   - Chunk completion status

### Resume Interrupted Uploads

If an upload is interrupted:
1. The upload will be automatically paused
2. Click "Resume" to continue from where it stopped
3. The system will detect the already-uploaded chunks and skip them

### Upload Features

- **Pause** - Temporarily stop an upload
- **Resume** - Continue paused uploads
- **Cancel** - Cancel and remove an upload
- **Multiple Files** - Upload several files in parallel

## Configuration

### Server Configuration (server.js)

```javascript
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB
const PORT = process.env.PORT || 3000;
```

### Chunk Size (public/index.html)

```javascript
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
```

Recommended chunk sizes based on network:
- Slow/Unstable: 10-25MB
- Standard Broadband: 50MB (default)
- Fast/Stable: 100-200MB

## API Endpoints

### TUS Protocol

- `POST /upload` - Create new upload
- `PATCH /upload/:id` - Upload chunk
- `HEAD /upload/:id` - Get upload status
- `DELETE /upload/:id` - Cancel upload

### Application Endpoints

- `GET /api/uploads` - List all uploaded files
- `GET /api/uploads/:id` - Get file details
- `GET /api/uploads/:id/status` - Get upload status

## How It Works

### Upload Process

1. **File Selection** - User selects a file through drag & drop or browse
2. **Chunking** - File is split into 50MB chunks
3. **Upload Creation** - POST request creates an upload on the server
4. **Chunk Upload** - Each chunk is uploaded sequentially
5. **Progress Tracking** - Real-time updates sent via tus-js-client
6. **File Reconstruction** - Server reconstructs the original file from chunks

### Resume Process

1. **Upload Interrupted** - Network error, browser close, etc.
2. **Chunk Check** - On resume, client checks which chunks exist
3. **Skip Completed** - Already-uploaded chunks are skipped
4. **Continue** - Upload continues from the last successful chunk

### Memory Efficiency

- **Server-side** - Streams chunks directly to disk (no full file in memory)
- **Client-side** - Reads chunks from file on demand (no full file in memory)
- **File Streams** - Uses Node.js streams for efficient I/O

## File Storage

Uploaded files are stored in the `uploads/` directory:
```
uploads/
├── 1737824567890-myfile.txt    # Uploaded files
├── 1737824567891-largefile.mp4
└── ...
```

Each file is named with: `{timestamp}-{original-filename}.{extension}`

## Troubleshooting

### Upload Fails Immediately
- Check server logs for errors
- Verify `uploads/` directory is writable
- Ensure sufficient disk space

### Slow Upload Speed
- Reduce chunk size in `public/index.html`
- Check network stability
- Try smaller test files first

### Resume Not Working
- Ensure the upload ID is still available on server
- Check that the file hasn't been modified
- Server timeout may have removed partial uploads

### Browser Issues
- Use modern browser (Chrome, Firefox, Edge, Safari)
- Disable browser extensions that block uploads
- Check browser console for errors

## Security Considerations

⚠️ **Important Security Notes:**

- **File Size Limits** - Adjust `MAX_FILE_SIZE` based on your storage capacity
- **Disk Space** - Monitor disk usage, set up alerts
- **Authentication** - Add authentication before production use
- **File Validation** - Consider adding file type validation
- **Rate Limiting** - Add rate limiting to prevent abuse
- **HTTPS** - Use HTTPS in production for secure uploads

## Performance Tips

1. **Optimal Chunk Size**:
   - Smaller chunks = better resume, more overhead
   - Larger chunks = less overhead, harder to resume
   - 50MB is a good balance for most scenarios

2. **Network Considerations**:
   - Use 10-25MB chunks for slow/unstable networks
   - Use 100-200MB chunks for fast, stable networks
   - Consider network topology and latency

3. **Server Capacity**:
   - Monitor CPU and memory usage
   - Consider load balancing for production
   - Implement queue system for concurrent uploads

## Production Deployment

For production use, consider:

1. **Reverse Proxy** - Use nginx or Apache as reverse proxy
2. **Process Manager** - Use PM2 or systemd for process management
3. **Monitoring** - Set up logging and monitoring
4. **Load Balancing** - Distribute uploads across multiple servers
5. **CDN** - Consider CDN for static assets
6. **Database** - Store metadata in a database for persistence

## Example PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'fastupload',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
