# Nginx Setup Quick Start

## Quick Deployment

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Deploy Configuration

```bash
# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/fastupload

# Enable site
sudo ln -s /etc/nginx/sites-available/fastupload /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Configure Domain

Edit configuration:

```bash
sudo nano /etc/nginx/sites-available/fastupload
```

Update this line:
```nginx
server_name your-domain.com www.your-domain.com;
```

Replace with your actual domain.

### 4. Test and Restart

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Or reload (no downtime)
sudo systemctl reload nginx
```

### 5. Access Your Server

Visit your domain:
```
http://your-domain.com
```

You should see FastUpload login page (if authentication enabled).

## Add HTTPS (Optional but Recommended)

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate and configure Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Choose redirect (recommended)
```

Certbot will automatically:
- Obtain SSL certificate
- Update Nginx configuration
- Redirect HTTP to HTTPS
- Set up auto-renewal

### Test HTTPS

```bash
# Test SSL configuration
sudo nginx -t

# Visit HTTPS
https://your-domain.com
```

## Configuration Summary

### Key Optimizations

- ✅ **50GB max upload size** (matches FastUpload)
- ✅ **5-minute timeouts** (for large files)
- ✅ **TUS protocol headers** (for resumable uploads)
- ✅ **Request buffering disabled** (critical for TUS PATCH)
- ✅ **Security headers** (XSS, clickjacking protection)
- ✅ **Gzip compression** (faster page loads)
- ✅ **Health check endpoint** (`/health`)

### Files

- **`nginx.conf`**: Complete Nginx configuration
- **`NGINX_GUIDE.md`**: Detailed documentation
- **`nginx.conf.example`**: Example configuration (if you create)

## Next Steps

1. **Test HTTP access**: `http://your-domain.com`
2. **Add HTTPS**: Use Certbot (see above)
3. **Monitor logs**: `tail -f /var/log/nginx/fastupload_access.log`
4. **Configure firewall**: Allow ports 80 and 443
5. **Set up DNS**: A records for your domain

## Troubleshooting

### 413 Request Entity Too Large

```bash
# Check client_max_body_size
sudo grep client_max_body /etc/nginx/sites-available/fastupload

# Should be: client_max_body_size 50G;

# Edit if too small
sudo nano /etc/nginx/sites-available/fastupload
sudo systemctl reload nginx
```

### 504 Gateway Timeout

```bash
# Check timeouts
sudo grep timeout /etc/nginx/sites-available/fastupload

# Should be: 300s (or higher)

# Edit if too small
sudo nano /etc/nginx/sites-available/fastupload
sudo systemctl reload nginx
```

### Can't Access via Domain

```bash
# 1. Check DNS
ping your-domain.com

# 2. Check server_name
sudo grep server_name /etc/nginx/sites-available/fastupload

# 3. Check if site is enabled
sudo ls -la /etc/nginx/sites-enabled/

# 4. Test Nginx configuration
sudo nginx -t

# 5. Check Nginx status
sudo systemctl status nginx
```

### SSL Issues

```bash
# 1. Check certificate files
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# 2. Check Nginx config for HTTPS
sudo grep "listen 443" /etc/nginx/sites-available/fastupload

# 3. Test SSL
openssl s_client -connect your-domain.com:443

# 4. Renew certificate
sudo certbot renew --dry-run
```

## Advanced Topics

### Custom Timeout Values

For very slow networks or extremely large files (>100GB), increase timeouts:

```nginx
# In /etc/nginx/sites-available/fastupload
client_body_timeout 600s;
client_header_timeout 600s;
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;
send_timeout 600s;
```

### Multiple Domains

```nginx
server_name your-domain.com www.your-domain.com
             another-domain.com www.another-domain.com;
```

### IP Access Control

Allow only specific IP addresses:

```nginx
location / {
    allow 1.2.3.4;
    allow 5.6.7.8;
    deny all;

    # ... rest of proxy config
}
```

## Documentation

- **[NGINX_GUIDE.md](./NGINX_GUIDE.md)** - Complete Nginx configuration guide
  - Detailed configuration explanation
  - HTTPS setup (Certbot and manual)
  - Performance tuning
  - Monitoring and logging
  - Troubleshooting
  - Security best practices
  - Advanced configuration

- **[nginx.conf](./nginx.conf)** - Complete Nginx configuration file
  - Optimized for FastUpload
  - Ready for HTTPS (uncomment and configure)
  - Security headers
  - TUS protocol support
  - Health check endpoint

## Summary

✅ **Install**: `sudo apt install nginx`
✅ **Deploy**: Copy `nginx.conf` to `/etc/nginx/sites-available/`
✅ **Configure**: Update `server_name` with your domain
✅ **Enable**: Create symlink to `sites-enabled/`
✅ **Test**: `sudo nginx -t` and `sudo systemctl reload nginx`
✅ **HTTPS**: Use `certbot --nginx` for Let's Encrypt

---

**Need more details?** See [NGINX_GUIDE.md](./NGINX_GUIDE.md)
