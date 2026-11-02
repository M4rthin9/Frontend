import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Regression: range responses cannot be stored as normal cache entries, and a
// direct MP4 navigation must never overwrite the offline HTML document.
const handlers = {};
const source = fs
  .readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8')
  .replaceAll('__CACHE__', '"test-shell"')
  .replaceAll('__PRECACHE__', '[]')
  .replaceAll('__API_BASE__', '"https://api.example.test"');
let cacheWrites = 0;
vm.runInNewContext(source, {
  self: {
    location: { origin: 'https://cida.dpdns.org' },
    addEventListener: (type, handler) => {
      handlers[type] = handler;
    },
  },
  URL,
  caches: {
    match: async () => undefined,
    open: async () => ({
      put: async () => {
        cacheWrites++;
      },
    }),
  },
  fetch: async () => new Response('ok'),
});
for (const request of [
  {
    url: 'https://cida.dpdns.org/media/vis-guide/video-test.mp4',
    mode: 'navigate',
    destination: 'document',
  },
  {
    url: 'https://cida.dpdns.org/media/vis-guide/video-test.mp4',
    mode: 'no-cors',
    destination: 'video',
  },
  {
    url: 'https://cida.dpdns.org/other.bin',
    mode: 'cors',
    destination: '',
    range: 'bytes=1000-2000',
  },
]) {
  let intercepted = false;
  handlers.fetch({
    request: {
      method: 'GET',
      ...request,
      headers: new Headers(request.range ? { Range: request.range } : {}),
    },
    respondWith: () => {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false, 'Media and byte ranges must stay with the browser/CDN');
}
let staticResponse;
handlers.fetch({
  request: {
    method: 'GET',
    url: 'https://cida.dpdns.org/assets/app.css',
    mode: 'cors',
    destination: 'style',
    headers: new Headers(),
  },
  respondWith: (response) => {
    staticResponse = response;
  },
});
assert.ok(staticResponse, 'Normal application assets must retain offline caching');
assert.equal((await staticResponse).status, 200);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(cacheWrites, 1);

const manifest = fs.readFileSync(new URL('../src/lib/visGuideVideo.ts', import.meta.url), 'utf8');
const paths = [...manifest.matchAll(/'(\/media\/vis-guide\/[^']+)'/g)].map((match) => match[1]);
assert.equal(paths.length, 3);
for (const asset of paths)
  assert.ok(fs.statSync(new URL('../public' + asset, import.meta.url)).size > 0);
const captions = fs.readFileSync(
  new URL('../public' + paths.find((path) => path.endsWith('.vtt')), import.meta.url),
  'utf8',
);
assert.ok(captions.startsWith('WEBVTT\n'));
assert.match(captions, /2–3/);
assert.match(captions, /VIS/);
console.log(
  'Video assets/captions verified; media/ranges bypass service-worker caching; application caching preserved.',
);
