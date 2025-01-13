---
'publint': patch
---

(Potentially breaking) Disable running lifecycle scripts, such as `prepare`, `prepack`, and `postpack`, when running the pack command internally. This returns to the behavior in v0.2. (Note that this change does not apply to yarn as it does not support ignoring lifecycle scripts for local projects)

This change is made as running lifecycle scripts was an unintentional behavior during the v0.3 breaking change, which could cause the linting process to take longer than expected, or even cause infinite loops if `publint` is used in a lifecycle script.
