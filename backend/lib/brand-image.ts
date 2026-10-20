import sharp from "sharp";

const MAX_EDGE = 1600;

export async function normalizeBrandImage(buffer: Buffer) {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width > MAX_EDGE || height > MAX_EDGE) {
    image.resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true });
  }

  if (meta.format === "jpeg") {
    return {
      buffer: await image.jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
      mimeType: "image/jpeg",
      ext: ".jpg",
    };
  }
  if (meta.format === "webp") {
    return {
      buffer: await image.webp({ quality: 90 }).toBuffer(),
      mimeType: "image/webp",
      ext: ".webp",
    };
  }
  return {
    buffer: await image.png({ compressionLevel: 9 }).toBuffer(),
    mimeType: "image/png",
    ext: ".png",
  };
}
