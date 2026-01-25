# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
