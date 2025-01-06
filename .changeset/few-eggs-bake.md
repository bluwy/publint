---
'publint': patch
---

When a dependency with the `file:` or `link:` protocol is specified in the `package.json`, it will now error to prevent accidentally publishing dependencies that will likely not work when installed by end-users
