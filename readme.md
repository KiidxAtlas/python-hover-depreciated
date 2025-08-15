# Python Hover Enhanced

🚀 **Comprehensive hover documentation for Python with live content from docs.python.org**

Get rich, contextual documentation for Python keywords, built-in functions, data types, and more - directly in your editor with enhanced examples and smart detection.

## ✨ Features

### 🎯 **Core Functionality**
- **Live Documentation**: Fetches current documentation directly from docs.python.org
- **Rich Content**: Includes syntax, examples, and practical usage patterns
- **Smart Caching**: Configurable caching (1-365 days) for fast subsequent hovers
- **Working Links**: Internal documentation links work correctly within hover tooltips
- **Version Support**: Choose your Python version (3, 3.11, 3.12, etc.)

### 🧠 **Enhanced Intelligence**
- **Context-Aware Detection**: Distinguishes between keywords, functions, and variable names
- **Built-in Function Support**: Comprehensive coverage of Python built-ins
- **Data Type Documentation**: Hover over `str`, `int`, `list`, etc. for type information
- **Smart Examples**: Practical code examples tailored to each keyword
- **Configurable Content**: Control what appears in your hovers

### 🔧 **Advanced Features**
- **Cache Management**: View statistics, refresh content, clear cache
- **Content Control**: Adjust maximum content length and toggle examples
- **Selective Coverage**: Enable/disable built-ins separately from keywords
- **Error Handling**: Graceful fallbacks when documentation is unavailable

## 📚 **Supported Keywords & Functions**

### **Control Flow**
`class`, `def`, `return`, `with`, `yield`, `async`, `await`, `import`, `from`, `try`, `if`, `for`, `while`, `except`, `finally`, `else`, `elif`, `break`, `continue`, `pass`, `lambda`, `global`, `nonlocal`, `raise`, `assert`, `del`, `match`, `case`

### **Built-in Functions**
`print`, `len`, `range`, `enumerate`, `zip`, `map`, `filter`, `sorted`, `reversed`, `sum`, `max`, `min`, `abs`, `round`

### **Data Types**
`str`, `int`, `float`, `bool`, `list`, `dict`, `set`, `tuple`

### **Constants**
`None`, `True`, `False`

## ⚙️ **Configuration**

Access settings via **File > Preferences > Settings** and search for "Python Hover":

### **Core Settings**
```json
{
  "pythonHover.pythonVersion": "3",      // Python docs version ("3", "3.12", etc.)
  "pythonHover.cacheDays": 7             // Cache duration (1-365 days)
}
```

### **Content Control**
```json
{
  "pythonHover.showExamples": true,      // Include practical examples
  "pythonHover.maxContentLength": 1500,  // Max characters in hover
  "pythonHover.includeBuiltins": true,   // Show built-in function docs
  "pythonHover.contextAware": true       // Smart context detection
}
```

## 🎮 **Commands**

Access via **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Python Hover: Clear Documentation Cache** - Remove all cached content
- **Python Hover: Refresh Current Hover Content** - Update docs for keyword at cursor
- **Python Hover: Show Cache Statistics** - View cache size and statistics

## 🚀 **Usage**

### **Basic Usage**
1. Open any Python file
2. Hover over supported keywords, functions, or types
3. See rich documentation with examples and links

### **Advanced Usage**
- **Context Awareness**: The extension intelligently detects when you're hovering over actual keywords vs variable names
- **Type Information**: Hover over data types like `str()` or `list()` to see constructor and method information
- **Built-in Functions**: Get comprehensive documentation for functions like `enumerate()`, `zip()`, `map()`
- **Smart Examples**: See practical, real-world examples tailored to each keyword

## 🔄 **What's New in Enhanced Version**

### **🎯 Expanded Coverage**
- **60+ Keywords & Functions**: Added built-ins, data types, constants, and Python 3.10+ features
- **Pattern Matching**: Support for `match`/`case` statements
- **Exception Handling**: Enhanced coverage for `raise`, `assert`, and error handling

### **🧠 Smart Detection**
- **Context Analysis**: Distinguishes `str` the type from `str` the variable
- **Async Context**: Detects when `await` is used outside async functions
- **Attribute vs Keyword**: Won't show documentation for `obj.class` attribute access

### **⚡ Performance & UX**
- **Configurable Content**: Control examples, max length, and content types
- **Better Caching**: Smarter cache management with statistics
- **Error Handling**: Less intrusive error messages
- **Content Optimization**: Tailored examples for better learning

## 🛠️ **Development**

### **Setup**
```bash
git clone https://github.com/KiidxAtlas/python-hover.git
cd python-hover
npm install
npm run compile
```

### **Testing**
- Press **F5** in VS Code to launch Extension Development Host
- Open `test_example.py` for comprehensive testing
- Test various keywords, built-ins, and edge cases

### **Build & Package**
```bash
npm run package  # Creates .vsix file
```

## 📈 **Performance**

- **Fast**: Cached responses for instant subsequent hovers
- **Efficient**: Only fetches content when needed
- **Lightweight**: No external dependencies
- **Smart**: Context-aware detection reduces unnecessary requests

## 🤝 **Contributing**

### **Adding Keywords**
1. Update the `MAP` object in `src/extension.ts`
2. Add examples to `getEnhancedExamples()`
3. Test with the provided test file

### **Improving Detection**
1. Modify `getContextualInfo()` function
2. Add context rules for better accuracy
3. Test edge cases

## 📄 **License**

MIT - see [LICENSE](LICENSE) file

---

**Enjoy enhanced Python development with comprehensive, contextual documentation! 🐍✨**
