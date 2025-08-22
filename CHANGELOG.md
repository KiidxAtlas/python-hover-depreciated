# Change Log

## [2.4.6] - 2025-08-21

### 🔧 **Critical Bug Fixes & Security**

#### 🐛 **Fixed Issues**
- **Command URI Mismatches**: Fixed broken action links in hover tooltips
- **Global Context Anti-pattern**: Replaced unsafe global access with proper dependency injection
- **Cache Key Management**: Centralized cache operations for better performance
- **Duplicate Registrations**: Cleaned up hover provider registration conflicts

#### 🛡️ **Security Enhancements**
- **Command URI Validation**: Added whitelist-based command sanitization
- **Safe Markdown Handling**: Conditional trust settings with XSS prevention
- **Input Sanitization**: Enhanced validation for all external inputs

#### 📦 **Infrastructure**
- **ESLint Integration**: Added TypeScript linting with automated fixes
- **CI/CD Pipeline**: GitHub Actions for automated testing and quality checks
- **Code Cleanup**: Removed deprecated files and optimized project structure

## [2.4.5] - 2025-08-21

### 🛡️ **Stability & Security Update**

#### ✨ **Enhanced Features**
- **Python 3.10+ Support**: Added `aiter()`, `anext()`, `__import__()` functions
- **Extended String Methods**: Added `isascii()`, `isprintable()`, `isidentifier()`, `isnumeric()`, `isdecimal()`
- **Additional Exceptions**: Added `ImportError`, `AttributeError`, `NameError`, `RuntimeError`, `NotImplementedError`, `FileNotFoundError`, `PermissionError`

#### 🔧 **Reliability Improvements**
- **Enhanced Error Handling**: More robust type resolution with comprehensive error boundaries
- **Configuration Validation**: Input sanitization and range validation for all settings
- **Memory Management**: Cache size monitoring with automatic eviction when limits exceeded

#### ⚡ **Performance Optimizations**
- **Regex Caching**: Compiled regex patterns cached for better performance
- **Memory Efficiency**: Smart memory usage tracking and optimization

#### 🛡️ **Security Enhancements**
- **URL Validation**: HTTPS-only requests to trusted Python documentation domains
- **Rate Limiting**: Protection against API abuse (100 requests/minute)
- **Input Sanitization**: Protection against ReDoS attacks and malicious input

#### 🧪 **Testing & Quality**
- **Expanded Test Coverage**: New test suite covering edge cases and security scenarios
- **Type Safety**: Improved TypeScript type checking and error prevention

## [2.4.0] - 2025-08-21

### 🚀 MAJOR UPDATE: Comprehensive Python Development Assistant

#### ✨ **Enhanced Coverage (300+ Items)**
- **70+ Built-in Functions**: Complete coverage including `type()`, `dir()`, `help()`, `locals()`, `globals()`, `breakpoint()`, etc.
- **42+ String Methods**: All essential string operations with practical examples
- **9 List Methods**: Complete list manipulation support
- **8 Dictionary Methods**: Full dict operation coverage
- **12 Set Methods**: Comprehensive set operations
- **Language Constructs**: Enhanced examples for `class`, `def`, `try`, `with`, `for`, `lambda`, etc.

#### 🧠 **Smart Method Resolution**
- **Context-Aware Detection**: Recognizes `text.upper()` as string method after `text = "hello"`
- **Type Inference**: Automatically detects variable types from assignments
- **Enhanced Method Examples**: Type-specific usage patterns and examples

#### 📥 **Import Statement Support**
- **40+ Standard Library Modules**: `os`, `sys`, `math`, `datetime`, `json`, `asyncio`, etc.
- **Module Documentation**: Hover over `import os` shows module information
- **Import Patterns**: Support for both `import module` and `from module import item`

#### 🎯 **Enhanced Code Examples**
- **Type Hints**: Modern Python patterns with annotations throughout
- **Practical Examples**: Real, copyable code snippets with expected output
- **Best Practices**: Demonstrates idiomatic Python usage
- **Context-Specific**: Examples adapt to detected usage patterns

#### ⚙️ **Advanced Configuration**
- **8 New Settings**: Fine-grained control over features
- **Method Categories**: Enable/disable string, list, dict, set methods individually
- **Example Styles**: Toggle between practical and basic examples
- **Performance Options**: Control method resolution and caching

