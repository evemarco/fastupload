# Access Key Management Scripts

## Overview

This directory contains scripts to manage FastUpload access keys securely.

## Scripts

### generate-key.js

Generates a new secure random access key and updates the `.env` file automatically.

#### Usage

```bash
# Generate a new access key
node generate-key.js
```

#### What It Does

1. Generates a cryptographically secure random key (32 hex characters)
2. Reads the existing `.env` file
3. Updates the `ACCESS_KEY` variable
4. Saves the updated `.env` file
5. Displays the new key for your reference

#### Output Example

```
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
```

#### Key Format

- **Type**: Hexadecimal (0-9, a-f)
- **Length**: 32 characters (16 bytes)
- **Security**: Cryptographically secure (crypto.randomBytes)

#### Security

✅ **Secure**: Uses Node.js crypto.randomBytes()
✅ **Random**: Full 128-bit entropy (16 bytes)
✅ **Unique**: Probability of collision = 2⁻¹²⁸ (practically zero)
✅ **Safe**: No pattern, no predictability

#### Next Steps

After generating a new key:

1. **Restart the server**:
   ```bash
   pnpm start
   ```

2. **Test the authentication**:
   ```bash
   # Via URL
   http://localhost:3003/?key=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

   # Via login form
   http://localhost:3003
   # Enter: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
   ```

3. **Share with authorized users** (if needed):
   ```
   Access Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
   URL: http://your-server:3003/?key=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
   ```

## Best Practices

### 1. Key Rotation

Rotate access keys periodically for better security:

```bash
# Generate new key
node generate-key.js

# Restart server
pnpm start

# Share new key with users
# (Discard old key)
```

### 2. After Security Breach

If you suspect the key has been compromised:

```bash
# 1. Generate new key immediately
node generate-key.js

# 2. Restart server
pnpm start

# 3. Notify all users of new key
# 4. Assume all uploads during breach are compromised
```

### 3. Version Control

**Never commit .env with real access key**:

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# Or add if already committed
echo ".env" >> .git/info/exclude

# Use .env.example instead
# .env.example
ACCESS_KEY=your-key-here
```

### 4. Backup Keys

Store access keys securely (e.g., password manager):

- Use a password manager (1Password, Bitwarden, etc.)
- Store with server name and date
- Include server URL for reference
- Set expiration reminders

### 5. Team Access

For team environments:

```bash
# Generate strong key
node generate-key.js

# Create documentation for team
# - Access key (in password manager)
# - Server URL
# - Usage instructions
# - Contact for support
```

## Troubleshooting

### Problem: Script fails with "ENOENT"

**Symptoms**: Error opening .env file

**Solution**:
```bash
# Create .env file if it doesn't exist
touch .env

# Or copy from example
cp .env.example .env

# Run script again
node generate-key.js
```

### Problem: Key not applied

**Symptoms**: Server still using old key

**Solution**:
```bash
# Restart server to apply new key
pnpm start
```

### Problem: Multiple ACCESS_KEY lines

**Symptoms**: .env file has duplicate ACCESS_KEY lines

**Solution**:
```bash
# Edit .env manually
nano .env

# Remove duplicate lines, keep only one:
# ACCESS_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

### Problem: Script adds key to wrong place

**Symptoms**: Key is added in comments or wrong location

**Solution**:
```bash
# Edit .env manually
nano .env

# Ensure ACCESS_KEY is on its own line:
# Not in comments:
# ACCESS_KEY=wrong  ❌

# On its own line:
ACCESS_KEY=correct  ✅
```

## Advanced Usage

### Custom Key Length

Modify the `KEY_LENGTH` variable in `generate-key.js`:

```javascript
// generate-key.js
const KEY_LENGTH = 64; // 64 characters (more secure)

// Regenerate
node generate-key.js
```

**Trade-offs**:
- Longer keys = more entropy = more secure
- Longer keys = harder to share/type
- 32 chars (16 bytes) is recommended balance

### Custom Key Format

If you want alphanumeric (including uppercase) or special characters:

