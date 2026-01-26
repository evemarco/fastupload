# AGENTS.md

This guide helps AI agents work effectively in the FastUpload codebase.

## Project Overview

FastUpload is a Node.js/Express web server that implements the TUS resumable upload protocol for handling large file uploads (up to 50GB). It provides a drag-and-drop web interface and supports chunked uploads with resume capability.

**Technology Stack:**

- Backend: Node.js (>=20.0.0) + Express 5.2.1
- Upload Protocol: @tus/server 2.3.0 with @tus/file-store 2.0.0
- Frontend: Vanilla JavaScript + tus-js-client 3.1.3
- Package Manager: pnpm (strictly enforced)

## Essential Commands

### Running the Server

```bash
pnpm start              # Start production server (port 3000 by default)
pnpm run dev           # Start with auto-restart on file changes
PORT=8080 pnpm start  # Use custom port
HOST=10.8.0.1 pnpm start  # Use custom host (useful for VPN)
```

### Development

```bash
pnpm install           # Install dependencies (creates pnpm-lock.yaml)
pnpm add <package>    # Add new dependency
pnpm add -D <package> # Add dev dependency
```

### Code Quality

```bash
pnpm run lint         # Run ESLint on server.js and scripts
pnpm run lint:fix     # Auto-fix linting issues
pnpm run lint:html    # Lint HTML files with HTMLHint
pnpm run lint:md      # Lint Markdown files with markdownlint
```

### Access Key Management

```bash
pnpm run generate-key  # Generate new secure ACCESS_KEY and update .env
```

**Important**: Server must be restarted after changing environment variables.

## Code Organization

### Main Files

- `server.js` - Express server with TUS protocol implementation
- `public/index.html` - Single-page frontend interface
- `scripts/generate-key.js` - Secure access key generator
- `.env.example` - Environment variable template

### Directory Structure

```
fastupload/
├── server.js              # Main application (552 lines)
├── public/
│   └── index.html         # Frontend (672 lines, vanilla JS)
├── scripts/
│   ├── README.md          # Scripts documentation
│   ├── generate-key.js    # Access key generator
│   ├── fix-md-blocks.js  # Markdown fixer
│   └── fix-tables.js     # Markdown table fixer
├── uploads/              # Uploaded files (auto-created, not in git)
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml        # Lock file (committed to git)
├── .env.example          # Environment template
└── [Documentation files]  # *.md files
```

### Upload Storage

Files are stored in `uploads/` with naming format: `original-name-timestamp.extension`

Example: `my-document-1706159234567.pdf`

Each file has a corresponding metadata file: `my-document-1706159234567.pdf.json`

## Code Conventions

### JavaScript/Node.js

- **Module System**: ES modules only (`import`/`export`)
- **Async/Await**: Use async/await for all async operations
- **Error Handling**: Try-catch blocks with console.error logging
- **Functions**: Arrow functions or regular functions as appropriate
- **Constants**: UPPER_SNAKE_CASE for constants at top of file

### File Pattern Example

```javascript
import 'dotenv/config';  // Must be first import
import express from 'express';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

function helperFunction(param) {
  // Function logic
}

app.get('/endpoint', (req, res) => {
  try {
    // Handler logic
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

### Frontend (HTML/JS)

- Inline JavaScript in `<script>` tags (no build process)
- Vanilla ES6+ JavaScript
- Event-driven architecture (addEventListener)
- Client-side tus-js-client for uploads

### Linting Rules

- **ESLint**: 2-space indentation, single quotes, semicolons required
- **HTMLHint**: Configured in `.htmlhintrc` (relaxed rules)
- **markdownlint**: Configured in `.markdownlintrc` (allows long lines, consistent code blocks)

## Configuration

### Environment Variables

All configuration via `.env` file in project root:

```bash
HOST=0.0.0.0              # Server host (all interfaces default)
PORT=3000                  # Server port
MAX_FILE_SIZE_GB=50         # Max upload size in GB
UPLOAD_DIR=./uploads         # Upload directory path
CORS_ORIGIN=*              # CORS origin setting
CHUNK_SIZE_MB=50           # Chunk size in MB
ACCESS_KEY=               # Optional: access key for authentication
```

**Note**: `.env` is gitignored. Use `.env.example` as template.

### Key Configuration Points

- **Chunk Size**: Set in both server (via env) and client (via `/api/config`)
- **Max File Size**: Server-side limit, enforced by TUS protocol
- **Host**: Use `0.0.0.0` for VPN/network access, `127.0.0.1` for local only

## Testing

### Current State

No automated tests exist in this codebase.

### Manual Testing Approach

1. Start server: `pnpm start`
2. Open browser to `http://localhost:3000`
3. Test file upload with various sizes
4. Test resume functionality (pause, reload, resume)
5. Test partial upload detection

