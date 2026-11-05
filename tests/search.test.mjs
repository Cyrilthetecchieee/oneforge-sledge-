import assert from 'node:assert/strict';
import test from 'node:test';
import { deltaE, hexToRgb, searchDesignLibrary } from '../src/discovery/search.mjs';
import { compareDesignSystems } from '../src/discovery/compare.mjs';
import { getDesignSystemByHost } from '../src/discovery/repository.mjs';

test('Search — Color Conversion & DeltaE accuracy', () => {
  // Hex to RGB
  assert.deepEqual(hexToRgb('#FFFFFF'), [255, 255, 255]);
  assert.deepEqual(hexToRgb('#000000'), [0, 0, 0]);
  assert.deepEqual(hexToRgb('#FF0000'), [255, 0, 0]);
  assert.deepEqual(hexToRgb('#0F8'), [0, 255, 136]);

  // DeltaE
  const distanceIdentical = deltaE('#FFFFFF', '#FFFFFF');
  assert.equal(distanceIdentical, 0, 'Identical colors should have DeltaE of 0');

  const distanceOpposite = deltaE('#FFFFFF', '#000000');
  assert.ok(distanceOpposite > 90, 'White and black should have massive DeltaE > 90');

  const distanceVeryClose = deltaE('#533AFD', '#543DFD');
  assert.ok(distanceVeryClose < 2.0, 'Nearly identical indigo shades should have DeltaE < 2');

  const distanceClose = deltaE('#533AFD', '#5038F0');
  assert.ok(distanceClose < 8.0, 'Close indigo shades should have DeltaE < 8');
});

test('Search — Multi-criteria Search in Catalog', async () => {
  // Query by name
  const resName = await searchDesignLibrary({ query: 'Stripe' });
  assert.ok(resName.total >= 1);
  assert.equal(resName.results[0].name, 'Stripe');

  // Query by category
  const resCat = await searchDesignLibrary({ category: 'AI' });
  assert.ok(resCat.total >= 10);
  assert.ok(resCat.results.every((r) => r.category === 'AI'));

  // Filter by theme
  const resDark = await searchDesignLibrary({ theme: 'dark' });
  assert.ok(resDark.total > 0);
  assert.ok(resDark.results.every((r) => r.theme === 'dark'));

  // Search by color
  const resColor = await searchDesignLibrary({ color: '#533AFD' });
  assert.ok(resColor.total > 0);
  assert.ok(resColor.results[0].colorDistance !== null);
  assert.ok(resColor.results[0].colorDistance < 20);
});

test('Discovery — System Comparison between Stripe and Linear', async () => {
  const comparison = await compareDesignSystems('stripe.com', 'linear.app');

  assert.equal(comparison.systemA.name, 'Stripe');
  assert.equal(comparison.systemB.name, 'Linear');
  assert.equal(comparison.general.themeMatch, false, 'Stripe is light, Linear is dark');
  assert.ok(comparison.color.primaryDeltaE > 0);
  assert.ok(comparison.similarityPercentage >= 0 && comparison.similarityPercentage <= 100);
  assert.ok(comparison.typography.systemA.fonts.length > 0);
  assert.ok(comparison.typography.systemB.fonts.length > 0);
});
