/**
 * OneForge Sledge — Defensive Safe HTTP Ingestion Client
 * Strict SSRF filtering at every hop, byte caps, timeout limits, and anti-bot mitigation detection.
 */

import { CONFIG } from '../config.mjs';
import { validateSafeUrlForFetch } from '../core/security.mjs';

/**
 * Safely fetches a remote URL with comprehensive defense-in-depth protections.
 */
export async function safeFetch(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || CONFIG.http.timeoutMs;
  const maxRedirects = options.maxRedirects || CONFIG.http.maxRedirects;
  const maxBytes = options.maxDownloadBytes || CONFIG.http.maxDownloadBytes;
  const userAgent = options.userAgent || CONFIG.userAgent;

  let currentUrl = targetUrl;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    // 1. SSRF and Domain Pre-Validation
    const safety = await validateSafeUrlForFetch(currentUrl);
    if (!safety.safe) {
      return {
        ok: false,
        status: 403,
        error: `SSRF Violation: ${safety.reason}`,
        url: currentUrl,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,text/css;q=0.9,*/*;q=0.1',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual', // Manual redirect control to validate each hop against SSRF
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { ok: false, status: 408, error: `Request timed out after ${timeoutMs}ms.`, url: currentUrl };
      }
      return { ok: false, status: 500, error: `Network connection failed: ${err.message}`, url: currentUrl };
    } finally {
      clearTimeout(timer);
    }

    // 2. Handle Redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) {
        return { ok: false, status: res.status, error: 'Redirect received without Location header.', url: currentUrl };
      }

      redirectsRemaining--;
      if (redirectsRemaining < 0) {
        return { ok: false, status: 310, error: 'Maximum redirect limit exceeded.', url: currentUrl };
      }

      try {
        currentUrl = new URL(location, currentUrl).href;
        continue; // Follow redirect safely
      } catch (err) {
        return { ok: false, status: 400, error: `Malformed redirect location: ${location}`, url: currentUrl };
      }
    }

    // 3. Detect Bot Challenges & Mitigation
    const cfMitigated = res.headers.get('cf-mitigated');
    if (cfMitigated === 'challenge' || res.status === 403 || res.status === 429) {
      const challengeText = cfMitigated === 'challenge' ? 'Cloudflare anti-bot challenge active' : 'Access blocked';
      return {
        ok: false,
        status: res.status,
        error: `${challengeText} (HTTP ${res.status}). Automated extraction restricted by server.`,
        url: currentUrl,
      };
    }

    // 4. Verify Content Type
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Server responded with HTTP ${res.status}`,
        url: currentUrl,
      };
    }

    // 5. Read body with byte cap
    try {
      const reader = res.body.getReader();
      const chunks = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes > maxBytes) {
          reader.cancel();
          return {
            ok: false,
            status: 413,
            error: `Payload exceeds maximum download threshold of ${maxBytes / 1024 / 1024} MB.`,
            url: currentUrl,
          };
        }
        chunks.push(value);
      }

      const totalBuffer = Buffer.concat(chunks);
      const text = totalBuffer.toString('utf8');

      return {
        ok: true,
        status: res.status,
        contentType,
        body: text,
        url: currentUrl,
        byteLength: totalBytes,
      };
    } catch (err) {
      return { ok: false, status: 500, error: `Failed reading response stream: ${err.message}`, url: currentUrl };
    }
  }

  return { ok: false, status: 310, error: 'Redirect loop detected.', url: currentUrl };
}
