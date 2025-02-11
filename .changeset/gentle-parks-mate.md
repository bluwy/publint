---
'publint': patch
---

Deprecate the `deps` command. The command has been tricky to maintain and incomplete (e.g. doesn't lint recursively). A separate tool can be used to run publint on dependencies instead, e.g. `npx renoma --filter-rules "publint"`.
