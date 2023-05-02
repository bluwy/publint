<br>

<p align="center">
  <img src="https://user-images.githubusercontent.com/34116392/172312754-0407aeaa-d7a6-4ada-8bc0-ea80bc314f5f.svg" height="80">
</p>

<h1 align="center">
  publint
</h1>

<p align="center">
  Lint packaging errors. Ensure compatibility across environments.
</p>

<p align="center">
  <a href="https://publint.dev">
    <strong>Try it online</strong>
  </a>
</p>

<br>

## Usage

```bash
# Lint your library project
$ npx publint

# Lint a dependency
$ npx publint ./node_modules/some-lib

# Lint your project's dependencies based on package.json
$ npx publint deps
```

Or try it online at https://publint.dev. For JavaScript usage, see [pkg/README.md](./pkg/README.md).

## Development

Use `pnpm install` to install all project dependencies.

There are 2 parts to this repo:

- [pkg](./pkg) - The `publint` npm package
- [site](./site) - The website

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsor">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
