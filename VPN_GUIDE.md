# VPN and Network Configuration Guide

## 🌐 Access FastUpload via VPN

This guide explains how to configure FastUpload to be accessible via your VPN without needing a reverse proxy like nginx or Apache.

---

## 🎯 Quick Setup

### Step 1: Create/Edit .env File

```bash
# Copy example to .env (if not exists)
cp .env.example .env

# Edit .env
nano .env
```text

### Step 2: Configure Your VPN IP

Edit `.env` and set your VPN IP:

```bash
# Replace 10.8.0.1 with your actual VPN IP
HOST=10.8.0.1
PORT=3000
```text

### Step 3: Start the Server

```bash
pnpm start
```text

### Step 4: Access from VPN

Open your browser and navigate to:

```text
http://YOUR_VPN_IP:3000
```text

Example:

```text
http://10.8.0.1:3000
```text

---

## 📋 Finding Your VPN IP

### Linux/Mac

```bash
# Show all IP addresses
ip addr show

# Or
ifconfig

# Look for your VPN interface (usually tun0, tap0, wg0, etc.)
# Example output:
# tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500
#         inet 10.8.0.1  netmask 255.255.255.0  destination 10.8.0.1
#                                      ↑
#                                  Your VPN IP!
```text

### Windows

```cmd
# Open Command Prompt and run:
ipconfig

# Look for your VPN adapter (e.g., "WireGuard", "OpenVPN", "TAP Adapter")
# Example output:
# Wireless LAN adapter WireGuard:
#    IPv4 Address. . . . . . . . . . . . : 10.8.0.1
#                                                 ↑
#                                          Your VPN IP!
```text

### Alternative: Check VPN Client Settings

Your VPN client (WireGuard, OpenVPN, NordVPN, etc.) should display your VPN IP in its connection details.

---

## 🔧 Configuration Options

### Option 1: Listen on All Interfaces (Default)

**Best for**: Local development, testing, multiple access methods

```bash
# .env
HOST=0.0.0.0
PORT=3000
```text

**Access URLs**:

- Local: `http://localhost:3000`
- Local Network: `http://192.168.1.100:3000` (your local IP)
- VPN: `http://10.8.0.1:3000` (your VPN IP)

**Use case**: When you want to access from anywhere (local, VPN, local network)

---

### Option 2: VPN IP Only (Recommended for VPN Access)

**Best for**: VPN-only access, production VPN setup

```bash
# .env
HOST=10.8.0.1
PORT=3000
```text

**Access URL**:

- VPN: `http://10.8.0.1:3000`

**Use case**: When you only want VPN access (more secure)

---

### Option 3: Local Network IP

**Best for**: Local network access only (home/office)

```bash
# .env
HOST=192.168.1.100
PORT=3000
```text

**Access URL**:

- Local Network: `http://192.168.1.100:3000`

**Use case**: Access from other devices on your local network

---

### Option 4: Localhost Only

**Best for**: Development, local testing

```bash
# .env
HOST=127.0.0.1
PORT=3000
```text

**Access URL**:

- Local: `http://localhost:3000`

**Use case**: Local development only (most secure)

---

## 🔒 Security Considerations

### 1. Firewall Configuration

Make sure your firewall allows the port:

```bash
# Allow port 3000 (replace with your port)
sudo ufw allow 3000

# Or with iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```text

### 2. VPN Security

- ✅ **Use VPN IP only** (Option 2) for production
- ✅ Disable when not needed
- ✅ Use strong VPN authentication
- ✅ Keep VPN software updated

### 3. HTTPS/SSL

For production, consider adding HTTPS:

**Option A: Reverse Proxy with SSL**

```nginx
server {
    listen 443 ssl;
    server_name your-vpn-ip.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://10.8.0.1:3000;
    }
}
```text

**Option B: Self-Signed Certificate with Node.js**

```javascript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(PORT, HOST, () => {
  console.log(`HTTPS server running on https://${HOST}:${PORT}`);
});
```text

---

## 🐛 Troubleshooting

### Problem: Can't Access from VPN

**Solutions**:

1. **Check VPN is connected**

   ```bash
   # Check VPN interface
   ip addr show tun0  # or wg0, tap0, etc.
   ```

1. **Verify correct VPN IP**
   - Make sure HOST matches your actual VPN IP
   - Re-check IP after VPN reconnection

2. **Check firewall**

   ```bash
   sudo ufw status
   sudo ufw allow 3000
   ```

3. **Test with ping**

   ```bash
   # Test if VPN IP is reachable
   ping 10.8.0.1
   ```

---

### Problem: Server Won't Start

**Error**: `EADDRINUSE: address already in use`

**Solutions**:

1. **Check what's using the port**

   ```bash
   # Linux/Mac
   lsof -i :3000
   netstat -tulpn | grep 3000

   # Windows
   netstat -ano | findstr :3000
   ```

2. **Kill the process**

   ```bash
   # Linux/Mac
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. **Or use a different port**

   ```bash
   # .env
   PORT=3001
   ```

