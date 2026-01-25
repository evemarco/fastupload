# Nginx Configuration Guide

## Overview

This guide explains how to configure Nginx as a reverse proxy for FastUpload, with optimizations for large file uploads and TUS protocol support.

## Quick Start

### 1. Copy Configuration to Nginx

```bash
# Copy configuration to Nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/fastupload

# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/fastupload /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t
```

### 2. Update Domain Name

Edit the configuration file:

```bash
sudo nano /etc/nginx/sites-available/fastupload
```

Update `server_name`:

```nginx
server_name your-domain.com www.your-domain.com;
```

Replace `your-domain.com` with your actual domain.

### 3. Upload Directory Configuration

Ensure Nginx can access the upload directory:

```bash
# If FastUpload is running as user 'nodejs' (for example)
# Upload directory is /mnt/disk2/uploads

# Check permissions
ls -ld /mnt/disk2/uploads

# If needed, add Nginx user to group with access
# Or ensure the directory is readable by Nginx
```

### 4. Restart Nginx

```bash
# Restart Nginx
sudo systemctl restart nginx

# Or reload (graceful, no downtime)
sudo systemctl reload nginx
```

### 5. Test

Visit your domain:
```
http://your-domain.com
```

You should see the FastUpload login page or home page.

## Configuration Details

### Key Optimizations

The Nginx configuration includes the following optimizations to handle large file uploads:

#### 1. Upload Size

```nginx
client_max_body_size 50G;
```

- **Default Nginx**: 1MB (too small)
- **Our config**: 50GB (matches FastUpload)
- **Important**: Must be >= `MAX_FILE_SIZE_GB` in `.env`

#### 2. Timeouts

```nginx
# Client timeouts
client_body_timeout 300s;      # Time for client to send body
client_header_timeout 300s;    # Time for client to send header

# Proxy timeouts
proxy_connect_timeout 300s;    # Time to establish connection
proxy_send_timeout 300s;       # Time to send request to FastUpload
proxy_read_timeout 300s;       # Time to read response from FastUpload
send_timeout 300s;             # Time to transmit response
```

- **Default Nginx**: 60s (too short for large files)
- **Our config**: 300s (5 minutes)
- **Purpose**: Allow slow network or very large files
- **Formula**: `timeout >= (max_file_size / min_bandwidth) + buffer`

#### 3. Buffer Settings

```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
client_body_buffer_size 128k;
```

- **Purpose**: Optimize memory usage
- **TUS PATCH**: Buffering disabled for upload endpoint
- **Memory**: Controlled allocation (no OOM)

#### 4. Request Buffering (Critical!)

```nginx
# For TUS PATCH requests
proxy_request_buffering off;
proxy_buffering off;
```

- **Purpose**: Stream TUS PATCH requests directly
- **Why critical**: TUS protocol requires streaming uploads
- **Benefit**: Enables resumable uploads

#### 5. TUS Protocol Headers

```nginx
proxy_set_header Tus-Resumable "1.0.0";
proxy_set_header Upload-Offset "";
proxy_set_header Upload-Length "";
proxy_set_header Upload-Metadata "";
proxy_set_header Tus-Version "1.0.0";
```

- **Purpose**: Pass TUS protocol headers to FastUpload
- **Required**: By TUS protocol specification
- **Benefit**: Enables resumable uploads

### Upstream Configuration

```nginx
upstream fastupload {
    server 127.0.0.1:3003;
    keepalive 64;
}
```

- **127.0.0.1**: Localhost (FastUpload runs on same server)
- **3003**: Port from `.env` (`PORT=3003`)
- **keepalive 64**: Keep connections open (performance)

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

- **Purpose**: Prevent clickjacking, XSS, and other attacks
- **Always**: Apply to all responses

### Compression

```nginx
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss;
```

- **Purpose**: Compress text responses
- **Benefit**: Faster page loads, less bandwidth
- **Note**: Doesn't compress file uploads (already compressed if needed)

## HTTPS Setup (Optional)

### Using Let's Encrypt (Certbot)

#### 1. Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 2. Obtain SSL Certificate

```bash
# Automated configuration
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# 1. Enter email (for renewal notifications)
# 2. Agree to Terms of Service
# 3. Share email with EFF (optional)
# 4. Choose: Redirect HTTP to HTTPS (recommended)
```

Certbot will automatically:
- Obtain SSL certificate
- Update Nginx configuration
- Redirect HTTP to HTTPS
- Set up auto-renewal

#### 3. Test HTTPS

```bash
# Test SSL configuration
sudo nginx -t

# Test SSL (use online tool)
# Visit: https://www.ssllabs.com/ssltest/
# Enter: your-domain.com
```

#### 4. Verify Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Manual HTTPS Configuration

If you prefer manual configuration (not using Certbot):

#### 1. Uncomment HTTPS Server Block

Edit `/etc/nginx/sites-available/fastupload`:

