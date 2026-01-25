# Development Guide

## Setting Up Development Environment

### 1. Install Node.js and pnpm

```bash
# Install Node.js >= 20.0.0
# Then install pnpm globally
npm install -g pnpm
```text

### 2. Install Dependencies

```bash
pnpm install
```bash

This will create a `pnpm-lock.yaml` file that should be committed to version control.

### 3. Run in Development Mode

```bash
# Start with auto-restart on file changes
pnpm run dev

# Or start normally
pnpm start
```text

## Project Structure

```text
fastupload/
├── server.js              # Main Express server with TUS protocol
├── public/
│   └── index.html         # Frontend interface
├── uploads/               # Directory for uploaded files (not committed)
├── package.json           # Project dependencies
├── pnpm-lock.yaml         # Lock file (committed)
├── .env.example           # Environment variables example
├── .gitignore             # Git ignore rules
├── README.md              # Main documentation
├── QUICKSTART.md          # Quick start guide
└── CONTRIBUTING.md        # This file
```text

## Development Workflow

### Adding Dependencies

```bash
# Add a new dependency
pnpm add <package-name>

# Add a dev dependency
pnpm add -D <package-name>

# Update a specific package
pnpm update <package-name>

# Update all packages
pnpm update
```text

### Updating Dependencies

Check for outdated packages:

```bash
pnpm outdated
```text

Update to latest versions:

```bash
# Update all dependencies to latest
pnpm update

# Update specific package
pnpm update express
```text

### Running Tests

```bash
# Run tests (when implemented)
pnpm test
```bash

### Code Style

- Use ES modules (`import`/`export`)
- Follow Node.js best practices
- Use async/await for asynchronous operations
- Add comments for complex logic

## Making Changes

### Modifying the Backend

1. Edit `server.js`
2. Changes are automatically detected in dev mode (`pnpm run dev`)
3. Test your changes by uploading files
4. Check browser console and server logs for errors

### Modifying the Frontend

1. Edit `public/index.html`
2. Refresh the browser to see changes
3. Test upload functionality
4. Check browser console for JavaScript errors

### Adding New Features

1. Consider impact on existing functionality
2. Update documentation (README.md, QUICKSTART.md)
3. Test thoroughly before committing
4. Follow existing code patterns

## Troubleshooting

### Module Import Errors

If you see `require is not defined`:

- Ensure `package.json` has `"type": "module"`
- Convert `require()` statements to `import` statements

### pnpm Install Fails

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```bash

### Server Won't Start

1. Check if port 3000 is already in use
2. Use a different port: `PORT=3001 pnpm start`
3. Check Node.js version: `node --version` (must be >= 20.0.0)

### Upload Issues

1. Check `uploads/` directory exists and is writable
2. Review server console logs
3. Check browser console for JavaScript errors
4. Verify browser supports File API

## Release Process

### Version Bump

1. Update version in `package.json`
2. Update CHANGELOG.md (if exists)
3. Commit changes

### Publish (if needed)

```bash
# For npm packages only
pnpm publish
```text

## Best Practices

1. **Use pnpm**: Always use pnpm, never npm or yarn
2. **Commit lock file**: Always commit `pnpm-lock.yaml`
3. **Update docs**: Keep README.md and QUICKSTART.md up to date
4. **Test thoroughly**: Test all changes before committing
5. **Follow patterns**: Maintain consistency with existing code
6. **Check versions**: Use latest stable versions of dependencies

## Resources

- [pnpm Documentation](https://pnpm.io)
- [Express Documentation](https://expressjs.com)
- [TUS Protocol](https://tus.io)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)

## Questions?

For issues or questions:

- Check [README.md](./README.md) for common problems
- Review browser console for client-side errors
- Check server logs for backend errors
- Open an issue in the repository
