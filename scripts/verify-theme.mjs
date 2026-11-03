import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const css = fs.readFileSync(new URL('../src/styles/globals.css', import.meta.url), 'utf8');
const tokens = (selector) =>
  Object.fromEntries(
    [
      ...css
        .match(new RegExp(`${selector} \\{([^}]+)\\}`))[1]
        .matchAll(/(--[\w-]+): (#[\da-f]{6});/g),
    ].map(([, name, value]) => [name, value]),
  );
const light = tokens(':root');
const dark = { ...light, ...tokens('\\.dark') };
function luminance(hex) {
  return hex
    .match(/[\da-f]{2}/g)
    .map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [mode, theme] of Object.entries({ light, dark })) {
  for (const bg of ['--surface', '--app-bg', '--app-bg-subtle']) {
    for (const fg of [
      '--app-text',
      '--app-text-secondary',
      '--app-text-tertiary',
      '--accent',
      '--success-text',
      '--error-text',
    ]) {
      assert.ok(contrast(theme[fg], theme[bg]) >= 4.5, `${mode}: ${fg} on ${bg}`);
    }
    assert.ok(
      contrast(theme['--app-border-strong'], theme[bg]) >= 3,
      `${mode}: input boundary on ${bg}`,
    );
  }
  assert.ok(contrast('#ffffff', theme['--primary']) >= 4.5, `${mode}: action label`);
  assert.ok(
    contrast(theme['--ct-on-accent'], theme['--accent']) >= 4.5,
    `${mode}: selected step label`,
  );
  assert.ok(contrast(theme['--warning-text'], theme['--warning-bg']) >= 4.5, `${mode}: warning`);
}
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const boot = html.match(/<script>([\s\S]*?)<\/script>/)[1];
for (const [saved, expected] of [
  [null, true],
  ['1', true],
  ['0', false],
  ['unavailable', true],
]) {
  let darkMode;
  vm.runInNewContext(boot, {
    localStorage: {
      getItem: () => {
        if (saved === 'unavailable') throw Error('denied');
        return saved;
      },
    },
    document: {
      documentElement: {
        classList: {
          toggle: (name, value) => {
            assert.equal(name, 'dark');
            darkMode = value;
          },
        },
      },
    },
  });
  assert.equal(darkMode, expected, `Pre-paint preference ${saved}`);
}
assert.match(css, /\.booking-app \.qr-frame\s*\{[^}]*background:\s*#fff(?:fff)?;/);
assert.doesNotMatch(css.match(/\.home-book\s*\{[^}]+\}/)[0], /color-scheme:\s*light/);
assert.match(css, /--red:\s*var\(--error-text\);/, 'Calendar full-date legend keeps its error colour');
console.log(
  'Theme checks passed: light/dark text, controls, actions, warnings, saved preferences and white QR frame.',
);
