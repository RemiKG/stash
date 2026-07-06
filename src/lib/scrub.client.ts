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
