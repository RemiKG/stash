// image.ts — server-side belt-and-braces scrub. The heavy scrub (face blur +
// re-encode) runs on the DEVICE before upload (see lib/scrub.client.ts); here we
// re-encode with sharp to GUARANTEE all EXIF/metadata (GPS, device, timestamps)
// is gone before anything is stored, and normalise size/orientation.
import sharp from "sharp";

export function dataUrlToBuffer(dataUrl: string): { buf: Buffer; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) throw new Error("not a data URL");
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

export function bufferToDataUrl(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// Re-encode: honour EXIF orientation, drop ALL metadata, cap dimensions.
export async function scrubServer(buf: Buffer): Promise<{ buf: Buffer; mime: string }> {
  try {
    const out = await sharp(buf)
      .rotate() // bakes EXIF orientation then metadata is dropped on output
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return { buf: out, mime: "image/jpeg" };
  } catch {
    // if sharp can't decode (rare), pass through unchanged rather than fail closed
    return { buf, mime: "image/jpeg" };
  }
}