```javascript
// generate-key.js
function generateKey(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  let result = '';
  const values = new Uint32Array(length);
  crypto.randomFillSync(values);

  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }

  return result;
}
```

### Multiple Environments

Generate different keys for different environments:

```bash
# Development
NODE_ENV=development node generate-key.js

# Staging
NODE_ENV=staging node generate-key.js

# Production
NODE_ENV=production node generate-key.js
```

Or use different .env files:

```bash
# Development
cp .env.development .env
node generate-key.js

# Production
cp .env.production .env
node generate-key.js
```

## Security Considerations

### 1. Key Entropy

- **32 hex chars** (16 bytes): 2¹²⁸ combinations
- Probability of guessing: 1 in 3.4 × 10³⁸
- Time to brute force (1000 attempts/sec): ~1 billion years

### 2. Storage

**Do not store keys in**:
- ❌ Version control (Git, SVN)
- ❌ Unencrypted text files
- ❌ Chat logs (Slack, Discord)
- ❌ Emails (unencrypted)
- ❌ Screenshot notes
- ❌ Sticky notes on monitor

**Store keys in**:
- ✅ Password managers (1Password, Bitwarden)
- ✅ Encrypted USB drives
- ✅ Secure vaults (AWS KMS, HashiCorp Vault)
- ✅ Environment variables (production)

### 3. Transmission

**Share keys via**:
- ✅ Encrypted messaging (Signal, WhatsApp with E2EE)
- ✅ Encrypted email (PGP, S/MIME)
- ✅ Password manager sharing (1Password, Bitwarden)
- ✅ In-person (secure physical exchange)

**Do not share keys via**:
- ❌ Unencrypted email
- ❌ Plain text chat
- ❌ SMS
- ❌ Public URLs (unless as ?key=xxx param)

### 4. Rotation Schedule

**Recommended rotation**:
- Personal use: Every 3-6 months
- Team use: Every 1-3 months
- Public-facing: Every 1 month
- After breach: Immediately

## Examples

### Example 1: Initial Setup

```bash
# Clone repo
git clone https://github.com/your-repo/fastupload
cd fastupload

# Install dependencies
pnpm install

# Generate access key
node generate-key.js

# Start server
pnpm start
```

### Example 2: Team Onboarding

```bash
# Generate key for team
node generate-key.js

# Copy key from output
# Example: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

# Create team documentation:
# echo "Access Key: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" > team-access.txt

# Share securely with team
# (Via password manager or encrypted email)

# Restart server
pnpm start
```

### Example 3: Emergency Key Change

```bash
# Situation: Current key may be compromised

# 1. Generate new key IMMEDIATELY
node generate-key.js

# 2. Restart server
pnpm start

# 3. Notify all users
# Email/Slack message:
# "Security Alert: Access key has been changed.
#  New key: [provide via secure channel]
#  Old key is now invalid."

# 4. Monitor logs for unauthorized access attempts
# tail -f logs/fastupload.log | grep "Unauthorized"

# 5. Assume all data is compromised
# Review access logs
# Check for unauthorized uploads
```

### Example 4: Multiple Servers

```bash
# Server 1 (Production)
cd /server1/fastupload
node generate-key.js
pnpm start

# Server 2 (Development)
cd /server2/fastupload
node generate-key.js
pnpm start

# Server 3 (VPN)
cd /server3/fastupload
node generate-key.js
pnpm start

# Each server has unique key
```

## Summary

✅ **Generate**: `node generate-key.js`
✅ **Secure**: Cryptographically random 32-char keys
✅ **Automatic**: Updates .env file
✅ **Safe**: No manual editing required
✅ **Easy**: One command to generate new key

**Best Practices**:
- Rotate keys regularly
- Never commit .env
- Use password managers
- Share keys securely
- Restart server after key change

## Additional Resources

- [Authentication Guide](../AUTHENTICATION.md) - Complete authentication documentation
- [README.md](../README.md) - Main documentation
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Troubleshooting common issues

---

**Need help?** Check the [Troubleshooting Guide](../TROUBLESHOOTING.md) or [Authentication Guide](../AUTHENTICATION.md)
