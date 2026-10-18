/**
 * A dependency-free re-implementation of PictoTrack's EXIF fallback route.
 *
 * The desktop app reads the GPS block with Pillow; this does the same walk by
 * hand so the bench on the work page can run it on the visitor's own photo
 * without uploading anything, and without pulling an EXIF package into the
 * bundle. It is deliberately small: APP1 → TIFF header → IFD0 → GPS IFD, and
 * the same degrees-minutes-seconds to decimal conversion, including the sign
 * flip for the southern and western hemispheres that PictoTrack does.
 *
 * Only the first 128 KB of the file is ever read. EXIF lives in the first
 * segment, so there is no reason to pull a 12 MB photo into memory.
 */

export type GpsFailure = 'not-jpeg' | 'no-exif' | 'no-gps';

export type GpsResult =
  | { ok: true; lat: number; lon: number; dms: string }
  | { ok: false; reason: GpsFailure };

const HEAD_BYTES = 131_072;

/** d + m/60 + s/3600, negated in the southern and western hemispheres. */
export function dmsToDecimal(
  d: number,
  m: number,
  s: number,
  ref: string,
): number {
  const value = d + m / 60 + s / 3600;
  return ref === 'S' || ref === 'W' ? -value : value;
}

function formatDms(d: number, m: number, s: number, ref: string): string {
  return `${d}°${m}'${s.toFixed(2)}"${ref}`;
}

export function parseExifGps(buffer: ArrayBuffer): GpsResult {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return { ok: false, reason: 'not-jpeg' };
  }

  // Walk the JPEG marker chain looking for APP1. Stop at SOS (0xFFDA): past
  // that point it is entropy-coded image data, not segments.
  let offset = 2;
  let tiff = -1;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (marker === 0xda) break;

    const size = view.getUint16(offset + 2);
    if (size < 2) break;

    if (marker === 0xe1 && offset + 10 <= view.byteLength) {
      const tag = new Uint8Array(buffer, offset + 4, 6);
      const isExif =
        tag[0] === 0x45 && tag[1] === 0x78 && tag[2] === 0x69 &&
        tag[3] === 0x66 && tag[4] === 0x00 && tag[5] === 0x00;
      if (isExif) {
        tiff = offset + 10;
        break;
      }
    }
    offset += 2 + size;
  }

  if (tiff < 0 || tiff + 8 > view.byteLength) {
    return { ok: false, reason: 'no-exif' };
  }

  // Byte order: 'II' (0x4949) little-endian, 'MM' (0x4D4D) big-endian.
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) {
    return { ok: false, reason: 'no-exif' };
  }
  const le = order === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 42) {
    return { ok: false, reason: 'no-exif' };
  }

  const u16 = (at: number) => view.getUint16(at, le);
  const u32 = (at: number) => view.getUint32(at, le);

  const findTag = (ifd: number, wanted: number): number | null => {
    if (ifd + 2 > view.byteLength) return null;
    const count = u16(ifd);
    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > view.byteLength) return null;
      if (u16(entry) === wanted) return entry;
    }
    return null;
  };

  const ifd0 = tiff + u32(tiff + 4);
  const gpsPointer = findTag(ifd0, 0x8825);
  if (!gpsPointer) return { ok: false, reason: 'no-gps' };

  const gpsIfd = tiff + u32(gpsPointer + 8);

  /** An ASCII ref ('N'/'S'/'E'/'W') is 2 bytes, so it lives inline in the entry. */
  const readRef = (tag: number): string | null => {
    const entry = findTag(gpsIfd, tag);
    if (!entry) return null;
    return String.fromCharCode(view.getUint8(entry + 8)).toUpperCase();
  };

  /** Three RATIONALs (24 bytes) never fit inline, so the value is an offset. */
  const readTriple = (tag: number): [number, number, number] | null => {
    const entry = findTag(gpsIfd, tag);
    if (!entry) return null;
    const at = tiff + u32(entry + 8);
    if (at + 24 > view.byteLength) return null;
    const parts: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      const num = u32(at + i * 8);
      const den = u32(at + i * 8 + 4);
      parts.push(den === 0 ? 0 : num / den);
    }
    return parts as [number, number, number];
  };

  const latRef = readRef(1);
  const lat = readTriple(2);
  const lonRef = readRef(3);
  const lon = readTriple(4);

  if (!latRef || !lat || !lonRef || !lon) {
    return { ok: false, reason: 'no-gps' };
  }

  return {
    ok: true,
    lat: dmsToDecimal(lat[0], lat[1], lat[2], latRef),
    lon: dmsToDecimal(lon[0], lon[1], lon[2], lonRef),
    dms: `${formatDms(lat[0], lat[1], lat[2], latRef)} ${formatDms(lon[0], lon[1], lon[2], lonRef)}`,
  };
}

