import 'dotenv/config';
import express from 'express';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

// Configuration from .env
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE_GB = parseInt(process.env.MAX_FILE_SIZE_GB || '50');
const MAX_FILE_SIZE = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;
const ACCESS_KEY = process.env.ACCESS_KEY || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const CHUNK_SIZE_MB = parseInt(process.env.CHUNK_SIZE_MB || '50');
const MAX_PARALLEL_UPLOADS = parseInt(process.env.MAX_PARALLEL_UPLOADS || '4');
const ADD_TIMESTAMP_TO_FILENAME = process.env.ADD_TIMESTAMP_TO_FILENAME !== 'false';

// Clean up empty files and orphaned metadata on startup (recursive)
function cleanupUploads(dir = UPLOAD_DIR, deleted = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const filePath = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          cleanupUploads(filePath, deleted);
          // Remove directory if it became empty after cleanup
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath);
            deleted.push(`${path.relative(UPLOAD_DIR, filePath)}/`);
          }
          return;
        }

        const filename = entry.name;
        const stats = fs.statSync(filePath);
        const relativeName = path.relative(UPLOAD_DIR, filePath);

        // Delete empty files
        if (stats.size === 0 && !filename.endsWith('.json')) {
          fs.unlinkSync(filePath);
          deleted.push(relativeName);

          // Also delete corresponding metadata file
          const metadataPath = `${filePath}.json`;
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
            deleted.push(`${relativeName}.json`);
          }
        }

        // Delete orphaned metadata files (no corresponding file)
        if (filename.endsWith('.json')) {
          const baseFilePath = filePath.replace(/\.json$/, '');
          if (!fs.existsSync(baseFilePath)) {
            fs.unlinkSync(filePath);
            deleted.push(relativeName);
          }
        }
      } catch (error) {
        // Skip files that cause errors during cleanup
        console.error(`Skipping ${entry.name} during cleanup:`, error.message);
      }
    });

    if (dir === UPLOAD_DIR && deleted.length > 0) {
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
  origin: CORS_ORIGIN, // Use CORS_ORIGIN from .env
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Upload-Offset', 'Tus-Resumable', 'Upload-Length', 'Upload-Metadata', 'Upload-Defer-Length', 'X-Requested-With', 'Cache-Control'],
  exposedHeaders: ['Upload-Offset', 'Tus-Version', 'Tus-Resumable', 'Upload-Length', 'Location'],
  credentials: false,
}));

// Authentication middleware
const sessionStore = new Map(); // Store session keys in memory

function isAuthenticated(req) {
  // If no access key is set, allow all access
  if (!ACCESS_KEY) {
    return true;
  }

  // Check for cookie
  const sessionCookie = req.cookies?.fastupload_session;
  if (sessionCookie && sessionStore.has(sessionCookie)) {
    return sessionStore.get(sessionCookie) === ACCESS_KEY;
  }

  // Check for query parameter
  const key = req.query.key;
  if (key && key === ACCESS_KEY) {
    return true;
  }

  return false;
}

function generateSessionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Parse cookies before authentication middleware
app.use(cookieParser());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication check middleware
app.use((req, res, next) => {
  // Skip authentication check for login page
  if (req.path === '/login' || (req.path === '/api/login' && req.method === 'POST')) {
    return next();
  }

  // If no access key is configured, allow all requests
  if (!ACCESS_KEY) {
    return next();
  }

  // Check if user is authenticated
  if (isAuthenticated(req)) {
    // If authenticated via query parameter, set cookie for future requests
    const key = req.query.key;
    if (key && key === ACCESS_KEY) {
      const sessionKey = generateSessionKey();
      sessionStore.set(sessionKey, key);
      res.cookie('fastupload_session', sessionKey, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });
    }
    return next();
  }

  // User is not authenticated
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access key required' });
  }

  // Redirect to login page for web requests
  return res.redirect('/login');
});

app.use(express.static('public'));