```nginx
# Uncomment this server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name your-domain.com www.your-domain.com;

    # Update certificate paths
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Copy all location blocks from HTTP server
    # (location /, /upload, /health, etc.)

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### 2. Enable HTTP to HTTPS Redirect

```nginx
# Uncomment this server block
server {
    listen 80;
    listen [::]:80;

    server_name your-domain.com www.your-domain.com;

    return 301 https://$server_name$request_uri;
}
```

#### 3. Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Performance Tuning

### 1. Worker Connections

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 4096;
events {
    use epoll;
}
```

### 2. File Upload Module (Optional)

Nginx has a file upload module that can handle uploads directly:

```bash
# Install nginx-extras (Ubuntu/Debian)
sudo apt install nginx-extras

# Configuration
client_max_body_size 50G;
client_body_in_file_only on;
client_body_temp_path /var/nginx/tmp;
```

**Note**: Not recommended for TUS protocol (use FastUpload instead).

### 3. Rate Limiting (Optional)

Limit requests to prevent abuse:

```nginx
# Add in http context
limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/s;

# Add in server context
limit_req zone=upload burst=20 nodelay;
limit_req_status 429;
```

### 4. Connection Keep-Alive

```nginx
keepalive_timeout 65;
keepalive_requests 100;
```

## Monitoring

### 1. Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/fastupload_access.log

# Error logs
tail -f /var/log/nginx/fastupload_error.log
```

### 2. Health Check

The configuration includes a health check endpoint:

```bash
# Test health check
curl http://your-domain.com/health
# Should return: OK
```

### 3. Monitor Uploads

Monitor FastUpload logs:

```bash
# If running as service
sudo journalctl -u fastupload -f

# Or if running manually
tail -f /path/to/fastupload/logs/fastupload.log
```

## Troubleshooting

### Problem: 413 Request Entity Too Large

**Symptoms**: Upload fails with "413" error

**Solution**:
```bash
# Check client_max_body_size in Nginx config
grep client_max_body_size /etc/nginx/sites-available/fastupload

# Should be: client_max_body_size 50G;
# (Or >= your MAX_FILE_SIZE_GB in .env)

# Edit if too small
sudo nano /etc/nginx/sites-available/fastupload
# Update: client_max_body_size 50G;

# Reload Nginx
sudo systemctl reload nginx
```

### Problem: 504 Gateway Timeout

**Symptoms**: Upload fails with "504" error during large file upload

**Solution**:
```bash
# Check timeout values in Nginx config
grep timeout /etc/nginx/sites-available/fastupload

# Should be: 300s (or higher)

# Increase if needed
sudo nano /etc/nginx/sites-available/fastupload
# Update all timeout directives:
#   proxy_read_timeout 600s;
#   proxy_send_timeout 600s;
#   send_timeout 600s;

# Reload Nginx
sudo systemctl reload nginx
```

### Problem: Uploads Can't Resume

**Symptoms**: Uploads don't resume after interruption

**Solution**:
```bash
# Check proxy_request_buffering
grep proxy_request_buffering /etc/nginx/sites-available/fastupload

# For /upload location, should be:
#   proxy_request_buffering off;
#   proxy_buffering off;

# Edit if buffering is on
sudo nano /etc/nginx/sites-available/fastupload

# In /upload location block, add:
location /upload {
    proxy_request_buffering off;
    proxy_buffering off;
    # ... rest of config
}

# Reload Nginx
sudo systemctl reload nginx
```

### Problem: CORS Errors

**Symptoms**: Browser shows CORS errors

**Solution**:
```bash
# Nginx configuration includes CORS headers
# If issues persist, add explicit CORS:

sudo nano /etc/nginx/sites-available/fastupload

# Add in server block:
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type, Upload-Offset, Tus-Resumable, Upload-Length, Upload-Metadata' always;

# Reload Nginx
sudo systemctl reload nginx
```

### Problem: 502 Bad Gateway

**Symptoms**: "502 Bad Gateway" error

**Solution**:
```bash
# Check if FastUpload is running
ps aux | grep "node server.js"

# Should see process running

# If not running, start FastUpload:
cd /path/to/fastupload
pnpm start

# Or if running as service:
sudo systemctl restart fastupload

# Check Nginx error log
sudo tail -f /var/log/nginx/fastupload_error.log
```

### Problem: Domain Not Resolving

**Symptoms**: Can't access via domain, only works via IP

**Solution**:
```bash
# 1. Check DNS records
# A record: your-domain.com → YOUR_SERVER_IP
# A record: www.your-domain.com → YOUR_SERVER_IP

# Use DNS checker: https://dnschecker.org/

# 2. Check Nginx server_name
grep server_name /etc/nginx/sites-available/fastupload

# Should include: server_name your-domain.com www.your-domain.com;

# 3. Test DNS resolution
ping your-domain.com
# Should return your server IP

# 4. Test Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

### Problem: HTTP Works but HTTPS Doesn't