### What to Test When Making Changes

- Server starts without errors
- Upload creation works (POST /upload)
- Chunk upload works (PATCH /upload/:id)
- Upload status checking works (HEAD /upload/:id)
- File naming works correctly (original-name-timestamp.ext)
- Cleanup removes empty files and orphaned metadata
- Authentication works (if ACCESS_KEY is set)

## Important Gotchas

### Package Manager

- **Must use pnpm**: npm/yarn are blocked by preinstall hook
- **pnpm-lock.yaml IS committed**: Unlike npm/yarn lockfiles
- **Never commit .env**: Contains secrets and local config

### TUS Protocol Implementation

- **Event Handler Signature**: Use `onUploadFinish(req, upload)` NOT `tusServer.on(EVENTS.POST_CREATE, event)`
- **FileStore Options**: `directory: UPLOAD_DIR` and `maxFileSize` are critical
- **respectForwardedHeaders**: Must be `true` for reverse proxy support

### Authentication

- **Session-based**: Uses in-memory Map for sessions (lost on restart)
- **Cookie**: `fastupload_session` cookie with 1-year expiration
- **Query Parameter**: `?key=ACCESS_KEY` for direct URL access
- **Public Access**: If `ACCESS_KEY` is empty, no authentication required

### File Storage

- **Renaming on Complete**: Files renamed from hash IDs to human-readable names on upload finish
- **Cleanup on Startup**: Empty files and orphaned .json files are auto-deleted
- **Metadata Files**: Each file has `.json` metadata with original filename
- **Partial Uploads**: Incomplete uploads remain until manually deleted or resumed

### Linting

- **TypeScript Hints**: Ignore TypeScript diagnostics about missing type definitions
- **Unused Parameters**: Several `req` parameters in event handlers are unused - this is acceptable
- **Autofix Safe**: `pnpm run lint:fix` is generally safe to run

### Frontend

- **No Build Process**: Direct HTML/JS editing, refresh browser to see changes
- **CDN Dependency**: Uses `https://cdn.jsdelivr.net/npm/tus-js-client@3.1.3/dist/tus.min.js`
- **Chunk Size Sync**: Client loads chunk size from `/api/config` endpoint

### Development Workflow

- **Watch Mode**: `pnpm run dev` auto-restarts on file changes
- **No Hot Reload**: Must refresh browser manually after HTML changes
- **Logging**: Console logs only (no file logging by default)

## Common Tasks

### Adding a New Endpoint

1. Add route in `server.js` after authentication middleware
2. Use Express routing: `app.get('/api/new', handler)`
3. Ensure proper error handling (try-catch)
4. Update documentation if public API

### Modifying Upload Behavior

1. **Chunk Size**: Update `CHUNK_SIZE_MB` in `.env`
2. **Max File Size**: Update `MAX_FILE_SIZE_GB` in `.env`
3. **Storage Location**: Update `UPLOAD_DIR` in `.env`
4. **File Naming**: Modify `onUploadFinish` handler in `server.js` (lines 351-381)

