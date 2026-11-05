/**
 * OneForge Sledge — Security & Defensive Sandboxing Module
 * Comprehensive SSRF protection, IP filtering, and safe filesystem path resolution.
 */

import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';

// Private and reserved IPv4 CIDR blocks
const PRIVATE_IPV4_RANGES = [
  { start: ipToLong('0.0.0.0'), end: ipToLong('0.255.255.255'), name: 'Current network' },
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255'), name: 'RFC 1918 Private' },
  { start: ipToLong('100.64.0.0'), end: ipToLong('100.127.255.255'), name: 'Shared Carrier-grade NAT' },
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255'), name: 'Loopback' },
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255'), name: 'Link-Local / Cloud Metadata' },
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255'), name: 'RFC 1918 Private' },
  { start: ipToLong('192.0.0.0'), end: ipToLong('192.0.0.255'), name: 'IETF Protocol Assignments' },
  { start: ipToLong('192.0.2.0'), end: ipToLong('192.0.2.255'), name: 'Documentation TEST-NET-1' },
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255'), name: 'RFC 1918 Private' },
  { start: ipToLong('198.18.0.0'), end: ipToLong('198.19.255.255'), name: 'Benchmarking' },
  { start: ipToLong('198.51.100.0'), end: ipToLong('198.51.100.255'), name: 'Documentation TEST-NET-2' },
  { start: ipToLong('203.0.113.0'), end: ipToLong('203.0.113.255'), name: 'Documentation TEST-NET-3' },
  { start: ipToLong('224.0.0.0'), end: ipToLong('239.255.255.255'), name: 'Multicast' },
  { start: ipToLong('240.0.0.0'), end: ipToLong('255.255.255.255'), name: 'Reserved / Broadcast' },
];

function ipToLong(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Checks if a given IP address belongs to an internal, private, or reserved range.
 */
export function isPrivateOrReservedIp(ip) {
  if (!ip) return true;

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true; // Loopback
    // Check IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (normalized.startsWith('::ffff:')) {
      const mappedIpv4 = normalized.slice(7);
      if (net.isIPv4(mappedIpv4)) {
        return isPrivateOrReservedIp(mappedIpv4);
      }
    }
    if (normalized.startsWith('fe80:') || normalized.startsWith('fe90:') || normalized.startsWith('fea0:') || normalized.startsWith('feb0:')) {
      return true; // Link-local
    }
    if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) {
      return true; // Unique local
    }
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const ipLong = ipToLong(ip);
    for (const range of PRIVATE_IPV4_RANGES) {
      if (ipLong >= range.start && ipLong <= range.end) {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * Validates a target URL against SSRF attacks.
 * Resolves DNS to ensure no redirection to localhost, 127.0.0.1, or private networks.
 */
export async function validateSafeUrlForFetch(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, reason: `Forbidden protocol: ${parsed.protocol}. Only http/https allowed.` };
  }

  const hostname = parsed.hostname;

  // Immediately reject well-known loopback names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return { safe: false, reason: `Host "${hostname}" points to a private/local domain.` };
  }

  // Check if hostname is an explicit IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { safe: false, reason: `IP "${hostname}" is within a private, loopback, or metadata address space.` };
    }
    return { safe: true, url: parsed.href, hostname, resolvedIp: hostname };
  }

  // Perform DNS resolution to inspect underlying IP
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { safe: false, reason: `DNS resolution returned no records for "${hostname}".` };
    }

    for (const entry of lookup) {
      if (isPrivateOrReservedIp(entry.address)) {
        return {
          safe: false,
          reason: `DNS for "${hostname}" resolved to prohibited private IP: ${entry.address}. Request blocked by SSRF defense.`,
        };
      }
    }

    return { safe: true, url: parsed.href, hostname, resolvedIp: lookup[0].address };
  } catch (err) {
    return { safe: false, reason: `DNS lookup failed for "${hostname}": ${err.message}` };
  }
}

/**
 * Validates and sanitizes a hostname to prevent path traversal or injection.
 */
export function sanitizeHostForPath(host, baseDir) {
  if (!host || typeof host !== 'string') {
    throw new Error('Host must be a valid non-empty string.');
  }

  const cleanHost = host.trim().toLowerCase();
  const hostRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

  if (!hostRegex.test(cleanHost) || cleanHost.includes('..') || cleanHost.includes('/') || cleanHost.includes('\\')) {
    throw new Error(`Prohibited or invalid host pattern: "${host}"`);
  }

  const resolved = path.resolve(baseDir, cleanHost);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error(`Directory traversal detected for host "${host}".`);
  }

  return { cleanHost, safePath: resolved };
}

/**
 * Escapes HTML characters to prevent XSS.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