---

### Problem: Browser Shows Connection Refused

**Solutions**:

1. **Check server is running**

   ```bash
   # Look for server output
   # Should see: "Server running on http://10.8.0.1:3000"
   ```

2. **Verify HOST and PORT**

   ```bash
   # Check .env file
   cat .env | grep -E "^HOST|^PORT"
   ```

3. **Try with 0.0.0.0**

   ```bash
   # .env
   HOST=0.0.0.0
   ```

4. **Test with curl**

   ```bash
   curl http://10.8.0.1:3000
   ```

---

### Problem: Uploads Not Working

**Solutions**:

1. **Check CORS settings**

   ```bash
   # .env
   CORS_ORIGIN=*
   ```

2. **Check TUS endpoint**
   - Browser console should show TUS endpoint URL
   - Verify it matches: `http://YOUR_VPN_IP:PORT/upload`

3. **Check file permissions**

   ```bash
   # Ensure uploads directory is writable
   chmod 755 uploads
   ```

---

## 📝 Example Configurations

### Development Setup

```bash
# .env
HOST=0.0.0.0
PORT=3000
```text

Access from anywhere (local, VPN, local network).

---

### Home Server

```bash
# .env
HOST=192.168.1.100
PORT=3000
```text

Access from any device on your home network.

---

### VPN Server (Production)

```bash
# .env
HOST=10.8.0.1
PORT=3000
```text

Access only via VPN (most secure).

---

### Multiple Ports for Different Users

```bash
# User 1
# .env.user1
HOST=10.8.0.1
PORT=3000

# User 2
# .env.user2
HOST=10.8.0.1
PORT=3001

# Start with specific config
pnpm start --env-file=.env.user1
```text

---

## 🎓 Advanced Topics

### Using Systemd (Linux)

Create `/etc/systemd/system/fastupload.service`:

```ini
[Unit]
Description=FastUpload Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/fastupload
Environment="HOST=10.8.0.1"
Environment="PORT=3000"
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```text

Start the service:

```bash
sudo systemctl enable fastupload
sudo systemctl start fastupload
sudo systemctl status fastupload
```text

---

### Using PM2 (Process Manager)

```bash
# Install PM2
pnpm add -D pm2

# Start server
pnpm exec pm2 start server.js --name fastupload

# View logs
pnpm exec pm2 logs fastupload

# View status
pnpm exec pm2 status

# Stop
pnpm exec pm2 stop fastupload

# Restart
pnpm exec pm2 restart fastupload

# Save PM2 configuration
pnpm exec pm2 save
pnpm exec pm2 startup
```text

---

### Monitoring Uploads

Check active uploads:

```bash
# View uploads directory
ls -lh uploads/

# Count files
ls uploads/ | wc -l

# Monitor in real-time
watch -n 1 'ls -lh uploads/'
```text

---

## ✅ Checklist

Before going live:

- [ ] VPN is connected and stable
- [ ] Correct VPN IP configured in .env
- [ ] Firewall allows the port
- [ ] Server starts without errors
- [ ] Can access from VPN
- [ ] Test file upload (small file)
- [ ] Test file upload (large file)
- [ ] Test pause/resume functionality
- [ ] Check disk space
- [ ] Consider HTTPS for production
- [ ] Set up monitoring/logging
- [ ] Document your configuration

---

## 📚 Resources

- [TUS Protocol Documentation](https://tus.io)
- [Express Documentation](https://expressjs.com)
- [Node.js Documentation](https://nodejs.org)
- [WireGuard Documentation](https://www.wireguard.com)
- [OpenVPN Documentation](https://openvpn.net)

---

## 💡 Summary

**FastUpload + VPN = Easy Access, No Reverse Proxy Needed!**

1. Find your VPN IP
2. Set HOST in .env
3. Start server
4. Access directly from VPN

**No nginx, no Apache, no configuration headaches!** 🎉
