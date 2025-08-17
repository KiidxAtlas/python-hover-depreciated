# Python Hover VS Code Extension - AI Agent Instructions

## Project Overview
This is a VS Code extension that provides rich hover documentation for Python keywords, built-in functions, and data types by fetching live content from docs.python.org. The extension features smart context detection, configurable caching, and enhanced examples.

## Architecture & Core Components

### Main Extension (`src/extension.ts`)
- **Single-file architecture**: All logic contained in one TypeScript file (~1000 lines)
- **HoverProvider pattern**: Implements `vscode.HoverProvider` interface to intercept hover events
- **Command registration**: Four commands for cache management and special method browsing
- **Configuration-driven**: Uses VS Code workspace settings for all user preferences

### Key Data Structures
- **`MAP` object**: Static mapping of 60+ Python keywords/functions to docs.python.org URLs
- **Cache system**: Uses `context.globalState` with timestamped entries (`pyDocs:v7:${version}:${url}#${anchor}`)
- **Info type**: `{ title: string; url: string; anchor: string }` for documentation metadata

### Context Detection Algorithm (`getContextualInfo()`)
Smart logic that distinguishes between:
- Keywords vs variable names (e.g., `class` keyword vs `obj.class` attribute)
- Type constructors vs type annotations (`str()` vs `name: str`)
- Built-in functions vs user variables (`print` function vs `print = "something"`)

## Development Workflows

### Build & Test
```bash
npm run compile          # TypeScript compilation to out/
npm run watch           # Development mode with auto-recompile
npm run package         # Create .vsix package
```

### Testing Strategy
- **Manual testing**: Use `test_example.py` (comprehensive test file with 60+ keywords)
- **Development Host**: Press F5 in VS Code to launch Extension Development Host
- **No automated tests**: Current setup has placeholder test runner only

### Extension Development
- **Entry point**: `activate()` function registers hover provider and commands
- **Output directory**: Compiled JS goes to `out/` (configured in `tsconfig.json`)
- **Package bundling**: Uses `vsce` (VS Code Extension CLI) for .vsix creation

## Project-Specific Patterns

### Markdown Processing
- **Smart truncation**: `smartTruncateMarkdown()` cuts at natural boundaries (paragraphs, sentences)
- **Fence handling**: Ensures code blocks are properly closed when content is truncated
- **Content limits**: Configurable max length with intelligent cutting logic

### HTTP Documentation Fetching
- **Base URL pattern**: `https://docs.python.org/${version}/${page}#${anchor}`
- **Version support**: Configurable Python version (3, 3.11, 3.12, etc.)
- **Error handling**: Graceful fallbacks when docs.python.org is unreachable
- **No external HTTP libraries**: Uses Node.js built-in `https` module

### Configuration System
All settings under `pythonHover.*` namespace:
- `pythonVersion`: Python docs version ("3", "3.12")
- `cacheDays`: Cache duration (1-365 days)
- `showExamples`: Toggle for enhanced examples
- `maxContentLength`: Content truncation limit
- `includeBuiltins`: Filter for built-in functions
- `contextAware`: Enable/disable smart detection

### Enhanced Examples Pattern
- **Hardcoded examples**: `getEnhancedExamples()` contains 60+ keyword-specific examples
- **Context-aware**: Examples tailored to specific keywords with practical usage
- **Special methods integration**: Dynamic linking to Python data model documentation

## Critical Integration Points

### VS Code Extension APIs
- `vscode.languages.registerHoverProvider()`: Main hover registration
- `vscode.commands.registerCommand()`: Command palette integration
- `vscode.workspace.getConfiguration()`: Settings access
- `context.globalState`: Persistent cache storage
- `vscode.window.showQuickPick()`: Special methods browser UI

### External Dependencies
- **docs.python.org**: Live documentation source (network dependent)
- **No npm dependencies**: Extension uses only VS Code API and Node.js built-ins
- **TypeScript compilation**: Standard tsc workflow, no bundling

## Common Modification Patterns

### Adding New Keywords
1. Add entry to `MAP` object with docs.python.org URL and anchor
2. Add enhanced examples to `getEnhancedExamples()` function
3. Update context detection rules in `getContextualInfo()` if needed
4. Test with `test_example.py`

### Cache Management
- **Cache keys**: Format `pyDocs:v7:${version}:${url}#${anchor}`
- **Versioning**: Change cache version (v7) to invalidate all entries
- **Storage**: Uses VS Code's globalState (persistent across sessions)
- **Cleanup**: Manual via "Clear Documentation Cache" command

### Configuration Changes
1. Update `package.json` contributes.configuration section
2. Access via `vscode.workspace.getConfiguration("pythonHover")`
3. No schema validation - handle defaults in code

## Debugging & Troubleshooting

### Common Issues
- **Network failures**: Extension gracefully handles docs.python.org outages
- **Cache corruption**: Version bump in cache keys forces refresh
- **Context detection**: Check `getContextualInfo()` logic for edge cases
- **Markdown rendering**: Ensure fenced code blocks are properly closed

### Development Tools
- **VS Code Output panel**: Extension logs HTTP requests and cache hits
- **Extension Development Host**: Clean environment for testing
- **Cache statistics**: Built-in command shows cache size and hit rates

This extension follows a simple, monolithic architecture optimized for maintainability and VS Code extension best practices.