#### 🔧 **Technical Improvements**
- **Modular Architecture**: Separated method resolution, type inference, and examples
- **Performance Optimized**: Intelligent caching and debouncing
- **Error Handling**: Graceful fallbacks and comprehensive error boundaries
- **Backward Compatible**: All existing functionality preserved

### 📊 **Impact**
- **300%+ More Coverage**: From ~50 to 150+ documented constructs
- **Smart Context Awareness**: Methods recognized based on variable types
- **Modern Development Patterns**: Type hints and best practices throughout
- **Comprehensive Import Help**: Standard library module assistance
- **Enhanced Developer Experience**: Practical, copyable examples

---

## [2.2.1] - 2025-08-18

### 🎯 NEW: Comprehensive Builtin Functions & Dunder Methods Support

- **70+ Builtin Functions**: Complete coverage of Python builtin functions with rich documentation
  - Core functions: `print()`, `len()`, `range()`, `enumerate()`, `zip()`, `map()`, `filter()`, etc.
  - Type inspection: `isinstance()`, `type()`, `hasattr()`, `getattr()`, `super()`, etc.
  - Conversion functions: `str()`, `int()`, `repr()`, `bin()`, `hex()`, `ord()`, `chr()`, etc.
  - Mathematical: `abs()`, `round()`, `pow()`, `divmod()`, `sum()`, `max()`, `min()`, etc.

- **80+ Dunder Methods**: Complete special method documentation with context awareness
  - Object lifecycle: `__init__()`, `__new__()`, `__del__()`
  - String representation: `__str__()`, `__repr__()`, `__format__()`
  - Comparison operations: `__eq__()`, `__lt__()`, `__gt__()`, etc.
  - Container protocol: `__len__()`, `__getitem__()`, `__setitem__()`, `__contains__()`
  - Iterator protocol: `__iter__()`, `__next__()`
  - Arithmetic operations: `__add__()`, `__sub__()`, `__mul__()`, etc.
  - Context managers: `__enter__()`, `__exit__()`
  - And many more...

- **Smart Context-Aware Detection**:
  - Enhanced dunder method docs show class context: `__init__() — Constructor for MyClass`
  - Builtin functions adapt to usage: `len() — Get length of sequence/collection`
  - Data types show different docs based on context (constructor vs type annotation vs inheritance)

### 📚 Documentation Coverage Enhancement

- **150+ Items**: From ~30 keywords to 150+ documented Python constructs
- **Complete Coverage**: Keywords, builtins, data types, dunder methods, exceptions
- **Context Awareness**: Documentation adapts based on code context and usage patterns
- **Professional Quality**: Rich, detailed documentation sourced from official Python docs

## [2.2.0] - 2025-08-18

### 🚀 Foundation: Major Enhancements

- **Enhanced Caching System**: Implemented LRU cache with disk persistence and TTL support
- **Network Retry Logic**: Added exponential backoff HTTP client with smart error handling
- **Progress Indicators**: Visual feedback for long-running documentation fetching operations
- **Smart Suggestions**: Context-aware documentation recommendations based on imports and code patterns
- **Comprehensive Testing**: Added 29+ unit tests covering type resolution, inventory, and context analysis
- **JSDoc Documentation**: Complete API documentation for all core modules

### 🛠️ Performance Improvements

- **Cache Warming**: Automatic preloading of frequently used Python keywords
- **Disk Persistence**: Cache survives VS Code restarts, reducing network requests
- **Memory Management**: Configurable LRU cache with automatic cleanup
- **Network Resilience**: Retry logic handles intermittent network failures gracefully

### 🧪 Testing & Quality

- **Unit Test Suite**: Comprehensive tests for typeResolver, inventory, and context modules
- **Test Coverage**: 29+ test cases covering core functionality
- **Error Handling**: Robust error boundaries and graceful degradation
- **TypeScript Quality**: Full type safety and proper module exports

### 🔧 Technical Improvements

- **Modular Architecture**: Clean separation of concerns across utility modules
- **Enhanced HTTP Client**: Configurable timeouts, retry logic, and error classification
- **Progress Management**: Centralized progress tracking with status bar integration
- **Smart Context Analysis**: Improved detection of Python patterns and suggestions

### 📚 Documentation Coverage

- **150+ Items**: From ~30 keywords to 150+ documented Python constructs
- **Complete Coverage**: Keywords, builtins, data types, dunder methods, exceptions
- **Context Awareness**: Documentation adapts based on code context and usage patterns
- **Professional Quality**: Rich, detailed documentation sourced from official Python docs

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
