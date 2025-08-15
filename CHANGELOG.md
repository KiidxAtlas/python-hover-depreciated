# Change Log

## [2.0.0] - 2025-08-15

### ✨ Major Enhancements
- **Expanded Keyword Coverage**: Added 40+ new keywords including built-in functions, data types, and constants
- **Context-Aware Detection**: Smart detection that distinguishes between keywords, functions, and variable names
- **Enhanced Examples**: Comprehensive, practical code examples for better learning
- **Advanced Configuration**: 6 new settings for complete customization

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
