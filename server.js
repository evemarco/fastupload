import express from 'express';
import { Server, EVENTS } from '@tus/server';
import { FileStore } from '@tus/file-store';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Enable CORS
app.use(cors());
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
});

// Add event listeners
tusServer.on(EVENTS.POST_CREATE, (event) => {
  console.log('Upload created:', event.upload.id);
});

tusServer.on(EVENTS.POST_FINISH, (event) => {
  console.log('Upload completed:', event.upload.id, 'Size:', event.upload.offset);
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

app.listen(PORT, () => {
  console.log(`\n=== FastUpload Server ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Max file size: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`);
  console.log(`TUS endpoint: http://localhost:${PORT}/upload`);
  console.log(`========================\n`);
});
