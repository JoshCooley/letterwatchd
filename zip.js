import { unzipSync, strFromU8 } from "./vendor/fflate.min.js";

export function extractFromZip(buffer, filename) {
  const files = unzipSync(new Uint8Array(buffer));
  const key = Object.keys(files).find((k) => k === filename || k.endsWith("/" + filename));
  if (!key) throw new Error(`${filename} not found in zip`);
  return strFromU8(files[key]);
}
