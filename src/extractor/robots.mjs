/**
 * OneForge Sledge — Robots.txt Compliance Engine
 * Evaluates crawling permissions for ethical and legally compliant web observation.
 */

import { validateSafeUrlForFetch } from '../core/security.mjs';

/**
 * Fetches and parses robots.txt for a given base URL.
 */
export async function checkRobotsPermission(targetUrl, userAgent = 'OneForge-Sledge') {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

    const safety = await validateSafeUrlForFetch(robotsUrl);
    if (!safety.safe) {
      return { allowed: false, reason: `Robots.txt check blocked: ${safety.reason}` };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let res;
    try {
      res = await fetch(robotsUrl, {
        headers: { 'User-Agent': `${userAgent}/1.0` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 404) {
      // No robots.txt means all standard crawling is permitted
      return { allowed: true, reason: 'No robots.txt present (HTTP 404).' };
    }

    if (!res.ok) {
      // Inaccessible robots.txt; default to allowed with warning
      return { allowed: true, warning: `robots.txt returned HTTP ${res.status}. Proceeding conservatively.` };
    }

    const text = await res.text();
    const isAllowed = isPathAllowed(text, parsed.pathname, userAgent);

    return {
      allowed: isAllowed,
      reason: isAllowed ? 'Allowed by robots.txt.' : 'Disallowed by robots.txt directive.',
    };
  } catch (err) {
    // If robots.txt fails due to timeout or network, do not silently crash
    return { allowed: true, warning: `Could not evaluate robots.txt: ${err.message}. Proceeding conservatively.` };
  }
}

/**
 * Evaluates whether a pathname is allowed given robots.txt contents.
 */
export function isPathAllowed(robotsText, pathname, agentName = 'OneForge-Sledge') {
  const lines = robotsText.split(/\r?\n/);
  let relevantAgent = false;
  const disallows = [];
  const allows = [];

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const [directive, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    const dirLower = directive.trim().toLowerCase();

    if (dirLower === 'user-agent') {
      const valLower = value.toLowerCase();
      relevantAgent = valLower === '*' || valLower === agentName.toLowerCase();
    } else if (relevantAgent) {
      if (dirLower === 'disallow') {
        if (value) disallows.push(value);
      } else if (dirLower === 'allow') {
        if (value) allows.push(value);
      }
    }
  }

  // Check allows first
  for (const pattern of allows) {
    if (pathMatches(pattern, pathname)) return true;
  }

  // Check disallows
  for (const pattern of disallows) {
    if (pathMatches(pattern, pathname)) return false;
  }

  return true;
}

function pathMatches(pattern, testPath) {
  if (pattern === '/') return true;
  if (!pattern) return false;
  return testPath.startsWith(pattern);
}
