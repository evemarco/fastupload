import 'dotenv/config';
import express from 'express';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Enable CORS with permissive settings
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Upload-Offset', 'Tus-Resumable', 'Upload-Length', 'Upload-Metadata', 'Upload-Defer-Length', 'X-Requested-With', 'Cache-Control'],
  exposedHeaders: ['Upload-Offset', 'Tus-Version', 'Tus-Resumable', 'Upload-Length', 'Location'],
  credentials: false,
}));
app.use(express.static('public'));

// TUS Server configuration
const tusServer = new Server({
  path: '/upload',
  datastore: new FileStore({
    directory: UPLOAD_DIR,
  }),
  maxFileSize: MAX_FILE_SIZE,
  respectForwardedHeaders: true,
  allowRenaming: true,
  onUploadCreate(req, upload) {
    console.log(`Upload created: ${upload.id}`);
  },
  onUploadFinish(req, upload) {
    console.log(`Upload completed: ${upload.id}, Size: ${upload.offset} bytes`);
  },
});

// Mount TUS server
app.use('/upload', tusServer.handle.bind(tusServer));

// Endpoint to list uploads
app.get('/api/uploads', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const uploads = files.map(filename => {
    const filePath = path.join(UPLOAD_DIR, filename);
    const stats = fs.statSync(filePath);
    return {
      id: filename,
      name: filename,
      size: stats.size,
      modified: stats.mtime,
      url: `/upload/${filename}`
    };
  });
  res.json(uploads);
});

// Endpoint to get upload status
app.get('/api/uploads/:id', (req, res) => {
  const filename = req.params.id;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stats = fs.statSync(filePath);
  res.json({
    id: filename,
    name: filename,
    size: stats.size,
    modified: stats.mtime,
    isComplete: true
  });
});

// Endpoint to get upload chunks status (for resume)
app.get('/api/uploads/:id/status', (req, res) => {
  const filename = req.params.id;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Upload not found' });
  }

  const stats = fs.statSync(filePath);
  res.json({
    offset: stats.size,
    size: stats.size
  });
});

app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`\n=== FastUpload Server ===`);
  console.log(`Server running on http://${displayHost}:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Max file size: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`);
  console.log(`TUS endpoint: http://${displayHost}:${PORT}/upload`);
  
  if (HOST === '0.0.0.0') {
    console.log(`\n💡 Accessible via:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Network: http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`   - VPN: http://YOUR_VPN_IP:${PORT}`);
  }
  console.log(`========================\n`);
});
