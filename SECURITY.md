# ONEFORGE SLEDGE — SECURITY POLICY

**Product:** OneForge Sledge  
**Parent Brand:** OneForge  

Security and defensive engineering are foundational to OneForge Sledge. Because this platform ingests public website data and serves AI agents, strict boundaries are enforced.

---

## 1. Supported Versions

| Version | Supported |
| :--- | :--- |
| `1.0.x` | ✅ Active Security Support |

---

## 2. Reporting a Vulnerability

If you discover a potential security vulnerability within OneForge Sledge, please report it immediately:

- **Security Team Email**: `security@oneforge.dev`
- **Response SLA**: Initial triage within 24 hours.

Please do not disclose vulnerabilities publicly via GitHub Issues or social media until our team has triaged and deployed a fix.

---

## 3. Threat Model & Defensive Controls

### 3.1 Anti-SSRF (Server-Side Request Forgery) Subsystem
OneForge Sledge enforces strict IP filtering on all outbound network fetches:
- Target hostnames are pre-resolved via DNS.
- IPs are validated against comprehensive CIDR blocks blocking loopback (`127.0.0.0/8`, `::1`), RFC-1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Cloud metadata endpoints (`169.254.169.254`), and link-local IPv6 addresses.
- Redirect chains are pinned, verified, and restricted to a maximum hop limit.

### 3.2 Safe Filesystem Operations
Brand names and hostnames used for directory lookups are sanitized through strict regular expressions (`^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$`). Directory traversal characters (`..`, `/`, `\`) are rejected.

### 3.3 Resource Exhaustion Protections
- Strict 15-second wall-clock timeouts via `AbortSignal`.
- 5 MB maximum body payload limit.
