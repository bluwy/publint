---
'publint': minor
---

The `vfs` option is removed in favour of an extended support of `pack: { tarball: ArrayBuffer }` and `pack: { files: PackFile[] }` APIs. Now, it is even easier to use `publint` in the browser or against a packed `.tgz` file in Node.js. See the docs for more examples of how to use these new options.
