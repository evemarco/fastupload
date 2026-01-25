# Generate Access Key

## Quick Start

Generate a new secure access key and update `.env` file automatically:

```bash
# Using npm script (recommended)
pnpm generate-key

# Or run script directly
node scripts/generate-key.js
```text

## What It Does

1. ✅ Generates a **cryptographically secure** random key
2. ✅ Updates your `.env` file automatically
3. ✅ Displays the new key for your reference
4. ✅ Shows previous key (if any)
5. ✅ Provides security tips

## Key Details

- **Length**: 32 hex characters (16 bytes)
- **Security**: `crypto.randomBytes()` (Node.js)
- **Entropy**: 128-bit (2¹²⁸ combinations)
- **Type**: Hexadecimal (0-9, a-f)
- **Format**: Clean, URL-safe

## Example Output

```text
🔐 FastUpload Access Key Generator

=====================================

Generated key (32 characters):
   a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

🔄 Updating existing ACCESS_KEY:
   Old: old-key-123
   New: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

✅ Updated /path/to/.env

⚠️  Security Notes:
   • This key is generated using crypto.randomBytes()
   • It is cryptographically secure
   • Do not commit .env file to version control
   • Restart of server to apply new key
   • Share this key only with authorized users

✅ Done! Restart of server with: pnpm start
```bash

## Next Steps

After generating a new key:

1. **Restart server**:

   ```bash
   pnpm start
   ```

1. **Test authentication**:

   ```bash
   # Via URL
   http://localhost:3003/?key=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

   # Via login form
   http://localhost:3003
   # → Enter the key
   ```

2. **Share with users** (if needed):

   ```
   Access Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
   URL: http://your-server:3003/?key=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
   ```

## Best Practices

### 1. Initial Setup

```bash
# First time setup
pnpm install
pnpm generate-key
pnpm start
```text

### 2. Key Rotation

```bash
# Generate new key periodically (recommended every 3-6 months)
pnpm generate-key
pnpm start

# Share new key with users
# Discard old key
```text

### 3. After Security Breach

```bash
# If key is compromised, regenerate immediately
pnpm generate-key
pnpm start

# Notify all users of new key
# Assume all data is compromised
```text

## Security

### ✅ What This Script Does

- Uses Node.js `crypto.randomBytes()` (cryptographically secure)
- Generates 128-bit entropy (2¹²⁸ combinations)
- No patterns, no predictability
- Probability of collision: 2⁻¹²⁸ (practically zero)
- Time to brute force (1000 attempts/sec): ~1 billion years

### ⚠️  What YOU Must Do

- **Never** commit `.env` to version control
- **Always** store keys in a password manager
- **Always** share keys via encrypted channels
- **Always** restart server after key change
- **Never** share keys in plain text (email, chat)
- **Always** rotate keys periodically

## Troubleshooting

### Problem: Script fails

```bash
# Solution 1: Make sure you're in project directory
cd /path/to/fastupload
pnpm generate-key

# Solution 2: Check .env file exists
ls .env
# If not exists, create it:
touch .env

# Solution 3: Check permissions
chmod +x scripts/generate-key.js
pnpm generate-key
```text

### Problem: Key not applied

```bash
# Restart server to apply new key
pnpm start
```text

### Problem: Multiple ACCESS_KEY lines

```bash
# Edit .env manually and remove duplicates
nano .env

# Should have only one:
ACCESS_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```text

## Advanced Usage

### Custom Key Length

Edit `KEY_LENGTH` in `scripts/generate-key.js`:

```javascript
// scripts/generate-key.js
const KEY_LENGTH = 64; // 64 characters (more secure)

// Regenerate
pnpm generate-key
```text

### Multiple Environments

Generate different keys for different environments:

```bash
# Development
cd /path/to/dev
pnpm generate-key

# Production
cd /path/to/prod
pnpm generate-key
```text

## Resources

- [Authentication Guide](./AUTHENTICATION.md) - Complete authentication documentation
- [scripts/README.md](./scripts/README.md) - Detailed scripts documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Troubleshooting common issues

## Summary

✅ **Generate**: `pnpm generate-key`
✅ **Secure**: Cryptographically random 32-char keys
✅ **Automatic**: Updates `.env` file
✅ **Safe**: No manual editing required
✅ **Easy**: One command

---

**Need more details?** See [scripts/README.md](./scripts/README.md)
