/**
 * Builds JPEGs in memory and asserts the EXIF GPS parser reads them back.
 *
 * The cases that matter are the ones PictoTrack's own description calls out:
 * hemisphere sign flipping, and both TIFF byte orders — a parser that only
 * ever sees phone photos will happily hard-code little-endian and be wrong on
 * half the cameras in the world.
 *
 * Run: npm run test:exif
 */
import assert from 'node:assert/strict';
import { parseExifGps, buildGpsApp1, spliceApp1 } from '../src/lib/exif-gps.ts';

/** The smallest thing the parser will accept as a JPEG: SOI + EOI. */
const bareJpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

const r = (n, d) => [n, d];
/** Kochi — 9°55'52.32"N 76°16'2.28"E — the coords in site.coords. */
const KOCHI_LAT = [r(9, 1), r(55, 1), r(5232, 100)];
const KOCHI_LON = [r(76, 1), r(16, 1), r(228, 100)];

function make(latRef, lat, lonRef, lon, le) {
  return spliceApp1(bareJpeg(), buildGpsApp1(latRef, lat, lonRef, lon, le)).buffer;
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log('exif-gps');

check('little-endian N/E parses to Kochi', () => {
  const res = parseExifGps(make('N', KOCHI_LAT, 'E', KOCHI_LON, true));
  assert.equal(res.ok, true);
  assert.equal(res.lat.toFixed(4), '9.9312');
  assert.equal(res.lon.toFixed(4), '76.2673');
  assert.match(res.dms, /9°55'52\.32"N/);
});

check('big-endian (MM) parses identically', () => {
  const res = parseExifGps(make('N', KOCHI_LAT, 'E', KOCHI_LON, false));
  assert.equal(res.ok, true);
  assert.equal(res.lat.toFixed(4), '9.9312');
  assert.equal(res.lon.toFixed(4), '76.2673');
});

check('S/W negates both coordinates', () => {
  const res = parseExifGps(make('S', KOCHI_LAT, 'W', KOCHI_LON, true));
  assert.equal(res.ok, true);
  assert.ok(res.lat < 0, `expected negative latitude, got ${res.lat}`);
  assert.ok(res.lon < 0, `expected negative longitude, got ${res.lon}`);
  assert.equal(res.lat.toFixed(4), '-9.9312');
  assert.equal(res.lon.toFixed(4), '-76.2673');
});

check('S/W in big-endian also negates', () => {
  const res = parseExifGps(make('S', KOCHI_LAT, 'W', KOCHI_LON, false));
  assert.equal(res.ok, true);
  assert.ok(res.lat < 0 && res.lon < 0);
});

check('a JPEG with no EXIF reports no-exif, not an error', () => {
  const res = parseExifGps(bareJpeg().buffer);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'no-exif');
});

check('a non-JPEG reports not-jpeg', () => {
  const res = parseExifGps(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'not-jpeg');
});

check('EXIF present but no GPS IFD reports no-gps', () => {
  // Same writer, then blank the 0x8825 tag so IFD0 has no GPS pointer.
  const app1 = buildGpsApp1('N', KOCHI_LAT, 'E', KOCHI_LON, true);
  new DataView(app1.buffer).setUint16(10 + 10, 0x010f, true); // 0x8825 → Make
  const res = parseExifGps(spliceApp1(bareJpeg(), app1).buffer);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'no-gps');
});

console.log(`\n${passed} passed`);
