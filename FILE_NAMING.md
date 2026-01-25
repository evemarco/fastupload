# File Naming and Storage

## How Files Are Stored

When you upload files to FastUpload, they are stored in the `uploads/` directory with **human-readable names** instead of hash IDs.

### File Naming Format

Files are renamed automatically when upload completes using this format:

```
original-name-timestamp.extension
```

### Example

If you upload `my-document.pdf`:

```
uploads/
├── my-document-1706159234567.pdf
└── my-document-1706159234567.pdf.json
```

### Why the Timestamp?

The timestamp (`1706159234567`) is added to:

- ✅ Prevent file overwrites if you upload multiple files with the same name
- ✅ Keep track of when the file was uploaded
- ✅ Ensure unique filenames for all uploads

## Metadata Files

Every uploaded file has a corresponding `.json` file:

```
Softbiz-Proposal-2009-1769338476465.pdf
Softbiz-Proposal-2009-1769338476465.pdf.json  ← Metadata
```

The `.json` file contains:

```json
{
  "id": "afc1e059fb8e0e42d297ced81117c5c4",
  "metadata": {
    "filename": "Softbiz-Proposal-2009.pdf",  ← Original name
    "filetype": "application/pdf"
  },
  "size": 13235541,
  "offset": 0,
  "creation_date": "2026-01-25T10:41:40.419Z"
}
```

## Automatic Cleanup

The server automatically cleans up:

- **Empty files** (failed uploads)
- **Orphaned metadata files** (`.json` files without corresponding files)

Cleanup runs on server startup.

## API Responses

### List Uploads

When you call `GET /api/uploads`, files are returned with their original names:

```json
[
  {
    "id": "Softbiz-Proposal-2009-1769338476465.pdf",
    "name": "Softbiz-Proposal-2009.pdf",
    "size": 13235541,
    "modified": "2026-01-25T10:41:40.419Z",
    "url": "/upload/Softbiz-Proposal-2009-1769338476465.pdf"
  }
]
```

- `id`: The actual filename on disk (with timestamp)
- `name`: The original filename you uploaded (for display)
- `url`: The download URL

## Troubleshooting

### Files Still Have Hash Names

If you see files with hash names (like `afc1e059fb8e0e42d297ced81117c5c4`):

1. **Restart the server** (new uploads will have proper names)
2. **For existing files**: Wait for the next server restart, or manually rename

### Duplicate Filenames

If you upload the same file twice:

```
report.pdf          →  report-1706159234000.pdf
report.pdf (again) →  report-1706159235000.pdf
```

Both files are kept with different timestamps.

### File Extension Issues

If the file extension is missing or wrong:

- The server uses the extension from the original filename
- If the browser doesn't provide it, the file might have no extension

## Storage Best Practices

### Monitor Disk Space

```bash
# Check uploads directory size
du -sh uploads/

# List files by size
du -h uploads/* | sort -h
```

### Organize Files (Optional)

If you want to organize files by date, you can modify the server to use subdirectories:

```
uploads/
├── 2026-01/
│   ├── file1.pdf
│   └── file2.pdf
├── 2026-02/
│   └── file3.pdf
```

### Clean Old Files

You can create a cron job to clean files older than X days:

```bash
# Delete files older than 30 days
find uploads/ -type f -mtime +30 -delete
```

## Security

### File Upload Validation

Currently, FastUpload accepts any file type. For production, consider adding:

- File type validation (only allow PDF, images, etc.)
- Virus scanning
- File size limits per user
- Rate limiting

### Sensitive Information

Be careful when uploading files with sensitive information:

- Use HTTPS in production
- Secure the uploads directory with proper permissions
- Consider encryption at rest
- Implement authentication

## Next Steps

- **Monitor uploads**: Check server logs for upload activity
- **Track storage**: Monitor disk usage
- **Set up alerts**: Get notified when disk space is low
- **Implement cleanup**: Clean old files regularly
