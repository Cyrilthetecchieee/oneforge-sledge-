import assert from 'node:assert/strict';
import test from 'node:test';
import { isPrivateOrReservedIp, sanitizeHostForPath, validateSafeUrlForFetch } from '../src/core/security.mjs';

test('Security — SSRF IP Range Defense', () => {
  // Prohibited private IPv4 ranges
  assert.equal(isPrivateOrReservedIp('127.0.0.1'), true, 'Should block loopback 127.0.0.1');
  assert.equal(isPrivateOrReservedIp('127.1.2.3'), true, 'Should block loopback range');
  assert.equal(isPrivateOrReservedIp('10.0.0.1'), true, 'Should block RFC1918 10.0.0.0/8');
  assert.equal(isPrivateOrReservedIp('172.16.0.1'), true, 'Should block RFC1918 172.16.0.0/12');
  assert.equal(isPrivateOrReservedIp('192.168.1.1'), true, 'Should block RFC1918 192.168.0.0/16');
  assert.equal(isPrivateOrReservedIp('169.254.169.254'), true, 'Should block Cloud Metadata IP');
  assert.equal(isPrivateOrReservedIp('0.0.0.0'), true, 'Should block 0.0.0.0');

  // Prohibited IPv6
  assert.equal(isPrivateOrReservedIp('::1'), true, 'Should block IPv6 loopback');
  assert.equal(isPrivateOrReservedIp('fe80::1'), true, 'Should block IPv6 link-local');
  assert.equal(isPrivateOrReservedIp('fc00::1'), true, 'Should block IPv6 unique-local');
  assert.equal(isPrivateOrReservedIp('::ffff:127.0.0.1'), true, 'Should block IPv4-mapped loopback');
  assert.equal(isPrivateOrReservedIp('::ffff:169.254.169.254'), true, 'Should block IPv4-mapped metadata');

  // Permitted Public IPs
  assert.equal(isPrivateOrReservedIp('8.8.8.8'), false, 'Should allow Google Public DNS');
  assert.equal(isPrivateOrReservedIp('1.1.1.1'), false, 'Should allow Cloudflare Public DNS');
  assert.equal(isPrivateOrReservedIp('140.82.121.4'), false, 'Should allow GitHub public IP');
});

test('Security — validateSafeUrlForFetch against SSRF', async () => {
  // Reject localhost and local names immediately
  const localRes = await validateSafeUrlForFetch('http://localhost:8080/secret');
  assert.equal(localRes.safe, false);
  assert.match(localRes.reason, /private\/local domain/);

  const ipRes = await validateSafeUrlForFetch('http://169.254.169.254/latest/meta-data/');
  assert.equal(ipRes.safe, false);
  assert.match(ipRes.reason, /metadata address space/);

  const loopRes = await validateSafeUrlForFetch('http://127.0.0.1:3000/admin');
  assert.equal(loopRes.safe, false);

  const schemeRes = await validateSafeUrlForFetch('file:///etc/passwd');
  assert.equal(schemeRes.safe, false);
});

test('Security — Host Sanitization and Traversal Prevention', () => {
  const baseDir = 'C:\\test\\base';

  // Valid hosts
  const valid = sanitizeHostForPath('stripe.com', baseDir);
  assert.equal(valid.cleanHost, 'stripe.com');
  assert.ok(valid.safePath.endsWith('stripe.com'));

  // Traversal attacks
  assert.throws(() => sanitizeHostForPath('../etc/passwd', baseDir), /Prohibited or invalid host pattern/);
  assert.throws(() => sanitizeHostForPath('stripe.com/../../secret', baseDir), /Prohibited or invalid host pattern/);
  assert.throws(() => sanitizeHostForPath('stripe.com\\foo', baseDir), /Prohibited or invalid host pattern/);
  assert.throws(() => sanitizeHostForPath('', baseDir), /Host must be a valid non-empty string/);
});