**Symptoms**: HTTP works, HTTPS shows error or connection refused

**Solution**:
```bash
# 1. Check if HTTPS server block is enabled
grep -A 5 "listen 443" /etc/nginx/sites-available/fastupload

# Should see HTTPS server block (uncommented)

# 2. Check SSL certificate paths
grep ssl_certificate /etc/nginx/sites-available/fastupload

# Should point to valid certificates:
#   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# 3. Verify certificates exist
ls -la /etc/letsencrypt/live/your-domain.com/

# 4. Check if port 443 is open
sudo ufw status
# Should allow: 443/tcp

# 5. Test HTTPS
curl -I https://your-domain.com
```

### Problem: Configuration Test Fails

**Symptoms**: `nginx -t` shows errors

**Solution**:
```bash
# Test configuration
sudo nginx -t

# Check error details
sudo nginx -t 2>&1

# Common issues:
# - Missing semicolon
# - Mismatched braces
# - Invalid directive
# - Duplicate server_name

# Edit configuration
sudo nano /etc/nginx/sites-available/fastupload

# Fix syntax errors

# Test again
sudo nginx -t

# Reload if test passes
sudo systemctl reload nginx
```

## Advanced Configuration

### 1. Load Balancing

If running multiple FastUpload instances:

```nginx
upstream fastupload {
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    server 127.0.0.1:3005;

    # Load balancing method
    least_conn;  # Use least connections
    # Or: ip_hash;  # Session persistence

    keepalive 64;
}
```

### 2. Caching

Cache static files for better performance:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    proxy_pass http://fastupload;

    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 3. GeoIP Blocking

Block requests from certain countries:

```bash
# Install GeoIP database
sudo apt install geoip-bin geoip-database

# Add in http context
geoip_country /usr/share/GeoIP/GeoIP.dat;
```

```nginx
# Block specific countries
if ($geoip_country_code ~ (RU|CN|KP)) {
    return 403;
}
```

### 4. IP Whitelisting

Allow only specific IP addresses:

```nginx
# Allow only certain IPs
allow 1.2.3.4;
allow 5.6.7.8;
deny all;
```

### 5. Rate Limiting by IP

Limit requests per IP:

```nginx
# In http context
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# In server context
limit_req zone=api burst=50 nodelay;
```

## Security Best Practices

### 1. Hide Nginx Version

```nginx
# In http context
server_tokens off;
```

### 2. Limit Request Size

```nginx
client_max_body_size 50G;  # Set appropriately
```

### 3. Timeout Settings

```nginx
# Don't set too high (prevents DoS)
client_body_timeout 300s;
client_header_timeout 300s;
```

### 4. Disable Unnecessary Modules

Comment out unused modules in `nginx.conf`:

```nginx
# Example: disable unused modules
# --without-http_uwsgi_module
# --without-http_scgi_module
```

### 5. Use HTTPS in Production

```nginx
# Force HTTPS
add_header Strict-Transport-Security "max-age=31536000" always;
```

### 6. Regular Updates

```bash
# Update Nginx regularly
sudo apt update
sudo apt upgrade nginx
```

## Performance Monitoring

### 1. Nginx Status Module

Enable stub_status for monitoring:

```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

Access stats:
```bash
curl http://localhost/nginx_status
```

### 2. Real-Time Monitoring

```bash
# Monitor Nginx activity
sudo tail -f /var/log/nginx/access.log

# Monitor errors
sudo tail -f /var/log/nginx/error.log
```

### 3. Log Analysis

Use tools to analyze logs:
- GoAccess: `goaccess /var/log/nginx/fastupload_access.log`
- Nginx Log Analyzer: https://github.com/mason-lai/nginx-log-analyzer

## Backup and Recovery

### 1. Backup Configuration

```bash
# Backup Nginx config
sudo cp -r /etc/nginx /backup/nginx-$(date +%Y%m%d)

# Backup FastUpload config
cp /path/to/fastupload/.env /backup/.env-$(date +%Y%m%d)
```

### 2. Restore Configuration

```bash
# Restore Nginx config
sudo cp -r /backup/nginx-20240125/* /etc/nginx/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Summary

✅ **Install**: `sudo apt install nginx`
✅ **Deploy**: Copy `nginx.conf` to `/etc/nginx/sites-available/`
✅ **Configure**: Update domain name in `server_name`
✅ **Enable**: Create symbolic link to `sites-enabled/`
✅ **Test**: `sudo nginx -t` and `sudo systemctl reload nginx`
✅ **HTTPS**: Use Certbot for Let's Encrypt
✅ **Optimized**: Timeouts, buffers, and TUS headers

## Additional Resources

- [Nginx Documentation](http://nginx.org/en/docs/)
- [TUS Protocol Guide](./TUS_GUIDE.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Need help?** Check [Troubleshooting Guide](./TROUBLESHOOTING.md) or [Authentication Guide](./AUTHENTICATION.md)
