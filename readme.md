# Python Hover

Rich hover documentation for Python keywords with live content from docs.python.org. Get comprehensive, up-to-date documentation for `class`, `def`, `try`, `import`, and other Python keywords directly in your editor.

## Features

- **Live Documentation**: Fetches current documentation directly from docs.python.org
- **Rich Content**: Includes syntax, examples, and practical usage patterns
- **Smart Caching**: Configurable caching (7 days by default) for fast subsequent hovers
- **Working Links**: Internal documentation links work correctly within hover tooltips
- **Version Support**: Choose your Python version (3, 3.11, 3.12, etc.)
- **Zero Dependencies**: No external dependencies, works alongside any Python extension

## Supported Keywords

`class`, `def`, `return`, `with`, `yield`, `async`, `await`, `import`, `try`, `if`, `for`, `while`, `except`, `finally`, `else`, `elif`, `break`, `continue`, `pass`, `lambda`, `global`, `nonlocal`

## Settings

- `pythonHover.pythonVersion` (default: `"3"`) — Python docs version to use (e.g., `"3"`, `"3.12"`)
- `pythonHover.cacheDays` (default: `7`) — Number of days to cache documentation content

## Commands

- **Python Hover: Clear Documentation Cache** - Clear all cached documentation to fetch fresh content

## Usage

1. Open any Python file
2. Hover over supported keywords (`class`, `def`, `try`, etc.)
3. See rich documentation with examples and links to official docs

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile: `npm run compile`
4. Press **F5** in VS Code to launch Extension Development Host
5. Open a Python file and test hovering over keywords

## Build Extension

```bash
npm install -g vsce
npm run package
```

This creates a `.vsix` file you can install via **Extensions → Install from VSIX**.

## Contributing

To add more keywords, extend the `MAP` object in `src/extension.ts` with the correct `url` and `anchor` values from docs.python.org.

## License

MIT
