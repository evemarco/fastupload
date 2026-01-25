# Authentication Guide

## Overview

FastUpload supports optional access key authentication to protect your upload server from unauthorized access.

## How It Works

### Authentication Methods

1. **Cookie-based Authentication** (Recommended)
   - User logs in via form
   - Cookie is stored in browser
   - Subsequent requests are automatically authenticated

2. **URL Parameter Authentication**
   - Access key passed in URL: `?key=YOUR_ACCESS_KEY`
   - Automatically sets cookie for future requests

3. **No Authentication**
   - If `ACCESS_KEY` is empty in `.env`, server is public
   - No login required

### Session Management

- Sessions are stored in server memory (not persistent across restarts)
- Cookies expire after 1 year
- Session keys are randomly generated (32 bytes, hex-encoded)

## Configuration

### Enable Authentication

Edit `.env` file:

```bash
# Set your access key
ACCESS_KEY=my-secret-access-key-123
```

### Disable Authentication

Edit `.env` file:

```bash
# Leave empty or remove the line
ACCESS_KEY=
```

## Usage

### Method 1: Web Login Form

1. Open browser: `http://YOUR_HOST:PORT`
2. You're redirected to `/login` page
3. Enter your access key
4. Click "Login" button
5. You're redirected to home page
6. Cookie is set for future visits

### Method 2: URL Parameter

Add access key to URL:

```
http://YOUR_HOST:PORT?key=my-secret-access-key-123
```

**Benefits**:
- One-time URL
- Can be shared (e.g., via email)
- Automatically sets cookie
- Can bookmark authenticated URL

**Security Note**:
- URL with key is visible in browser history
- URL with key can be copied/shared
- Consider using login form for better security

### Method 3: No Authentication

If `ACCESS_KEY` is not set in `.env`:

```
# .env
ACCESS_KEY=
```

Server is accessible without authentication.

## API Authentication

### Using Cookie

1. First, login via `/api/login`:
   ```bash
   curl -X POST http://YOUR_HOST:PORT/api/login \\
     -H "Content-Type: application/json" \\
     -d '{"key":"my-secret-access-key-123"}' \\
     -c cookies.txt
   ```

2. Use cookie in subsequent requests:
   ```bash
   curl http://YOUR_HOST:PORT/api/uploads \\
     -b cookies.txt
   ```

### Using Query Parameter

```bash
curl "http://YOUR_HOST:PORT/api/uploads?key=my-secret-access-key-123"
```

### Using Header

TUS protocol supports custom headers. You can add a custom header:

```bash
curl -X POST http://YOUR_HOST:PORT/upload \\
   -H "X-Access-Key: my-secret-access-key-123" \\
   -H "Tus-Resumable: 1.0" \\
   -H "Upload-Length: 12345"
```

**Note**: This requires modifying the server to check headers.

## Security Best Practices

### 1. Use Strong Access Keys

Generate random, long keys:

```bash
# Linux/Mac
openssl rand -hex 32

# Output example:
# a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

### 2. Set Access Key via Environment Variable (Production)

Don't commit `.env` with real access key:

```bash
# Production
export ACCESS_KEY=$(openssl rand -hex 32)
pnpm start
```

### 3. Use HTTPS

If deploying to production, use HTTPS:

```javascript
// In server.js
res.cookie('fastupload_session', sessionKey, {
  httpOnly: true,
  secure: true, // Set to true for HTTPS
  sameSite: 'strict',
  maxAge: 365 * 24 * 60 * 60 * 1000
});
```

### 4. Separate Admin Interface

Consider creating a separate admin interface with its own authentication for sensitive operations.

### 5. Rotate Access Keys

Change access key periodically:

```bash
# Step 1: Generate new key
NEW_KEY=$(openssl rand -hex 32)

# Step 2: Update .env
echo "ACCESS_KEY=$NEW_KEY" > .env