// Login routes
app.get('/login', (req, res) => {
  // If already authenticated, redirect to home
  if (isAuthenticated(req)) {
    return res.redirect('/');
  }

  // Show login page
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - FastUpload</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 20px;
    }
    .login-container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    input[type="password"] {
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      padding: 14px 20px;
      border: none;
      border-radius: 6px;
      background: #667eea;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #5568d3;
    }
    .error {
      background: #ffebee;
      color: #d32f2f;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .info {
      background: #e3f2fd;
      color: #1976d2;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🔐 Login</h1>
    <p class="subtitle">Enter access key to continue</p>

    ${req.query.error ? '<div class="error">' + req.query.error + '</div>' : ''}

    <form method="POST" action="/api/login">
      <div class="form-group">
        <label for="key">Access Key</label>
        <input
          type="password"
          id="key"
          name="key"
          placeholder="Enter your access key"
          required
          autofocus
        >
      </div>
      <button type="submit" class="btn">Login</button>
    </form>

    <div class="info" style="margin-top: 20px;">
      <strong>💡 Tip:</strong> Access key can be set via URL parameter:<br>
      <code>?key=YOUR_ACCESS_KEY</code>
    </div>
  </div>
</body>
</html>
  `);
});

app.post('/api/login', (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.redirect('/login?error=Access+key+is+required');
  }

  if (key !== ACCESS_KEY) {
    return res.redirect('/login?error=Invalid+access+key');
  }

  // Generate session key
  const sessionKey = generateSessionKey();
  sessionStore.set(sessionKey, key);

  // Set cookie and redirect
  res.cookie('fastupload_session', sessionKey, {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  });

  res.redirect('/');
});

// Helper function to get metadata (filename + relative path) from upload
function getMetadataFromUpload(uploadId) {
  try {
    const metadataPath = path.join(UPLOAD_DIR, `${uploadId}.json`);
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return {
        filename: metadata.metadata?.filename || uploadId,
        relativePath: sanitizeRelativePath(metadata.metadata?.relativepath || ''),
      };
    }
  } catch (error) {
    console.error(`Error reading metadata for ${uploadId}:`, error.message);
  }
  return { filename: uploadId, relativePath: '' };
}

// Sanitize a client-provided relative path:
// - normalize separators
// - drop empty segments, '.', '..' (prevents path traversal / escape from UPLOAD_DIR)
// - drop leading root/drive markers
function sanitizeRelativePath(relPath) {
  if (!relPath || typeof relPath !== 'string') {
    return '';
  }
  const parts = relPath
    .split(/[\\/]+/)
    .filter(seg => seg && seg !== '.' && seg !== '..' && /^[a-zA-Z]:$/.test(seg) === false);
  return parts.join('/');
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
      const { filename: originalFilename, relativePath } = getMetadataFromUpload(upload.id);
      const ext = getExtension(originalFilename);
      const baseName = getBaseFilename(originalFilename);

      // Create new filename: original-name-timestamp.ext (if enabled)
      const timestamp = Date.now();
      const newFilename = ADD_TIMESTAMP_TO_FILENAME
        ? `${baseName}-${timestamp}${ext}`
        : `${baseName}${ext}`;

      // Recreate the client-side directory structure inside UPLOAD_DIR
      const relativeDir = path.dirname(relativePath);
      const targetDir = relativeDir === '.' ? UPLOAD_DIR : path.join(UPLOAD_DIR, relativeDir);

      // Defense in depth: targetDir must stay inside UPLOAD_DIR
      if (path.resolve(targetDir) !== UPLOAD_DIR && !path.resolve(targetDir).startsWith(UPLOAD_DIR + path.sep)) {
        console.error(`Rejected unsafe relative path "${relativePath}" for upload ${upload.id}`);
        return;
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const oldPath = path.join(UPLOAD_DIR, upload.id);
      const newPath = path.join(targetDir, newFilename);

      // Rename the file
      fs.renameSync(oldPath, newPath);

      // Also rename the metadata file
      const oldMetadataPath = path.join(UPLOAD_DIR, `${upload.id}.json`);
      const newMetadataPath = `${newPath}.json`;

      if (fs.existsSync(oldMetadataPath)) {
        fs.renameSync(oldMetadataPath, newMetadataPath);
      }

      const displayPath = path.relative(UPLOAD_DIR, newPath);
      console.log(`Upload completed: ${displayPath} (original: ${relativePath || originalFilename}), Size: ${upload.offset} bytes`);
    } catch (error) {
      console.error(`Error renaming file ${upload.id}:`, error.message);
      // Don't throw error to avoid breaking the upload
    }
  },
});

// Endpoint to delete partial uploads (must be before TUS mount)
app.delete('/upload/:id', (req, res) => {
  try {
    const uploadId = req.params.id;
    const hashFilePath = path.join(UPLOAD_DIR, uploadId);
    const jsonFilePath = path.join(UPLOAD_DIR, `${uploadId}.json`);

    let deleted = false;
    const deletedFiles = [];

    // Try to delete hash file (if still exists)
    if (fs.existsSync(hashFilePath)) {
      const stats = fs.statSync(hashFilePath);
      if (stats.isFile()) {
        fs.unlinkSync(hashFilePath);
        deletedFiles.push(`${uploadId} (hash file)`);
        deleted = true;
      }
    }

    // Try to delete JSON metadata file (if still exists)
    if (fs.existsSync(jsonFilePath)) {
      fs.unlinkSync(jsonFilePath);
      deletedFiles.push(`${uploadId}.json (metadata)`);
      deleted = true;
    }

    if (deleted) {
      console.log('Deleted partial upload files:', deletedFiles.join(', '));
      return res.status(200).json({
        success: true,
        message: 'Partial upload deleted',
        deletedFiles: deletedFiles,
      });
    } else {
      // File not found - might have been completed and renamed already
      console.log(`Partial upload ${uploadId} not found (might be completed already)`);
      return res.status(404).json({
        success: false,
        message: 'Partial upload not found (might be completed)',
      });
    }
  } catch (error) {
    console.error(`Error deleting partial upload ${req.params.id}:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Error deleting partial upload',
      error: error.message,
    });
  }
});

