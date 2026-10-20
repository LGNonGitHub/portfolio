'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { readExifGps, buildGpsApp1, spliceApp1 } from '@/lib/exif-gps';
import {
  binarise,
  dilate3x3,
  fitWithin,
  greyscale,
  otsuThreshold,
} from '@/lib/preprocess';
import { cn } from '@/lib/utils';

/**
 * A browser re-implementation of PictoTrack's fallback route.
 *
 * The claim on the spread is that the project finds where a photo was taken.
 * This lets a visitor check that claim with their own file instead of taking
 * it on trust. Everything runs on the device: the EXIF walk, the OpenCV
 * preprocessing, the demo file. There is not a single network call in here,
 * which is also why the OCR lane stops at dilation — Tesseract and Nominatim
 * belong to the desktop app, and pretending otherwise would be a lie.
 */

type Stage =
  | 'decode'
  | 'grey'
  | 'otsu'
  | 'dilate'
  | 'exif'
  | 'dms'
  | 'hemi'
  | 'result';

type Fix = { lat: number; lon: number; dms: string };

type Frames = {
  grey: ImageBitmap | ImageData;
  binary: ImageBitmap | ImageData;
  dilated: ImageBitmap | ImageData;
  threshold: number;
  width: number;
  height: number;
};

const LANES: { id: string; label: string; steps: { id: Stage | null; label: string; note?: string }[] }[] = [
  {
    id: 'ocr',
    label: 'Route 1 · OCR',
    steps: [
      { id: 'grey', label: 'Greyscale' },
      { id: 'otsu', label: 'Otsu threshold' },
      { id: 'dilate', label: 'Dilation' },
      { id: null, label: 'Tesseract OCR', note: 'desktop app only' },
      { id: null, label: 'Nominatim geocode', note: 'desktop app only' },
    ],
  },
  {
    id: 'exif',
    label: 'Route 2 · EXIF fallback',
    steps: [
      { id: 'exif', label: 'GPS IFD' },
      { id: 'dms', label: 'DMS → decimal' },
      { id: 'hemi', label: '± hemisphere' },
    ],
  },
];