# Step 3: Restart server
pnpm start
```

## Troubleshooting

### Problem: Can't Access Login Page

**Symptoms**: 404 or error when visiting `/login`

**Solution**:
1. Check server is running
2. Verify `/login` route exists in `server.js`
3. Check port and host are correct

### Problem: Login Doesn't Work

**Symptoms**: Entering access key redirects to login page with error

**Solutions**:

1. **Check access key in .env**:
   ```bash
   cat .env | grep ACCESS_KEY
   # Should show: ACCESS_KEY=my-secret-key
   ```

2. **Verify key matches exactly** (case-sensitive):
   ```
   Wrong: my-secret-key
   Correct: My-Secret-Key-123
   ```

3. **Check for extra spaces**:
   ```bash
   # Bad: ACCESS_KEY= my-key (space after =)
   # Good: ACCESS_KEY=my-key
   ```

4. **Restart server** after changing `.env`:
   ```bash
   # Stop server (Ctrl+C)
   pnpm start
   ```

### Problem: Cookie Not Persisting

**Symptoms**: Have to login every time

**Solutions**:

1. **Check browser cookie settings**:
   - Ensure cookies are enabled
   - Check if browser blocks third-party cookies
   - Incognito mode might block cookies

2. **Check cookie configuration**:
   ```javascript
   // In server.js
   res.cookie('fastupload_session', sessionKey, {
     httpOnly: true,
     secure: false, // If using HTTPS, set to true
     sameSite: 'lax',
     maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
   });
   ```

3. **Use URL parameter instead**:
   ```
   http://YOUR_HOST:PORT?key=YOUR_ACCESS_KEY
   ```

### Problem: API Returns 401 Unauthorized

**Symptoms**: API requests fail with 401 status

**Solutions**:

1. **Ensure authentication is enabled**:
   ```bash
   # Check .env
   cat .env | grep ACCESS_KEY

   # If empty, server is public (no auth needed)
   ```

2. **Check cookie is set**:
   ```javascript
   // In browser console
   document.cookie
   // Should contain: fastupload_session=...
   ```

3. **Use query parameter**:
   ```bash
   curl "http://YOUR_HOST:PORT/api/uploads?key=YOUR_ACCESS_KEY"
   ```

4. **Login first**:
   ```bash
   # Login
   curl -X POST http://YOUR_HOST:PORT/api/login \\
     -H "Content-Type: application/json" \\
     -d '{"key":"YOUR_ACCESS_KEY"}' \\
     -c cookies.txt

   # Use cookie
   curl http://YOUR_HOST:PORT/api/uploads -b cookies.txt
   ```

### Problem: Session Lost After Server Restart

**Symptoms**: Have to re-login after server restart

**Reason**: Sessions are stored in server memory, not disk.

**Solutions**:

1. **Re-login after restart** (current behavior)
2. **Use URL parameter** (bypasses session):
   ```
   http://YOUR_HOST:PORT?key=YOUR_ACCESS_KEY
   ```
3. **Implement persistent sessions** (advanced):
   - Use Redis or database for session storage
   - Configure session expiration
   - Implement session recovery

## Advanced Topics

### Custom Login Page

Create a custom login page:

```javascript
// server.js
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'My Custom Login',
    companyName: 'My Company'
  });
});
```

Then create `views/login.html` template.

### Multi-Factor Authentication

Add 2FA (optional):

```javascript
// server.js
app.post('/api/login', (req, res) => {
  const { key, totp } = req.body;

  if (key !== ACCESS_KEY) {
    return res.redirect('/login?error=Invalid+key');
  }

  if (!verifyTOTP(totp)) {
    return res.redirect('/login?error=Invalid+2FA+code');
  }

  // Create session
  // ...
});
```

### IP Whitelisting

Restrict access by IP address:

```javascript
// server.js
const ALLOWED_IPS = ['192.168.1.100', '10.8.0.1'];

app.use((req, res, next) => {
  const ip = req.ip;

  if (ALLOWED_IPS.includes(ip)) {
    return next();
  }

  res.status(403).json({ error: 'IP not allowed' });
});
```

### Rate Limiting

Limit login attempts:

```bash
# Install rate-limiting package
pnpm add express-rate-limit
```

```javascript
// server.js
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later'
});

app.post('/api/login', loginLimiter, (req, res) => {
  // ...
});
```

### Logout

Add logout functionality:

```javascript
// server.js
app.get('/logout', (req, res) => {
  res.clearCookie('fastupload_session');
  res.redirect('/login');
});
```

Add to frontend:

```javascript
// public/index.html
<button onclick="logout()">Logout</button>

function logout() {
  window.location.href = '/logout';
}
```

## Examples

### Example 1: Personal Use

```bash
# .env
ACCESS_KEY=my-secret-key-123

# Access server
# 1. Open http://localhost:3003
# 2. Enter "my-secret-key-123"
# 3. Upload files
```

### Example 2: Team Access

Generate strong key and share with team:

```bash
# Generate key
KEY=$(openssl rand -hex 32)

# Set in .env
echo "ACCESS_KEY=$KEY" > .env

# Restart server
pnpm start

# Share URL with team:
# http://team-server:3003?key=$KEY
```

### Example 3: VPN Access

```bash
# .env
HOST=10.8.0.1
PORT=3003
ACCESS_KEY=vpn-secret-key-456

# Access from VPN
# http://10.8.0.1:3003/login
```

### Example 4: Public Server

```bash
# .env
HOST=0.0.0.0
PORT=80
ACCESS_KEY=

# Public access, no authentication required
# http://myserver.com
```

## Summary

✅ **Optional authentication** - Disable if not needed
✅ **Easy setup** - One line in `.env`
✅ **Multiple methods** - Cookie, URL parameter, or none
✅ **Secure** - Strong keys, httpOnly cookies
✅ **Persistent** - Cookies expire after 1 year
✅ **Easy to use** - Simple login form

FastUpload authentication is simple yet secure! 🔐
