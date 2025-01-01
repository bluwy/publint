/** @type {import('../utils.d.ts').unpackTarball} */
export async function unpackTarball(tarball) {
  const decoder = new TextDecoder()
  /** @type {import('../utils.d.ts').TarballFile[]} */
  const files = []

  let offset = 0
  while (offset < tarball.byteLength) {
    // Get file type from header (from offset 156, 1 byte)
    const type = read(tarball, decoder, offset + 156, 1)

    // Skip empty blocks at end
    if (type === '\0') break

    // Get file size from header (from offset 124, 12 bytes)
    const size = parseInt(read(tarball, decoder, offset + 124, 12), 8)

    // Only handle files (0). Packed packages often only contain files and no directories.
    // It may contain PAX headers (x) and global PAX headers (g), but we don't need to handle those.
    if (type === '0') {
      // Get file name from header (from offset 0, 100 bytes)
      const name = read(tarball, decoder, offset, 100).split('\0', 1)[0]

      // Get file content from header (from offset 512, `size` bytes)
      const data = new Uint8Array(tarball, offset + 512, size)

      files.push({ name, data })
    }

    // Skip header and file content (padded to 512 bytes)
    offset += 512 + Math.ceil(size / 512) * 512
  }

  const rootDir = files.length ? files[0].name.split('/')[0] : 'package'

  return { files, rootDir }
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
