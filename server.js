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

// Clean up empty files and orphaned metadata on startup
function cleanupUploads() {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const deleted = [];
    
    files.forEach(filename => {
      try {
        const filePath = path.join(UPLOAD_DIR, filename);
        const stats = fs.statSync(filePath);
        
        // Delete empty files
        if (stats.isFile() && stats.size === 0 && !filename.endsWith('.json')) {
          fs.unlinkSync(filePath);
          deleted.push(filename);
          
          // Also delete corresponding metadata file
          const metadataPath = path.join(UPLOAD_DIR, `${filename}.json`);
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
            deleted.push(`${filename}.json`);
          }
        }
        
        // Delete orphaned metadata files (no corresponding file)
        if (filename.endsWith('.json')) {
          const baseFilename = filename.replace('.json', '');
          const baseFilePath = path.join(UPLOAD_DIR, baseFilename);
          if (!fs.existsSync(baseFilePath)) {
            fs.unlinkSync(filePath);
            deleted.push(filename);
          }
        }
      } catch (error) {
        // Skip files that cause errors during cleanup
        console.error(`Skipping ${filename} during cleanup:`, error.message);
      }
    });
    
    if (deleted.length > 0) {
      console.log(`Cleaned up ${deleted.length} files: ${deleted.slice(0, 5).join(', ')}${deleted.length > 5 ? '...' : ''}`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// Run cleanup on startup
cleanupUploads();

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

// Helper function to get filename from metadata
function getFilenameFromUpload(uploadId) {
  try {
    const metadataPath = path.join(UPLOAD_DIR, `${uploadId}.json`);
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return metadata.metadata?.filename || uploadId;
    }
  } catch (error) {
    console.error(`Error reading metadata for ${uploadId}:`, error.message);
  }
  return uploadId;
}

// Helper function to get file extension
function getExtension(filename) {
  return path.extname(filename);
}

// Helper function to get base filename without extension
function getBaseFilename(filename) {
  return path.basename(filename, path.extname(filename));
}

// TUS Server configuration
const tusServer = new Server({
  path: '/upload',
  datastore: new FileStore({
    directory: UPLOAD_DIR,
  }),
  maxFileSize: MAX_FILE_SIZE,
  respectForwardedHeaders: true,
  async onUploadFinish(req, upload) {
    try {
      const originalFilename = getFilenameFromUpload(upload.id);
      const ext = getExtension(originalFilename);
      const baseName = getBaseFilename(originalFilename);
      
      // Create new filename: original-name-timestamp.ext
      const timestamp = Date.now();
      const newFilename = `${baseName}-${timestamp}${ext}`;
      
      const oldPath = path.join(UPLOAD_DIR, upload.id);
      const newPath = path.join(UPLOAD_DIR, newFilename);
      
      // Rename the file
      fs.renameSync(oldPath, newPath);
      
      // Also rename the metadata file
      const oldMetadataPath = path.join(UPLOAD_DIR, `${upload.id}.json`);
      const newMetadataPath = path.join(UPLOAD_DIR, `${newFilename}.json`);
      
      if (fs.existsSync(oldMetadataPath)) {
        fs.renameSync(oldMetadataPath, newMetadataPath);
      }
      
      console.log(`Upload completed: ${newFilename} (original: ${originalFilename}), Size: ${upload.offset} bytes`);
    } catch (error) {
      console.error(`Error renaming file ${upload.id}:`, error.message);
      // Don't throw error to avoid breaking the upload
    }
  },
});

// Mount TUS server
app.use('/upload', tusServer.handle.bind(tusServer));

// Endpoint to list uploads
app.get('/api/uploads', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  const uploads = files
    .filter(filename => !filename.endsWith('.json')) // Exclude metadata files
    .filter(filename => filename.length > 0) // Exclude empty files
    .map(filename => {
      const filePath = path.join(UPLOAD_DIR, filename);
      const stats = fs.statSync(filePath);
      
      // Try to get original filename from metadata
      let originalName = filename;
      try {
        const metadataPath = path.join(UPLOAD_DIR, `${filename}.json`);
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          originalName = metadata.metadata?.filename || filename;
        }
      } catch (error) {
        // If metadata read fails, use filename
      }
      
      return {
        id: filename,
        name: originalName,
        size: stats.size,
        modified: stats.mtime,
        url: `/upload/${filename}`
      };
    })
    .filter(upload => upload.size > 0); // Exclude empty files
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