export default function PipelineBench() {
  const [done, setDone] = useState<Set<Stage>>(new Set());
  const [fix, setFix] = useState<Fix | null>(null);
  const [frames, setFrames] = useState<Frames | null>(null);
  const [status, setStatus] = useState('Waiting for a photo.');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const greyRef = useRef<HTMLCanvasElement>(null);
  const binaryRef = useRef<HTMLCanvasElement>(null);
  const dilatedRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  // Paint whenever frames change, not inside the run — the canvases only exist
  // once React has rendered the results block.
  useEffect(() => {
    if (!frames) return;
    const pairs: [HTMLCanvasElement | null, ImageBitmap | ImageData][] = [
      [greyRef.current, frames.grey],
      [binaryRef.current, frames.binary],
      [dilatedRef.current, frames.dilated],
    ];
    for (const [canvas, image] of pairs) {
      if (!canvas) continue;
      canvas.width = frames.width;
      canvas.height = frames.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
        ctx.drawImage(image, 0, 0);
      } else {
        ctx.putImageData(image as ImageData, 0, 0);
      }
    }
  }, [frames]);

  const mark = useCallback((stage: Stage) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(stage);
      return next;
    });
  }, []);

  /**
   * The worker path transfers bitmaps both ways. Without OffscreenCanvas the
   * same functions run here, with the dilation yielding every 64 rows so the
   * page keeps responding.
   */
  const preprocess = useCallback(async (file: Blob): Promise<Frames | null> => {
    const bitmap = await createImageBitmap(file);

    const canUseWorker =
      typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

    if (canUseWorker) {
      try {
        const worker = new Worker(
          new URL('../../workers/preprocess.worker.ts', import.meta.url),
        );
        workerRef.current = worker;
        const result = await new Promise<Frames>((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error('worker timeout')), 15_000);
          worker.onmessage = (event) => {
            window.clearTimeout(timer);
            if (event.data?.ok) resolve(event.data as Frames);
            else reject(new Error(event.data?.error ?? 'worker failed'));
          };
          worker.onerror = (event) => {
            window.clearTimeout(timer);
            reject(new Error(event.message || 'worker error'));
          };
          worker.postMessage({ bitmap }, [bitmap]);
        });
        worker.terminate();
        workerRef.current = null;
        return result;
      } catch {
        // fall through to the main-thread path below
      }
    }

    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const source = ctx.getImageData(0, 0, width, height);
    const grey = greyscale(source.data);
    const threshold = otsuThreshold(grey);
    const binary = binarise(grey, threshold);
    // Yield once before the only expensive pass so the stage lights paint.
    await new Promise((r) => window.setTimeout(r, 0));
    const dilated = dilate3x3(binary, width, height);

    return {
      grey: new ImageData(grey, width, height),
      binary: new ImageData(binary, width, height),
      dilated: new ImageData(dilated, width, height),
      threshold,
      width,
      height,
    };
  }, []);

  const run = useCallback(
    async (file: File, label: string) => {
      setBusy(true);
      setDone(new Set());
      setFix(null);
      setFrames(null);
      setSourceLabel(label);

      const heic =
        /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (heic) {
        setStatus(
          'Export as JPEG. PictoTrack’s desktop build reads HEIC via Pillow.',
        );
        setBusy(false);
        return;
      }

      setStatus('Reading the file…');

      try {
        // Lane 2 first: it is a 128 KB read and answers almost immediately.
        const gps = await readExifGps(file);
        mark('exif');

        if (gps.ok) {
          mark('dms');
          mark('hemi');
          mark('result');
          setFix({ lat: gps.lat, lon: gps.lon, dms: gps.dms });
          setStatus(
            `GPS found. ${gps.dms}, decimal ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}. PictoTrack would now reverse-geocode this and plot it.`,
          );
        } else if (gps.reason === 'not-jpeg') {
          setStatus(
            'That is not a JPEG. PictoTrack reads the EXIF block out of JPEG files; the OCR route would still run on other formats in the desktop app.',
          );
        } else {
          setStatus(
            'No GPS block in this file. PictoTrack would now try the OCR route, which runs in the desktop app with Tesseract.',
          );
        }

        // Lane 1: the OpenCV preprocessing, which runs whatever the EXIF said.
        mark('decode');
        const result = await preprocess(file);
        if (result) {
          mark('grey');
          mark('otsu');
          mark('dilate');
          setFrames(result);
        }
      } catch (error) {
        setStatus(
          `Could not read that file (${String(error)}). Nothing left your device.`,
        );
      } finally {
        setBusy(false);
      }
    },
    [mark, preprocess],
  );

  /**
   * The demo file is drawn here and then given a GPS block by the same writer
   * the parser is tested against. Parsing back what this page just wrote is
   * the proof — a bundled fixture could drift from the parser without anyone
   * noticing.
   */
  const runDemo = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#2b3f6b');
    sky.addColorStop(1, '#c9a173');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 420);
    ctx.fillStyle = '#1d2a1c';
    ctx.fillRect(0, 420, 1024, 260);

    // A signboard, so the OCR lane has real high-contrast text to binarise.
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(170, 250, 684, 170);
    ctx.fillStyle = '#20201e';
    ctx.fillRect(186, 266, 652, 138);
    ctx.fillStyle = '#f4f1e8';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICTOTRACK DEMO', 512, 330);
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('· KOCHI ·', 512, 382);
    ctx.fillStyle = '#6b5436';
    ctx.fillRect(492, 420, 40, 150);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    if (!blob) return;

    // Kochi: 9°55'52.32"N 76°16'2.28"E → 9.9312, 76.2673 (site.coords).
    const app1 = buildGpsApp1(
      'N',
      [[9, 1], [55, 1], [5232, 100]],
      'E',
      [[76, 1], [16, 1], [228, 100]],
    );
    const bytes = spliceApp1(new Uint8Array(await blob.arrayBuffer()), app1);
    const file = new File([bytes as unknown as BlobPart], 'pictotrack-demo.jpg', {
      type: 'image/jpeg',
    });

    await run(file, 'demo file, GPS written by this page');
  }, [run]);

  const osm = fix
    ? `https://www.openstreetmap.org/?mlat=${fix.lat.toFixed(5)}&mlon=${fix.lon.toFixed(5)}#map=12/${fix.lat.toFixed(5)}/${fix.lon.toFixed(5)}`
    : null;

  return (
    <div className="hud-frame mt-5 border border-accent/25 bg-surface/40 p-5 sm:p-7">
      <h4 className="eyebrow mb-2">Run it yourself</h4>
      <p className="max-w-prose text-sm leading-relaxed text-muted">
        A browser re-implementation of PictoTrack’s fallback route, processed
        on your device, never uploaded.
      </p>

      {/* Input */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void run(file, file.name);
        }}
        className={cn(
          'mt-5 flex flex-wrap items-center gap-4 border border-dashed p-4 transition-colors motion-reduce:transition-none',
          dragging ? 'border-accent bg-accent/10' : 'border-fg/20',
        )}
      >
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/50 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-accent-ink">
          Choose a photo
          <input
            type="file"
            accept="image/jpeg,image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void run(file, file.name);
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => void runDemo()}
          disabled={busy}
          className="rounded-full border border-fg/20 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Try the demo file
        </button>

        <span className="font-mono text-[11px] text-faint">
          or drop one here
        </span>
      </div>

      {/* Diagram. The list below carries the semantics; this is the picture. */}
      <div aria-hidden className="mt-6 overflow-x-auto">
        <svg viewBox="0 0 760 210" className="h-auto w-full min-w-[560px]" role="presentation">
          {LANES.map((lane, li) =>
            lane.steps.map((step, si) => {
              const x = 8 + si * 146;
              const y = li === 0 ? 24 : 112;
              const lit = step.id ? done.has(step.id) : false;
              return (
                <g key={`${lane.id}-${step.label}`}>
                  <rect
                    x={x}
                    y={y}
                    width={128}
                    height={34}
                    rx={2}
                    fill={lit ? 'rgb(var(--accent) / 0.18)' : 'transparent'}
                    stroke={
                      lit
                        ? 'rgb(var(--accent))'
                        : step.id
                          ? 'rgb(var(--fg) / 0.25)'
                          : 'rgb(var(--fg) / 0.12)'
                    }
                    strokeDasharray={step.id ? undefined : '3 3'}
                  />
                  <text
                    x={x + 64}
                    y={y + 22}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                    fill={
                      lit
                        ? 'rgb(var(--accent))'
                        : step.id
                          ? 'rgb(var(--fg) / 0.7)'
                          : 'rgb(var(--fg) / 0.35)'
                    }
                  >
                    {step.label}
                  </text>
                  {si < lane.steps.length - 1 && (
                    <text
                      x={x + 136}
                      y={y + 22}
                      fontSize="11"
                      fill="rgb(var(--fg) / 0.4)"
                    >
                      →
                    </text>
                  )}
                </g>
              );
            }),
          )}
          <text x="8" y="16" fontSize="10" fontFamily="ui-monospace, monospace" fill="rgb(var(--fg) / 0.45)">
            ROUTE 1 · OCR
          </text>
          <text x="8" y="104" fontSize="10" fontFamily="ui-monospace, monospace" fill="rgb(var(--fg) / 0.45)">
            ROUTE 2 · EXIF FALLBACK
          </text>
          <rect
            x={8}
            y={168}
            width={240}
            height={34}
            rx={2}
            fill={done.has('result') ? 'rgb(var(--accent) / 0.18)' : 'transparent'}
            stroke={done.has('result') ? 'rgb(var(--accent))' : 'rgb(var(--fg) / 0.25)'}
          />
          <text
            x={128}
            y={190}
            textAnchor="middle"
            fontSize="11"
            fontFamily="ui-monospace, monospace"
            fill={done.has('result') ? 'rgb(var(--accent))' : 'rgb(var(--fg) / 0.7)'}
          >
            reverse geocode → map
          </text>
        </svg>
      </div>

      {/* The accessible equivalent of the diagram above. */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {LANES.map((lane) => (
          <section key={lane.id}>
            <h5 className="eyebrow mb-2">{lane.label}</h5>
            <ol className="space-y-1">
              {lane.steps.map((step) => {
                const lit = step.id ? done.has(step.id) : false;
                return (
                  <li
                    key={step.label}
                    className={cn(
                      'font-mono text-[11px]',
                      lit ? 'text-accent' : 'text-muted',
                    )}
                  >
                    <span aria-hidden>{lit ? '●' : '○'} </span>
                    {step.label}
                    {step.note && (
                      <span className="text-faint"> · {step.note}</span>
                    )}
                    <span className="sr-only">
                      {lit ? ', done' : step.note ? '' : ', not run yet'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* Results */}
      <p
        aria-live="polite"
        className="mt-6 max-w-prose border-l-2 border-accent/50 pl-4 text-sm leading-relaxed text-fg/90"
      >
        {status}
      </p>

      {sourceLabel && (
        <p className="mt-2 font-mono text-[11px] text-faint">
          Source: {sourceLabel}
        </p>
      )}

      {fix && (
        <dl className="mt-5 grid gap-x-8 gap-y-2 font-mono text-[11px] sm:grid-cols-2">
          <div>
            <dt className="text-faint">DMS</dt>
            <dd className="text-fg">{fix.dms}</dd>
          </div>
          <div>
            <dt className="text-faint">Decimal</dt>
            <dd className="text-fg">
              {fix.lat.toFixed(4)}, {fix.lon.toFixed(4)}
            </dd>
          </div>
        </dl>
      )}

      {osm && (
        <a
          href={osm}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent underline underline-offset-4"
        >
          Open in OpenStreetMap <ArrowUpRight size={13} aria-hidden />
        </a>
      )}

      {frames && (
        <>
          <p className="mt-6 font-mono text-[11px] text-muted">
            Otsu threshold: {frames.threshold}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { ref: greyRef, label: 'Greyscale' },
              { ref: binaryRef, label: 'Binarised' },
              { ref: dilatedRef, label: 'Dilated' },
            ].map((item) => (
              <figure key={item.label}>
                <canvas
                  ref={item.ref}
                  data-bench-bitmap
                  className="w-full border border-fg/15 bg-bg"
                />
                <figcaption className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
