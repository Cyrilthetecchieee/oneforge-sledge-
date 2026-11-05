import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDesignMd, parseFrontmatter, validateDesignSystem, validateUrl } from '../src/core/validator.mjs';

test('Validator — URL Validation', () => {
  assert.equal(validateUrl('https://stripe.com').valid, true);
  assert.equal(validateUrl('http://example.com/subpage').valid, true);
  assert.equal(validateUrl('ftp://example.com').valid, false);
  assert.equal(validateUrl('not a url').valid, false);
});

test('Validator — Frontmatter Parsing', () => {
  const sampleFrontmatter = `
version: alpha
name: "Stripe"
description: "Light interface"
colors:
  background: "#FFFFFF"
  primary: "#533AFD"
  on-primary: "#FFFFFF"
typography:
  headline-display:
    fontFamily: sohne-var
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1.15
rounded:
  sm: 4px
spacing:
  xs: 4px
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
`;

  const parsed = parseFrontmatter(sampleFrontmatter);
  assert.equal(parsed.name, 'Stripe');
  assert.equal(parsed.description, 'Light interface');
  assert.equal(parsed.colors.background, '#FFFFFF');
  assert.equal(parsed.colors.primary, '#533AFD');
  assert.equal(parsed.typography['headline-display'].fontFamily, 'sohne-var');
  assert.equal(parsed.typography['headline-display'].fontSize, '48px');
  assert.equal(parsed.rounded.sm, '4px');
  assert.equal(parsed.spacing.md, '16px');
  assert.equal(parsed.components['button-primary'].backgroundColor, '{colors.primary}');
});

test('Validator — Full DESIGN.md parsing with markdown body and rules', () => {
  const fullDesignMd = `---
version: alpha
name: Linear
colors:
  background: "#08090A"
  primary: "#5E6AD2"
typography:
  body-md:
    fontFamily: Inter
    fontSize: 16px
rounded:
  sm: 6px
spacing:
  sm: 8px
---

# Linear Design System

## Overview
Linear is a purpose-built tool for modern product development.

## Do's and Don'ts
- Do use dark surfaces with high-contrast text.
- Don't use saturated backgrounds for large containers.
`;

  const system = parseDesignMd(fullDesignMd);
  assert.equal(system.name, 'Linear');
  assert.equal(system.tokens.colors.background, '#08090A');
  assert.equal(system.tokens.typography['body-md'].fontFamily, 'Inter');
  assert.equal(system.documentation.dos.length, 1);
  assert.equal(system.documentation.donts.length, 1);
  assert.ok(system.documentation.dos[0].includes('high-contrast text'));

  const validation = validateDesignSystem(system);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
});

test('Validator — Schema errors on incomplete system', () => {
  const invalidSystem = {
    name: '',
    tokens: {
      colors: {},
    },
  };

  const validation = validateDesignSystem(invalidSystem);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length >= 2);
});
