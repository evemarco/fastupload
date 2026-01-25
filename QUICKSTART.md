# Quick Start Guide

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** package manager

### Install pnpm (if needed)

```bash
# Using npm
npm install -g pnpm

# Or using the standalone script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Start the Server

```bash
# Start server (default: 0.0.0.0:3000)
pnpm start

# Or with auto-restart on file changes
pnpm run dev

# Use custom port
PORT=8080 pnpm start

# Use VPN IP (no reverse proxy needed!)
HOST=10.8.0.1 pnpm start

# Both custom port and host
HOST=10.8.0.1 PORT=8080 pnpm start
```

The server will show available access URLs:

**Default (HOST=0.0.0.0)**:

```
=== FastUpload Server ===
Server running on http://localhost:3000
Upload directory: /data/fastupload/uploads
Max file size: 50 GB
TUS endpoint: http://localhost:3000/upload

💡 Accessible via:
   - Local: http://localhost:3000
   - Network: http://YOUR_LOCAL_IP:3000
   - VPN: http://YOUR_VPN_IP:3000
```

**With VPN IP (HOST=10.8.0.1)**:

```
=== FastUpload Server ===
Server running on http://10.8.0.1:3000
Upload directory: /data/fastupload/uploads
Max file size: 50 GB
TUS endpoint: http://10.8.0.1:3000/upload
```

## 3. Open Your Browser

### Local Access

Navigate to `http://localhost:3000` in your browser.

### VPN Access (No Reverse Proxy Needed!)

1. Set your VPN IP as HOST: `HOST=10.8.0.1 pnpm start`
2. Access directly from VPN: `http://10.8.0.1:3000`
3. No nginx, Apache, or other reverse proxy required!

### Local Network Access

1. Default server listens on all interfaces (0.0.0.0)
2. Find your local IP: `hostname -I` or `ipconfig`
3. Access: `http://YOUR_LOCAL_IP:3000` (e.g., `http://192.168.1.100:3000`)

## 4. Upload Files

- **Drag & Drop**: Drag files onto the upload zone
- **Click to Browse**: Click the upload zone to select files

## Key Features

### Chunked Uploads

- Files are split into 50MB chunks
- Optimal for large files up to 50GB
- Memory-efficient (no full file in RAM)

### Resume Capability

- If upload is interrupted, click "Resume"
- System detects and skips completed chunks
- Works even after browser refresh

### Progress Tracking

- Real-time percentage display
- Upload speed (MB/s)
- Estimated time remaining
- Chunk-by-chunk completion status

### Multi-file Upload

- Upload multiple files simultaneously
- Each file has independent progress
- Pause/resume individual uploads

## Example Workflow

1. Select a 10GB video file
2. Upload starts immediately
3. See progress: 25% (2.5 GB / 10 GB) @ 50 MB/s, ETA: 2m 30s
4. Network disconnects at 60%
5. Upload automatically pauses
6. Reconnect and click "Resume"
7. Upload continues from 60% (skips completed chunks)
8. Upload completes successfully

## Testing Resume

1. Start a large file upload
2. Click "Pause" button
3. Refresh the browser page
4. Return to upload page
5. Click "Resume" on the paused upload
6. Upload continues from where it stopped

## Tips

- **Large files (>10GB)**: Start with smaller test files first
- **Slow connections**: Reduce `CHUNK_SIZE` in `public/index.html`
- **Multiple users**: Consider running on different ports
- **Disk space**: Monitor available space in `uploads/` directory

## Troubleshooting

### Upload fails immediately

- Check disk space
- Verify `uploads/` directory is writable
- Review server console for errors

### Slow uploads

- Check network speed
- Try smaller chunk size
- Test with smaller files first

### Resume doesn't work

- Ensure browser didn't clear localStorage
- Check server is still running
- Verify file hasn't been modified

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Configure chunk size for your network
- Set up authentication for production
- Add file type validation
- Deploy to production server

## Support

For issues or questions:

- Check the [README.md](./README.md) troubleshooting section
- Review browser console for errors
- Check server logs for error messages
