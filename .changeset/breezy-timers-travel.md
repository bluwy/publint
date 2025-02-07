---
'publint': patch
---

When globbing `"exports"` values that contains `*`, also respect `"exports"` keys that mark paths as null. For example:

```json
{
  "exports": {
    "./*": "./dist/*",
    "./browser/*": null
  }
}
```

The glob in `"./*": "./dist/*"` will no longer match and lint files in `"./browser/*"` as it's marked null (internal).
