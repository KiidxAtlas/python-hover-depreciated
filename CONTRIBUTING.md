# Contributing to Python Hover

Thank you for your interest in contributing to Python Hover! This document provides guidelines for contributing to this VS Code extension.

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/KiidxAtlas/python-hover.git
   cd python-hover
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Test the extension**
   - Open VS Code in the project directory
   - Press `F5` to launch Extension Development Host
   - Open a Python file in the new VS Code window
   - Hover over Python keywords like `class`, `def`, `try`, etc.

### Project Structure

```
├── src/
│   ├── extension.ts          # Main extension logic
│   └── test/                 # Test files (future)
├── package.json              # Extension manifest and dependencies
├── tsconfig.json            # TypeScript configuration
├── test_example.py          # Example Python file for testing
└── README.md                # Documentation
```

## How to Contribute

### Adding New Keywords

To add support for more Python keywords:

1. **Update the keyword map** in `src/extension.ts`:
   ```typescript
   const MAP: Record<string, Info> = {
     // Existing keywords...
     new_keyword: {
       title: "new_keyword — Description",
       url: "reference/page.html",
       anchor: "anchor-name"
     }
   };
   ```

2. **Find the correct URL and anchor**:
   - Browse [Python documentation](https://docs.python.org/3/)
   - Find the relevant page (e.g., `reference/compound_stmts.html`)
   - Locate the anchor for the specific section (e.g., `#the-while-statement`)

3. **Test your changes**:
   - Compile: `npm run compile`
   - Launch Extension Development Host (`F5`)
   - Test hovering over the new keyword

### Improving Documentation Parsing

The extension fetches and parses HTML from docs.python.org. To improve parsing:

1. **Modify the `getSectionMarkdown` function** for better content extraction
2. **Update `htmlToMarkdown` function** for better HTML-to-Markdown conversion
3. **Test with various Python documentation pages**

### Bug Reports

When reporting bugs, please include:
- VS Code version
- Extension version
- Python file content that reproduces the issue
- Expected vs. actual behavior
- Console output (if any errors)

### Feature Requests

For new features, please:
1. Check existing issues first
2. Describe the use case clearly
3. Provide examples if applicable
4. Consider implementation complexity

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add comments for complex logic
- Use meaningful variable names
- Handle errors gracefully

## Testing

Currently, the extension has a basic test structure. To run tests:
```bash
npm run compile
```

Future improvements welcome:
- Add unit tests for parsing functions
- Add integration tests for hover functionality
- Test with different Python versions

## Release Process

1. Update `CHANGELOG.md`
2. Update version in `package.json`
3. Test thoroughly
4. Build: `npm run package`
5. Publish: `npm run publish`

## Useful Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Python Documentation](https://docs.python.org/3/)
- [Markdown Spec](https://spec.commonmark.org/)

## Questions?

Feel free to open an issue for questions about contributing or development setup.
