# Python Hover Enhanced

🚀 **Comprehensive Python development assistant with 300+ built-ins, methods, type hints, and smart context awareness**

Get rich, contextual documentation for Python with practical examples, import support, and intelligent method resolution - directly in your editor.

## ✨ Major Features

### 🎯 **Comprehensive Coverage (300+ Items)**
- **70+ Built-in Functions**: `type()`, `dir()`, `help()`, `locals()`, `globals()`, `breakpoint()`, etc.
- **42+ String Methods**: All essential string operations with practical examples
- **9 List Methods**: Complete list manipulation support (`append()`, `extend()`, `pop()`, etc.)
- **8 Dictionary Methods**: Full dict operations (`keys()`, `values()`, `get()`, etc.)
- **12 Set Methods**: Complete set operations (`union()`, `intersection()`, `add()`, etc.)
- **Language Constructs**: Enhanced examples for `class`, `def`, `try`, `with`, `for`, `lambda`

### 🧠 **Smart Method Resolution**
- **Context-Aware Detection**: Recognizes `text.upper()` as string method after `text = "hello"`
- **Type Inference**: Automatically detects variable types from assignments
- **Enhanced Examples**: Type-specific usage patterns with expected output

### 📥 **Import Statement Support**
- **40+ Standard Library Modules**: `os`, `sys`, `math`, `datetime`, `json`, `asyncio`, etc.
- **Module Documentation**: Hover over `import os` shows module information
- **Import Patterns**: Support for both `import module` and `from module import item`

### 🎯 **Enhanced Code Examples**
- **Type Hints**: Modern Python patterns with annotations throughout
- **Practical Examples**: Real, copyable code snippets with expected output
- **Best Practices**: Demonstrates idiomatic Python usage
- **Context-Specific**: Examples adapt to detected usage patterns

### ⚙️ **Advanced Configuration**
- **8 New Settings**: Fine-grained control over method categories and examples
- **Performance Options**: Control method resolution, caching, and content length
- **Customizable Experience**: Enable/disable features based on your workflow

## 📚 **What's Covered**

### **Language Constructs**
`class`, `def`, `return`, `with`, `yield`, `async`, `await`, `import`, `from`, `try`, `if`, `for`, `while`, `except`, `finally`, `else`, `elif`, `break`, `continue`, `pass`, `lambda`, `global`, `nonlocal`, `raise`, `assert`, `del`, `match`, `case`

### **Built-in Functions (70+)**
`print`, `len`, `range`, `enumerate`, `zip`, `map`, `filter`, `sorted`, `reversed`, `sum`, `max`, `min`, `abs`, `round`, `type`, `dir`, `help`, `input`, `eval`, `exec`, `compile`, `hash`, `hex`, `oct`, `bin`, `ord`, `chr`, `ascii`, `repr`, `format`, `divmod`, `callable`, `super`, `staticmethod`, `classmethod`, `property`, and many more...

### **String Methods (42+)**
`strip`, `split`, `join`, `replace`, `find`, `upper`, `lower`, `startswith`, `endswith`, `capitalize`, `title`, `isdigit`, `isalpha`, `count`, `encode`, `center`, `ljust`, `rjust`, `zfill`, and more...

### **Collection Methods**
- **List**: `append`, `extend`, `insert`, `remove`, `pop`, `clear`, `copy`, `reverse`, `sort`
- **Dict**: `keys`, `values`, `items`, `get`, `setdefault`, `update`, `popitem`, `fromkeys`
- **Set**: `add`, `discard`, `union`, `intersection`, `difference`, `symmetric_difference`, etc.

### **Data Types**
`str`, `int`, `float`, `bool`, `list`, `dict`, `set`, `tuple`, `bytes`, `bytearray`, `complex`

### **Standard Library Modules**
`os`, `sys`, `math`, `random`, `datetime`, `json`, `re`, `asyncio`, `pathlib`, `typing`, `collections`, `itertools`, `csv`, `sqlite3`, `threading`, and more...

## ⚙️ **Configuration**

Access settings via **File > Preferences > Settings** and search for "Python Hover":

### **Enhanced Settings**
```json
{
  // Core settings
  "pythonHover.pythonVersion": "3",      // Python docs version
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
