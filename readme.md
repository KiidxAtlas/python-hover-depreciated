# 🐍 Python Hover - Enhanced Documentation Assistant

> **Instant Python documentation at your fingertips**
> Get comprehensive examples, type hints, and practical code snippets without leaving your editor.

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/KiidxAtlas.python-hover)](https://marketplace.visualstudio.com/items?itemName=KiidxAtlas.python-hover)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/KiidxAtlas.python-hover)](https://marketplace.visualstudio.com/items?itemName=KiidxAtlas.python-hover)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/KiidxAtlas.python-hover)](https://marketplace.visualstudio.com/items?itemName=KiidxAtlas.python-hover)

## ✨ **What Makes This Special**

🚀 **300+ Python Constructs** - Complete coverage of built-ins, methods, and language features
🎯 **Smart Context Detection** - Knows when you're working with strings, lists, dicts, or sets
💡 **Practical Examples** - Real, copyable code with expected outputs
� **Import Intelligence** - Hover support for 40+ standard library modules
⚙️ **Fully Customizable** - 9 configuration options to match your workflow

## 🎥 **See It In Action**

### **String Methods with Smart Context**

```python
text = "hello world"
text.upper()  # Hover shows: "HELLO WORLD" with practical examples
```

### **Enhanced Language Constructs**

```python
class Person:  # Hover shows modern class examples with type hints
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age
```

### **Import Statement Intelligence**

```python
import os  # Hover shows comprehensive OS module documentation
from datetime import datetime  # Hover shows datetime-specific info
```

## 🚀 **Quick Start**

1. **Install** the extension from the VS Code marketplace
2. **Open** any Python file
3. **Hover** over any Python keyword, function, or method
4. **Get instant** documentation with practical examples!

## 🛠 **Perfect For**

- 🆕 **Python Beginners** - Learn by example with comprehensive documentation
- 👨‍� **Experienced Developers** - Quick reference without context switching
- 🏫 **Educators** - Teaching tool with practical, modern Python examples
- 🔄 **Code Reviewers** - Understand unfamiliar methods instantly

## 📊 **Comprehensive Coverage**

### **Built-in Functions (70+)**

`type`, `len`, `dir`, `help`, `enumerate`, `zip`, `map`, `filter`, `sorted`, `reversed`, `sum`, `max`, `min`, `abs`, `round`, `input`, `eval`, `compile`, `hash`, `hex`, `oct`, `bin`, `ord`, `chr`, `ascii`, `repr`, `format`, `divmod`, `callable`, `super`, `locals`, `globals`, `breakpoint`, and many more...

### **String Methods (42+)**

`strip`, `split`, `join`, `replace`, `find`, `upper`, `lower`, `startswith`, `endswith`, `capitalize`, `title`, `isdigit`, `isalpha`, `count`, `encode`, `center`, `ljust`, `rjust`, `zfill`, `removeprefix`, `removesuffix`, and more...

### **Collection Methods**

- **List (9)**: `append`, `extend`, `insert`, `remove`, `pop`, `clear`, `copy`, `reverse`, `sort`
- **Dict (8)**: `keys`, `values`, `items`, `get`, `setdefault`, `update`, `popitem`, `fromkeys`
- **Set (12)**: `add`, `discard`, `union`, `intersection`, `difference`, `symmetric_difference`, and more...

### **Language Constructs**

`class`, `def`, `try`, `with`, `for`, `while`, `if`, `import`, `lambda`, `async`, `await`, `yield`, `return`, `break`, `continue`, `pass`, `raise`, `assert`, `match`, `case`

### **Standard Library Modules (40+)**

`os`, `sys`, `math`, `random`, `datetime`, `json`, `re`, `asyncio`, `pathlib`, `typing`, `collections`, `itertools`, `csv`, `sqlite3`, `threading`, `multiprocessing`, and more...

## ⚙️ **Customization Options**

```json
{
  "pythonHover.includeStringMethods": true,
  "pythonHover.includeListMethods": true,
  "pythonHover.includeDictMethods": true,
  "pythonHover.includeSetMethods": true,
  "pythonHover.includeModuleInfo": true,
  "pythonHover.showSignatures": true,
  "pythonHover.enhancedMethodResolution": true,
  "pythonHover.showPracticalExamples": true,
  "pythonHover.compactDisplay": true
}
```

## 🎯 **What Users Say**

> ⭐⭐⭐⭐⭐ *"Perfect for learning Python! The examples are exactly what I need."*

## 🔄 **Recent Updates (v2.4.1)**

- 🆕 **Smart Method Resolution** - Context-aware detection recognizes variable types
- 🆕 **Import Statement Support** - Hover documentation for standard library modules
- 🆕 **Enhanced Examples** - Modern Python patterns with type hints throughout
- 🆕 **9 Configuration Options** - Fine-grained control over features
- 🚀 **300% Coverage Increase** - From ~50 to 300+ documented constructs

## 🧠 **How It Works**

### **Context-Aware Intelligence**

```python
# The extension recognizes context:
my_string = "hello"
my_string.upper()    # ← Knows this is a string method

my_list = [1, 2, 3]
my_list.append(4)    # ← Knows this is a list method

my_dict = {"key": "value"}
my_dict.get("key")   # ← Knows this is a dict method
```

### **Enhanced Examples with Output**

```python
# Every example shows expected results:
text = "hello world"
result = text.upper()  # "HELLO WORLD"
print(result)
```

### **Modern Python Patterns**

```python
# Examples include type hints and best practices:
def calculate_area(length: float, width: float) -> float:
    """Calculate the area of a rectangle."""
    return length * width
```

## 🤝 **Contributing**

Found a missing method or have a suggestion? We'd love your input!

- 🐛 **Report Issues**: [GitHub Issues](https://github.com/KiidxAtlas/python-hover/issues)
- 💡 **Feature Requests**: Share your ideas for new functionality
- 📖 **Documentation**: Help improve examples and explanations

## 📈 **Stats**

- ✅ **5-star rating** from users
- ✅ **300+ Python constructs** covered
- ✅ **40+ standard library modules** supported
- ✅ **9 customization options** available

---

## 💝 **Made for the Python Community**

*Transform your Python development experience with intelligent hover documentation that adapts to your code.*
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
