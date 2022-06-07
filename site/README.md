# publint-site

The website for https://publint.bjornlu.com.

Stack:

- Vite
- Svelte
- UnoCSS

## Development

```bash
# Start dev server
$ pnpm dev

# Build site
$ pnpm build

# Preview built site
$ pnpm preview

# Package fixtures for testing
$ pnpm packfix
```

The `packfix` command is a utility that packages up fixtures (mocked packages) at [../pkg/tests/fixtures](../pkg/tests/fixtures). In the dev server, you can search for the fixture name, e.g. `test-1`, and it'll load the package locally. This can be used for quick testing.

## License

MIT