/** Reads only the head of the file — EXIF is always in the first segment. */
export async function readExifGps(file: Blob): Promise<GpsResult> {
  const head = await file.slice(0, HEAD_BYTES).arrayBuffer();
  return parseExifGps(head);
}

// ---------------------------------------------------------------------------
// APP1 writer
//
// The demo file is generated in the browser and then given a hand-built GPS
// block by this function. Parsing back what we just wrote is the point: it is
// a round trip that proves the parser above, rather than a fixture that could
// quietly drift from it. scripts/test-exif-gps.mjs uses the same writer.
// ---------------------------------------------------------------------------

export type Rational = [number, number];

/** Builds an APP1 segment carrying IFD0 → GPS IFD with lat/lon only. */
export function buildGpsApp1(
  latRef: 'N' | 'S',
  lat: [Rational, Rational, Rational],
  lonRef: 'E' | 'W',
  lon: [Rational, Rational, Rational],
  littleEndian = true,
): Uint8Array {
  // Layout, all offsets relative to the TIFF header:
  //   0   byte order + 42 + offset to IFD0
  //   8   IFD0: 1 entry (0x8825 → GPS IFD) + next-IFD 0
  //   26  GPS IFD: 4 entries + next-IFD 0
  //   80  latitude  rationals (24 bytes)
  //   104 longitude rationals (24 bytes)
  const TIFF_LEN = 128;
  const tiff = new Uint8Array(TIFF_LEN);
  const dv = new DataView(tiff.buffer);
  const le = littleEndian;

  dv.setUint16(0, le ? 0x4949 : 0x4d4d);
  dv.setUint16(2, 42, le);
  dv.setUint32(4, 8, le);

  dv.setUint16(8, 1, le); // IFD0 entry count
  dv.setUint16(10, 0x8825, le); // GPSInfo
  dv.setUint16(12, 4, le); // LONG
  dv.setUint32(14, 1, le);
  dv.setUint32(18, 26, le); // → GPS IFD
  dv.setUint32(22, 0, le); // no IFD1

  const GPS = 26;
  dv.setUint16(GPS, 4, le); // 4 entries

  const entry = (i: number, tag: number, type: number, count: number) => {
    const at = GPS + 2 + i * 12;
    dv.setUint16(at, tag, le);
    dv.setUint16(at + 2, type, le);
    dv.setUint32(at + 4, count, le);
    return at + 8;
  };

  // ASCII refs are 2 bytes (letter + NUL) and sit inline in the value field.
  // Big-endian files left-align inline values, little-endian ones do too —
  // the first byte of the field is the character either way.
  tiff[entry(0, 1, 2, 2)] = latRef.charCodeAt(0);
  dv.setUint32(entry(1, 2, 5, 3), 80, le);
  tiff[entry(2, 3, 2, 2)] = lonRef.charCodeAt(0);
  dv.setUint32(entry(3, 4, 5, 3), 104, le);

  dv.setUint32(GPS + 2 + 4 * 12, 0, le); // no next IFD

  const writeTriple = (at: number, triple: [Rational, Rational, Rational]) => {
    triple.forEach(([num, den], i) => {
      dv.setUint32(at + i * 8, num, le);
      dv.setUint32(at + i * 8 + 4, den, le);
    });
  };
  writeTriple(80, lat);
  writeTriple(104, lon);

  // APP1 = FFE1 + length + "Exif\0\0" + TIFF block.
  const payload = 6 + TIFF_LEN;
  const seg = new Uint8Array(4 + payload);
  seg[0] = 0xff;
  seg[1] = 0xe1;
  new DataView(seg.buffer).setUint16(2, payload + 2); // length is always big-endian
  seg.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 4);
  seg.set(tiff, 10);
  return seg;
}

/** Splices an APP1 segment in straight after the SOI of an existing JPEG. */
export function spliceApp1(jpeg: Uint8Array, app1: Uint8Array): Uint8Array {
  const out = new Uint8Array(jpeg.length + app1.length);
  out.set(jpeg.subarray(0, 2), 0); // SOI
  out.set(app1, 2);
  out.set(jpeg.subarray(2), 2 + app1.length);
  return out;
}