// Mount TUS server (DELETE endpoint must be before this)
app.use('/upload', tusServer.handle.bind(tusServer));

// Endpoint to get server configuration
app.get('/api/config', (req, res) => {
  res.json({
    maxFileSize: MAX_FILE_SIZE_GB,
    chunkSize: CHUNK_SIZE_MB,
    corsOrigin: CORS_ORIGIN,
    maxParallelUploads: MAX_PARALLEL_UPLOADS,
  });
});

// Recursively collect completed files under UPLOAD_DIR (excludes metadata and partial TUS uploads)
function listCompletedFiles(dir = UPLOAD_DIR, result = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    return result;
  }

  entries.forEach(entry => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listCompletedFiles(filePath, result);
      return;
    }

    // Exclude metadata files (.json) and TUS partial uploads (no .json metadata alongside)
    if (entry.name.endsWith('.json')) {
      return;
    }

    const relativeName = path.relative(UPLOAD_DIR, filePath);
    const metadataPath = `${filePath}.json`;
    if (!fs.existsSync(metadataPath)) {
      // No metadata: this is an in-progress TUS upload, skip it
      return;
    }

    try {
      const stats = fs.statSync(filePath);

      // Try to get original filename from metadata
      let originalName = relativeName;
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const metaName = metadata.metadata?.filename;
        const metaRelPath = sanitizeRelativePath(metadata.metadata?.relativepath || '');
        if (metaRelPath) {
          originalName = metaRelPath;
        } else if (metaName) {
          originalName = path.join(relativeName.includes(path.sep) ? path.dirname(relativeName) : '', metaName);
        }
      } catch {
        // If metadata read fails, use filename
      }

      if (stats.size > 0) {
        result.push({
          id: relativeName,
          name: originalName,
          size: stats.size,
          modified: stats.mtime,
          url: `/upload/${relativeName.split(path.sep).map(encodeURIComponent).join('/')}`,
          status: 'completed',
        });
      }
    } catch (error) {
      console.error(`Error statting ${relativeName}:`, error.message);
    }
  });

  return result;
}

// Endpoint to list completed uploads
app.get('/api/uploads', (req, res) => {
  const uploads = listCompletedFiles().sort((a, b) => a.name.localeCompare(b.name));
  res.json(uploads);
});

// Endpoint to list in-progress (partial) uploads
app.get('/api/uploads/partial', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const partialUploads = files
      .filter(filename => !filename.endsWith('.json')) // Exclude metadata files
      .filter(filename => filename.length > 0)
      .map(filename => {
        const filePath = path.join(UPLOAD_DIR, filename);
        const stats = fs.statSync(filePath);

        // Check metadata
        const metadataPath = path.join(UPLOAD_DIR, `${filename}.json`);
        let metadata = null;

        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          } catch (error) {
            console.error(`Error reading metadata for ${filename}:`, error.message);
          }
        }

        // Get original filename from metadata
        const originalName = metadata?.metadata?.filename || filename;

        // Determine total size
        const totalSize = metadata?.size || 0;

        // If offset is 0 but file has data, use file size as offset
        // This handles the case where metadata is not updated correctly
        let offset = metadata?.offset || 0;
        if (offset === 0 && stats.size > 0 && totalSize > 0) {
          offset = stats.size;
          console.log(`Correcting offset for ${filename}: ${offset} bytes (was 0)`);
        }

        // Check if file is empty (in progress) or has data (partial)
        const isInProgress = stats.size === 0;
        const isPartial = stats.size > 0 && stats.size < totalSize;

        // Only return incomplete uploads
        if (isInProgress || isPartial) {
          const progress = totalSize > 0 ? ((stats.size / totalSize) * 100).toFixed(2) : 0;

          return {
            id: filename,
            name: originalName,
            size: stats.size,
            totalSize: totalSize,
            progress: progress,
            offset: offset,
            modified: stats.mtime,
            creationDate: metadata?.creation_date || stats.mtime,
            status: isInProgress ? 'in_progress' : 'paused',
            metadata: metadata,
            hasData: stats.size > 0,
          };
        }

        return null;
      })
      .filter(upload => upload !== null); // Filter out null entries

    console.log(`Found ${partialUploads.length} partial uploads`);
    res.json(partialUploads);
  } catch (error) {
    console.error('Error listing partial uploads:', error.message);
    res.status(500).json({ error: 'Failed to list partial uploads', message: error.message });
  }
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
    isComplete: true,
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
    size: stats.size,
  });
});


app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log('\n=== FastUpload Server ===');
  console.log(`Server running on http://${displayHost}:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Max file size: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`);
  console.log(`TUS endpoint: http://${displayHost}:${PORT}/upload`);

  if (HOST === '0.0.0.0') {
    console.log('\n💡 Accessible via:');
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Network: http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`   - VPN: http://YOUR_VPN_IP:${PORT}`);
  }
  console.log('========================\n');
});
