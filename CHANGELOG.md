# Change Log

## [2.1.4] - 2025-08-17

### Improvements

- DOM-first extraction and markdown pipeline refinements (noise filtering, grammar fenced and moved to end, heading normalization, repaired/truncated links).
- Related links enrichment for common cross-references (decorators, context managers, exceptions, raise, scope/global/nonlocal).
- Action links in hover now include “Copy URL” and respect openTarget for Simple Browser vs external.
- Clear cache now also clears in-memory session caches.
- Locale/version-aware docs URL building via getDocsBaseUrl().

### Cleanup

- Removed unused debug/test scripts and old placeholder modules.
- Tightened packaging ignore rules; source is included correctly in VSIX.

### New Commands

- Python Hover: Copy Docs URL
- Python Hover: Toggle Type-Aware Hovers

## [2.0.2] - 2025-08-15

### 🐛 Bug Fixes

- **Fixed Clickable Links**: Documentation links now properly open in browser instead of showing encoded URLs
- **Enhanced Class Detection**: Improved class method detection with broader search range (50 lines) and better pattern matching
- **Dynamic Class Analysis**: Fixed issue where special methods weren't being detected in actual classes

### 🚀 Improvements

- More robust decorator detection for `@classmethod`, `@staticmethod`, and `@property`
- Better handling of class boundaries and indentation
- Fallback to examples when no methods are found in a class

## [2.0.0] - 2025-08-15

### ✨ Major Enhancements

- **Expanded Keyword Coverage**: Added 40+ new keywords including built-in functions, data types, and constants
- **Context-Aware Detection**: Smart detection that distinguishes between keywords, functions, and variable names
- **Enhanced Examples**: Comprehensive, practical code examples for better learning
- **Advanced Configuration**: 6 new settings for complete customization
- **🔗 Fixed Clickable Links**: Documentation links are now properly clickable in hover tooltips
- **🏗️ Dynamic Class Analysis**: When hovering over 'class', shows actual methods from the class including special methods like `__init__`, `__str__`, etc.

### 🆕 New Keywords & Functions

- **Built-in Functions**: `print`, `len`, `range`, `enumerate`, `zip`, `map`, `filter`, `sorted`, `reversed`, `sum`, `max`, `min`, `abs`, `round`
- **Data Types**: `str`, `int`, `float`, `bool`, `list`, `dict`, `set`, `tuple`
- **Constants**: `None`, `True`, `False`
- **Control Flow**: `raise`, `assert`, `del`, `match`, `case` (Python 3.10+), `from`

### 🧠 Smart Features

- **Context Analysis**: Won't show docs for `obj.class` attribute access
- **Async Context Detection**: Identifies when `await` is used outside async functions
- **Type vs Constructor**: Distinguishes between `str` as type annotation vs `str()` function call

### ⚙️ New Settings

- `pythonHover.showExamples` - Toggle practical examples
- `pythonHover.maxContentLength` - Control hover content length
- `pythonHover.includeBuiltins` - Enable/disable built-in function documentation
- `pythonHover.contextAware` - Toggle smart context detection

### 🎮 New Commands

- **Refresh Current Hover Content** - Update docs for keyword at cursor position
- **Show Cache Statistics** - View cache size, expired entries, and memory usage

### 🚀 Performance Improvements

- **Better Error Handling**: Less intrusive error messages
- **Optimized Content**: Improved content extraction and formatting
- **Smart Caching**: Enhanced cache management with statistics
- **Faster Detection**: More efficient context analysis

### 🛠️ Developer Experience

- **Enhanced Test File**: Comprehensive `test_example.py` with 200+ lines of test cases
- **Better Documentation**: Updated README with detailed feature explanations
- **Improved Code Structure**: Cleaner, more maintainable codebase

## [1.0.0] - 2024-XX-XX

### Initial Release

- **Live Documentation**: Fetch current docs from docs.python.org
- **Smart Caching**: 7-day default cache with configurable duration
- **Core Keywords**: Support for essential Python keywords (`class`, `def`, `try`, etc.)
- **Rich Content**: HTML-to-Markdown conversion with working links
- **Version Support**: Configurable Python documentation version
- **Cache Management**: Clear cache command

All notable changes to the "Python Hover" extension will be documented in this file.

## [1.0.0] - 2025-08-15

### Added

- Initial release of Python Hover extension
- Rich hover documentation for Python keywords
- Live documentation fetching from docs.python.org
- Smart caching system with configurable duration
- Support for working internal documentation links
- Comprehensive examples for common keywords (class, def, try, import)
- Command to clear documentation cache
- Support for multiple Python versions (3, 3.11, 3.12, etc.)

### Features

- Supports 23+ Python keywords including: class, def, return, with, yield, async, await, import, try, if, for, while, except, finally, else, elif, break, continue, pass, lambda, global, nonlocal
- Zero external dependencies
- Works alongside existing Python extensions like Pylance
- Configurable cache duration (1-365 days)
- Clean, markdown-formatted hover tooltips
- Direct links to official Python documentation
