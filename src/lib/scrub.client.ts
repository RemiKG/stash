// scrub.client.ts — runs ON THE DEVICE, before anything is uploaded.
// 1) strips ALL EXIF/metadata (GPS, device, timestamps) by re-encoding via canvas
// 2) detects faces with pico.js (MIT, vendored in /public/pico) and mosaics them
// 3) turns the real photo into a duotone HALFTONE catalogue-plate (the engraved look)
// Nothing raw ever leaves the browser. Face-blur degrades gracefully to metadata-strip.

const INK = "#2B2119";
const AMBER = "#E8A33D";
const PAPER = "#FBFAF6";
const RISO = { dx: 1.6, dy: 1.1 };

let picoReady: Promise<((img: PicoImg, params: PicoParams) => number[][]) | null> | null = null;

interface PicoImg { pixels: Uint8Array; nrows: number; ncols: number; ldim: number; }
interface PicoParams { shiftfactor: number; minsize: number; maxsize: number; scalefactor: number; }

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pico?: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.dataset.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error("script load failed"));
    document.head.appendChild(s);
  });
}

async function ensurePico() {
  if (picoReady) return picoReady;
  picoReady = (async () => {
    try {
      await loadScript("/pico/pico.js");
      const buf = await fetch("/pico/facefinder").then((r) => r.arrayBuffer());
      const bytes = new Int8Array(buf);
      const classify = window.pico.unpack_cascade(bytes);
      return (image: PicoImg, params: PicoParams) => {
        let dets = window.pico.run_cascade(image, classify, params) as number[][];
        dets = window.pico.cluster_detections(dets, 0.2) as number[][];
        return dets;
      };
    } catch {
      return null; // graceful: metadata strip still applies
    }
  })();
  return picoReady;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("image load failed")); };
    img.src = url;
  });
}

function toGray(data: Uint8ClampedArray, n: number): Uint8Array {
  const g = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    g[i] = (0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]) | 0;
  }
  return g;
}

export interface ScrubResult { scrubbed: string; plate: string }

export async function scrubAndPlate(file: File): Promise<ScrubResult> {
  const img = await fileToImage(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  // --- face scrub (mosaic detected faces) ---
  try {
    const run = await ensurePico();
    if (run) {
      const gray = toGray(ctx.getImageData(0, 0, w, h).data, w * h);
      const dets = run(
        { pixels: gray, nrows: h, ncols: w, ldim: w },
        { shiftfactor: 0.1, minsize: Math.round(Math.min(w, h) * 0.12), maxsize: Math.min(w, h), scalefactor: 1.1 }
      );
      for (const d of dets) {
        const [r, c, s, q] = d;
        if (q < 50) continue;
        const size = Math.round(s * 1.1);
        const x = Math.max(0, Math.round(c - size / 2));
        const y = Math.max(0, Math.round(r - size / 2));
        const bw = Math.min(w - x, size), bh = Math.min(h - y, size);
        if (bw <= 2 || bh <= 2) continue;
        // mosaic: downscale the region hard, then draw it back up
        const tiny = document.createElement("canvas");
        const step = Math.max(1, Math.round(Math.max(bw, bh) / 6));
        tiny.width = Math.max(1, Math.round(bw / step));
        tiny.height = Math.max(1, Math.round(bh / step));
        const tctx = tiny.getContext("2d")!;
        tctx.drawImage(canvas, x, y, bw, bh, 0, 0, tiny.width, tiny.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, x, y, bw, bh);
        ctx.imageSmoothingEnabled = true;
      }
    }
  } catch { /* face-blur is best-effort; metadata strip below is guaranteed */ }

  // re-encode -> drops all EXIF/metadata. This is the guaranteed scrub.
  const scrubbed = canvas.toDataURL("image/jpeg", 0.85);
  const plate = makePlate(canvas);
  return { scrubbed, plate };
}

// --- real photo -> duotone halftone catalogue-plate ---
function makePlate(srcCanvas: HTMLCanvasElement): string {
  const cols = 46; // dot grid resolution
  const aspect = srcCanvas.height / srcCanvas.width;
  const rows = Math.max(8, Math.round(cols * aspect));
  const sample = document.createElement("canvas");
  sample.width = cols; sample.height = rows;
  const sctx = sample.getContext("2d")!;
  sctx.drawImage(srcCanvas, 0, 0, cols, rows);
  const px = sctx.getImageData(0, 0, cols, rows).data;

  const cell = 7;
  const out = document.createElement("canvas");
  out.width = cols * cell; out.height = rows * cell;
  const o = out.getContext("2d")!;
  o.fillStyle = PAPER;
  o.fillRect(0, 0, out.width, out.height);

  const maxR = cell * 0.62;
  // amber plate first (riso-shifted), then ink on top — the misregistration signature
  for (const [color, dx, dy] of [[AMBER, RISO.dx, RISO.dy], [INK, 0, 0]] as [string, number, number][]) {
    o.fillStyle = color;
    o.globalAlpha = color === AMBER ? 0.9 : 1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const j = (y * cols + x) * 4;
        const lum = (0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]) / 255;
        const a = px[j + 3] / 255;
        const darkness = (1 - lum) * a;
        const r = darkness * maxR;
        if (r < 0.35) continue;
        o.beginPath();
        o.arc(x * cell + cell / 2 + dx, y * cell + cell / 2 + dy, r, 0, Math.PI * 2);
        o.fill();
      }
    }
  }
  o.globalAlpha = 1;
  return out.toDataURL("image/png");
}
