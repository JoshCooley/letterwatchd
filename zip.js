import { unzipSync, strFromU8 } from "./vendor/fflate.min.js";

// fflate preallocates originalSize bytes per entry, so rejecting here bounds memory.
const MAX_BYTES = 32 * 1024 * 1024;

export function extractFromZip(buffer, filename) {
  const wanted = (name) => name === filename || name.endsWith("/" + filename);
  let oversized = false;
  const files = unzipSync(new Uint8Array(buffer), {
    filter: (file) => {
      if (!wanted(file.name)) return false;
      if (file.originalSize > MAX_BYTES) {
        oversized = true;
        return false;
      }
      return true;
    },
  });
  const key = Object.keys(files).find(wanted);
  if (!key) throw new Error(oversized ? `${filename} is too large` : `${filename} not found in zip`);
  return strFromU8(files[key]);
}
