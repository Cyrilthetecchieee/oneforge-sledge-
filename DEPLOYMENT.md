# ONEFORGE SLEDGE — DEPLOYMENT GUIDE

**Product:** OneForge Sledge  
**Document Version:** 1.0.0  

This document details deployment strategies for running **OneForge Sledge** in production, continuous integration, containerized environments, and cloud infrastructure.

---

## 1. Production Requirements

- **Memory**: Minimum 256 MB RAM (512 MB recommended for concurrent extraction).
- **CPU**: 1 vCPU is sufficient for standard workloads.
- **Node.js**: >= 20.0.0
- **Network**: Outbound HTTPS (port 443) for website extraction. Inbound HTTP/HTTPS for web dashboard and API.

---

## 2. Standalone Daemon Deployment (Systemd / Linux VPS)

### 2.1 Create Systemd Unit (`/etc/systemd/system/oneforge-sledge.service`)

```ini
[Unit]
Description=OneForge Sledge Design Intelligence Server
After=network.target

[Service]
Type=simple
User=sledge
WorkingDirectory=/opt/oneforge-sledge
ExecStart=/usr/bin/node bin/sledge.mjs serve --port=3456
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 2.2 Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable oneforge-sledge
sudo systemctl start oneforge-sledge
sudo systemctl status oneforge-sledge
```

---

## 3. Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name sledge.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Docker Deployment

### 4.1 Dockerfile
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy application source
COPY package.json ./
COPY bin/ ./bin/
COPY src/ ./src/
COPY assets/ ./assets/
COPY design-md/ ./design-md/
COPY index.json ./
COPY LICENSE NOTICE THIRD_PARTY_NOTICES.md ./

EXPOSE 3456

CMD ["node", "bin/sledge.mjs", "serve", "--port=3456"]
```

### 4.2 Build and Run
```bash
docker build -t oneforge-sledge:1.0.0 .
docker run -d -p 3456:3456 --name sledge oneforge-sledge:1.0.0
```

---

## 5. Security Checklist for Production

- [x] **Anti-SSRF Protection Active**: Ensured `validateSafeUrlForFetch` is invoked before every remote outbound HTTP call.
- [x] **Safe Directory Handling**: Ensured all user-supplied hosts are sanitized against path traversal.
- [x] **No Secret Leaks**: Verified zero hardcoded credentials or API tokens.
- [x] **Process Isolation**: Run under a dedicated, unprivileged system user (`sledge`).
