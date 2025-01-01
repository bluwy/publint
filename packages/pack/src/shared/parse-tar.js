/**
 * @param {ArrayBuffer} buffer
 * @returns {import('../index.d.ts').TarballFile[]}
 */
export function parseTar(buffer) {
  const decoder = new TextDecoder()
  /** @type {import('../index.d.ts').TarballFile[]} */
  const files = []

  let offset = 0
  while (offset < buffer.byteLength) {
    // Get file type from header (from offset 156, 1 byte)
    const type = read(buffer, decoder, offset + 156, 1)

    // Skip empty blocks at end
    if (type === '\0') break

    // Get file size from header (from offset 124, 12 bytes)
    const size = parseInt(read(buffer, decoder, offset + 124, 12), 8)

    // Only handle files (0). Packed packages often only contain files and no directories.
    // It may contain PAX headers (x) and global PAX headers (g), but we don't need to handle those.
    if (type === '0') {
      // Get file name from header (from offset 0, 100 bytes)
      const name = read(buffer, decoder, offset, 100).split('\0', 1)[0]

      // Get file content from header (from offset 512, `size` bytes)
      const data = new Uint8Array(buffer, offset + 512, size)

      files.push({ name, data })
    }

    // Skip header and file content (padded to 512 bytes)
    offset += 512 + Math.ceil(size / 512) * 512
  }

  return files
}

/**
 * @param {ArrayBuffer} buffer
 * @param {TextDecoder} decoder
 * @param {number} offset
 * @param {number} length
 */
function read(buffer, decoder, offset, length) {
  const view = new Uint8Array(buffer, offset, length)
  return decoder.decode(view)
}

/**
 * @param {import('../index.d.ts').TarballFile[]} files
 */
export function getFilesRootDir(files) {
  return files.length ? files[0].name.split('/')[0] : 'package'
}
