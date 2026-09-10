# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Folder uploads: drag & drop entire directories or use the "Choose Folder" picker (`webkitdirectory`)
- Server-side directory structure recreation from `relativepath` TUS metadata, sanitized against path traversal (`..`, absolute paths, drive letters)
- Upload queue with `MAX_PARALLEL_UPLOADS` concurrency limit (default 4, via `/api/config`)
- Directory-grouped UI for large batches (one collapsible card per folder), materialized lazily — scales to 1000+ files
- Batch controls: Pause All, Resume All, Cancel All, Clear Completed
- Global batch progress with aggregate speed and ETA
- `MAX_PARALLEL_UPLOADS` environment variable

### Changed

- `/api/uploads` and startup cleanup now walk subdirectories recursively; cleanup removes emptied directories
- DOM updates throttled via requestAnimationFrame scheduler with background-tab fallback
- Upload cards redesigned to a compact 2–3 line layout (status badge, filename, inline actions on one row; progress bar, size, speed and ETA on the next) — ~60% less vertical space per file
- Removed the per-card "Upload More" button on completed uploads; the drop zone is the single entry point for new uploads
- File/folder names HTML-escaped in the UI (XSS hardening)

### Dependencies

- `@tus/server` 2.3.0 → 2.4.5, `@tus/file-store` 2.0.0 → 2.1.1
- `eslint` 9 → 10, `@eslint/js` 10, `globals` 17.12, `htmlhint` 1.9.2, `dotenv` 17.4.2, `markdownlint-cli` 0.49.1, `only-allow` 1.2.2

## [1.0.0] - 2026-01-25

### Added

- Initial release of FastUpload
- Chunked file upload support (50MB chunks by default)
- Resume capability for interrupted uploads
- Real-time progress tracking (percentage, speed, ETA)
- Multi-file parallel upload support
- Web interface with drag & drop
- TUS protocol implementation (server and client)
- Memory-efficient streaming (no full file in RAM)
- Support for files up to 50GB

### Dependencies

- `express@5.2.1` - Latest stable Express web framework
- `@tus/server@2.3.0` - Latest TUS server implementation
- `@tus/file-store@2.0.0` - Latest file storage with chunking
- `cors@2.8.6` - Cross-origin support
- `tus-js-client@3.1.3` (CDN) - Latest client-side TUS library
- `pnpm@10.28.0` - Fast, disk-space efficient package manager

### Package Management

- Migrated from npm to pnpm
- Added `preinstall` hook to enforce pnpm usage
- Using ES modules (`type: "module"` in package.json)
- All packages are at latest stable versions as of January 2026

### Documentation

- README.md - Comprehensive documentation
- QUICKSTART.md - Quick start guide
- CONTRIBUTING.md - Development guide
- .env.example - Environment configuration example

---

## Version Format

Given a version number MAJOR.MINOR.PATCH, increment the:

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

---

## Categories

### Added

New features and functionality

### Changed

Changes to existing functionality

### Deprecated

Features that will be removed in future releases

### Removed

Features removed in this version

### Fixed

Bug fixes

### Security

Security-related changes
