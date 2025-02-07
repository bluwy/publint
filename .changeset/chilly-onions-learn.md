---
'publint': patch
---

Update logs when running the `publint` CLI:

- The `publint` version is now displayed.
- The packing command is also displayed.
- Messages are now logged in the order of errors, warnings, and suggestions, instead of the other way round, to prioritize errors.
- The `publint deps` command no longer logs passing dependencies. Only failing dependencies are logged.

Examples:

```bash
$ npx publint
$ Running publint v0.X.X for my-library...
$ Packing files with `npm pack`...
$ All good!
```

```bash
$ npx publint deps
$ Running publint v0.X.X for my-library deps...
$ x my-dependency
$ Errors:
$ 1. ...
```