### Adding Authentication

Access control is already implemented. To use:

1. Generate key: `pnpm run generate-key`
2. Restart server: `pnpm start`
3. Access via login page at `/login` or URL `/?key=YOUR_KEY`

### Debugging Upload Issues

1. Check server logs for error messages
2. Check browser console for JavaScript errors
3. Check browser Network tab for TUS requests
4. Verify TUS endpoint responds: `curl -I http://localhost:3000/upload`

### Updating Documentation

- Main documentation in `README.md`
- Quick reference in `QUICKSTART.md`
- Troubleshooting in `TROUBLESHOOTING.md`
- Development guide in `CONTRIBUTING.md`
- Run `pnpm run lint:md` to fix formatting

## Security Considerations

### Current Security Status

- ⚠️ No file type validation (accepts all file types)
- ⚠️ No virus scanning
- ⚠️ No rate limiting
- ⚠️ No file size limits per user
- ⚠️ Sessions in-memory (lost on restart)
- ✅ Access key authentication (optional)
- ✅ CORS configurable
- ✅ HTTPS ready (requires SSL termination at reverse proxy)

### Production Recommendations

1. Set `ACCESS_KEY` in `.env`
2. Use HTTPS (via nginx reverse proxy)
3. Add file type validation in `onUploadCreate`
4. Add rate limiting middleware
5. Implement user authentication (database-backed)
6. Add virus scanning for uploads
7. Use process manager (PM2, systemd)
8. Monitor disk usage
9. Set up log rotation
10. Regularly rotate access keys

## LSP Diagnostics Notes

You may see TypeScript hints about missing type declarations for:

- `cors` module
- `cookie-parser` module
- Unused `req` parameters in event handlers

These are expected and can be ignored. The codebase uses JavaScript, not TypeScript.

## Files to Ignore

### Git-Ignored

- `uploads/` - User uploaded files
- `.env` - Local configuration
- `node_modules/` - Dependencies
- `*.log` files - Log files
- `logs/` - Log directory

### ESLint-Ignored

- `public/tus.min.js` - CDN-provided minified JS
- `dist/`, `build/` - Build directories

### When Editing

Always read the full file first to understand context, especially:

- `server.js` - Complex authentication and TUS logic
- `public/index.html` - Mixed HTML/CSS/JS in one file

## Resources for Understanding

### Core Documentation

- README.md - Complete feature overview and usage
- TUS_GUIDE.md - TUS protocol details
- RESUME_GUIDE.md - Resume capability explanation
- AUTHENTICATION.md - Authentication system
- FILE_NAMING.md - File storage patterns
- TROUBLESHOOTING.md - Common issues and solutions

### External References

- [TUS Protocol](https://tus.io) - Resumable upload standard
- [tus-js-client](https://github.com/tus/tus-js-client) - Client library
- [Express](https://expressjs.com) - Web framework
- [pnpm](https://pnpm.io) - Package manager

## Quick Reference

### Start Development

```bash
pnpm install && pnpm run dev
```

### Fix All Linting

```bash
pnpm run lint:fix && pnpm run lint:html && pnpm run lint:md
```

### Test Server

```bash
# Start server
pnpm start

# Test endpoint in another terminal
curl http://localhost:3000/api/config
```

### Generate New Access Key

```bash
pnpm run generate-key && pnpm start
```

### Clean Uploads Directory

```bash
# List uploads
ls -lh uploads/

# Remove specific file
rm uploads/filename.ext

# Remove all
rm -rf uploads/*
```

## Conclusion

This codebase is straightforward but has specific requirements around:

- Package manager (pnpm only)
- TUS protocol implementation details
- File naming and storage patterns
- Authentication flow
- No automated testing

When making changes, always:

1. Test locally with `pnpm run dev`
2. Run linting: `pnpm run lint`
3. Verify uploads work with files of various sizes
4. Update relevant documentation
5. Consider security implications of changes
