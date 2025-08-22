import * as vscode from 'vscode';
import { getMethodExample } from './features/methodResolver';

export type SpecialMethodEntry = { name: string; kind?: 'object' | 'type'; desc?: string };

const SPECIAL_METHOD_DESCRIPTIONS: Record<string, string> = {
    '__init__': 'Constructor; called to initialize a newly created instance.',
    '__repr__': 'Official string representation used for debugging.',
    '__str__': 'User-friendly string representation.',
    '__len__': 'Return the length of the container.',
    '__iter__': 'Return an iterator over the container.',
    '__contains__': 'Check membership (in operator).',
    '__getitem__': 'Return item indexed by key.',
    '__setitem__': 'Assign item for a key.',
    '__enter__': 'Context manager entry (with).',
    '__exit__': 'Context manager exit (with).',
    '__call__': 'Make an instance callable like a function.',
    '__new__': 'Low-level constructor; allocates instance.',
    '__eq__': 'Equality comparison.',
    '__lt__': 'Less-than comparison.',
    '__getattr__': 'Fallback attribute access.',
    '__getattribute__': 'Primary attribute access implementation.',
    '__setattr__': 'Attribute assignment handler.',
    '__delattr__': 'Attribute deletion handler.'
};

const DEFAULT_SPECIAL_METHODS: SpecialMethodEntry[] = [
    { name: '__init__' }, { name: '__repr__' }, { name: '__str__' }, { name: '__len__' }, { name: '__iter__' }, { name: '__contains__' }, { name: '__getitem__' }, { name: '__setitem__' }, { name: '__delitem__' }, { name: '__enter__' }, { name: '__exit__' }, { name: '__call__' }, { name: '__new__' }, { name: '__del__' }, { name: '__bytes__' }, { name: '__format__' }, { name: '__bool__' }, { name: '__hash__' }
];

/**
 * Enhanced examples with practical code snippets and type hints
 */
const ENHANCED_EXAMPLES: Record<string, string> = {
    // Language constructs
    'class': '```python\n# Basic class definition\nclass Person:\n    def __init__(self, name: str, age: int):\n        self.name = name\n        self.age = age\n    \n    def __repr__(self) -> str:\n        return f"Person(\'{self.name}\', {self.age})"\n    \n    def greet(self) -> str:\n        return f"Hello, I\'m {self.name}"\n\n# Inheritance\nclass Student(Person):\n    def __init__(self, name: str, age: int, student_id: str):\n        super().__init__(name, age)\n        self.student_id = student_id\n\n# Usage\nperson = Person("Alice", 30)\nstudent = Student("Bob", 20, "S123")\n```',

    'def': '```python\n# Function with type hints\ndef calculate_area(length: float, width: float) -> float:\n    """Calculate the area of a rectangle."""\n    return length * width\n\n# Function with default parameters\ndef greet(name: str, greeting: str = "Hello") -> str:\n    return f"{greeting}, {name}!"\n\n# Function with *args and **kwargs\ndef flexible_function(*args, **kwargs):\n    print(f"Args: {args}")\n    print(f"Kwargs: {kwargs}")\n\n# Async function\nasync def fetch_data(url: str) -> dict:\n    # Simulated async operation\n    return {"data": "example"}\n```',

    'import': '```python\n# Basic imports\nimport os\nimport sys\nimport math\n\n# Import with alias\nimport numpy as np\nimport pandas as pd\n\n# Import specific items\nfrom datetime import datetime, timedelta\nfrom collections import defaultdict, Counter\n\n# Import all (use sparingly)\nfrom math import *\n\n# Conditional imports\ntry:\n    import ujson as json\nexcept ImportError:\n    import json\n\n# Relative imports (in packages)\nfrom . import utils\nfrom ..models import User\n```',

    'try': '```python\n# Basic exception handling\ntry:\n    result = 10 / 0\nexcept ZeroDivisionError as e:\n    print(f"Error: {e}")\nexcept Exception as e:\n    print(f"Unexpected error: {e}")\nelse:\n    print("No exceptions occurred")\nfinally:\n    print("Cleanup code")\n\n# Multiple exception types\ntry:\n    data = json.loads(user_input)\n    value = data[\'key\']\nexcept (json.JSONDecodeError, KeyError) as e:\n    print(f"Data processing error: {e}")\n\n# Re-raising exceptions\ntry:\n    risky_operation()\nexcept ValueError:\n    log_error("ValueError occurred")\n    raise  # Re-raise the same exception\n```',

    'with': '```python\n# File handling\nwith open(\'file.txt\', \'r\') as f:\n    content = f.read()\n\n# Multiple context managers\nwith open(\'input.txt\', \'r\') as infile, open(\'output.txt\', \'w\') as outfile:\n    data = infile.read()\n    outfile.write(data.upper())\n\n# Custom context manager\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timer():\n    start = time.time()\n    try:\n        yield\n    finally:\n        print(f"Elapsed: {time.time() - start:.2f}s")\n\nwith timer():\n    time.sleep(1)\n\n# Async context manager\nasync with aiohttp.ClientSession() as session:\n    async with session.get(\'https://api.example.com\') as response:\n        data = await response.json()\n```',

    'for': '```python\n# Iterating over sequences\nfruits = [\'apple\', \'banana\', \'cherry\']\nfor fruit in fruits:\n    print(fruit)\n\n# With enumerate for indices\nfor i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")\n\n# Dictionary iteration\nuser = {\'name\': \'Alice\', \'age\': 30, \'city\': \'New York\'}\nfor key, value in user.items():\n    print(f"{key}: {value}")\n\n# Range iterations\nfor i in range(5):        # 0, 1, 2, 3, 4\n    print(i)\n\nfor i in range(2, 8, 2):  # 2, 4, 6\n    print(i)\n\n# List comprehensions (alternative to loops)\nsquares = [x**2 for x in range(10)]\neven_squares = [x**2 for x in range(10) if x % 2 == 0]\n```',

    'lambda': '```python\n# Basic lambda functions\nsquare = lambda x: x**2\nadd = lambda x, y: x + y\n\n# Using with built-in functions\nnumbers = [1, 2, 3, 4, 5]\nsquared = list(map(lambda x: x**2, numbers))\nevens = list(filter(lambda x: x % 2 == 0, numbers))\n\n# Sorting with lambda\nstudents = [(\'Alice\', 85), (\'Bob\', 90), (\'Charlie\', 78)]\nstudents.sort(key=lambda x: x[1])  # Sort by grade\n\n# Conditional lambda\nmax_val = lambda a, b: a if a > b else b\n```',

    // Built-in functions with enhanced examples
    'print': '```python\n# Basic printing\nprint("Hello, World!")\nprint("Value:", 42)\n\n# Multiple arguments\nprint("Name:", "Alice", "Age:", 30)\n\n# Custom separator and end\nprint("A", "B", "C", sep="-")      # A-B-C\nprint("Loading", end="...")        # Loading...\n\n# Printing to file\nwith open(\'output.txt\', \'w\') as f:\n    print("Data", file=f)\n\n# Formatted printing\nname, age = "Alice", 30\nprint(f"Name: {name}, Age: {age}")\nprint("Name: {}, Age: {}".format(name, age))\nprint("Name: %s, Age: %d" % (name, age))\n```',

    'len': '```python\n# Length of sequences\ntext = "Hello, World!"\nprint(len(text))           # 13\n\nnumbers = [1, 2, 3, 4, 5]\nprint(len(numbers))        # 5\n\ndata = {\'a\': 1, \'b\': 2}\nprint(len(data))           # 2\n\n# Empty collections\nprint(len(""))             # 0\nprint(len([]))             # 0\nprint(len({}))             # 0\n\n# Using in conditionals\nif len(user_input) > 0:\n    process_input(user_input)\n\n# Equivalent to:\nif user_input:  # More Pythonic\n    process_input(user_input)\n```',

    'enumerate': '```python\n# Basic enumeration\nfruits = [\'apple\', \'banana\', \'cherry\']\nfor i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")\n\n# Custom start value\nfor i, fruit in enumerate(fruits, start=1):\n    print(f"{i}: {fruit}")\n\n# Creating index-value pairs\nindexed_fruits = list(enumerate(fruits))\n# [(0, \'apple\'), (1, \'banana\'), (2, \'cherry\')]\n\n# Finding index of matching items\ntext = "hello world"\nfor i, char in enumerate(text):\n    if char == \'o\':\n        print(f"Found \'o\' at index {i}")\n\n# Enumerate with condition\ndata = [\'a\', \'b\', \'c\', \'d\']\nfor i, item in enumerate(data):\n    if i % 2 == 0:  # Even indices\n        print(f"Even index {i}: {item}")\n```',

    'zip': '```python\n# Combining multiple iterables\nnames = [\'Alice\', \'Bob\', \'Charlie\']\nages = [25, 30, 35]\ncities = [\'New York\', \'London\', \'Tokyo\']\n\nfor name, age, city in zip(names, ages, cities):\n    print(f"{name}, {age}, {city}")\n\n# Creating dictionaries\nuser_data = dict(zip(names, ages))\n# {\'Alice\': 25, \'Bob\': 30, \'Charlie\': 35}\n\n# Unzipping (transpose)\npairs = [(1, \'a\'), (2, \'b\'), (3, \'c\')]\nnumbers, letters = zip(*pairs)\n# numbers: (1, 2, 3), letters: (\'a\', \'b\', \'c\')\n\n# Handling different lengths (stops at shortest)\nlist1 = [1, 2, 3, 4]\nlist2 = [\'a\', \'b\']\nresult = list(zip(list1, list2))  # [(1, \'a\'), (2, \'b\')]\n\n# zip_longest for different lengths\nfrom itertools import zip_longest\nresult = list(zip_longest(list1, list2, fillvalue=\'?\'))\n# [(1, \'a\'), (2, \'b\'), (3, \'?\'), (4, \'?\')]\n```'
};

export function getSpecialMethodsIndex(baseUrl: string): { label: string; description: string; url: string }[] {
    const dm = `${baseUrl}/reference/datamodel.html`;
    return DEFAULT_SPECIAL_METHODS.map(e => ({
        label: e.name,
        description: SPECIAL_METHOD_DESCRIPTIONS[e.name] || (e.kind === 'type' ? 'type special method' : 'object special method'),
        url: `${dm}#object.${e.name}`
    }));
}

export function detectImplementedSpecialMethods(doc?: import('vscode').TextDocument, position?: import('vscode').Position): Set<string> {
    const implemented = new Set<string>();
    if (!doc || position === undefined) return implemented;
    try {
        // reuse detection logic similar to buildSpecialMethodsSection
        let startLine = position.line;
        while (startLine >= 0) {
            const text = doc.lineAt(startLine).text;
            if (/^\s*class\s+[A-Za-z_]/.test(text)) break;
            startLine--;
        }
        if (startLine >= 0) {
            const classLineText = doc.lineAt(startLine).text;
            const classIndent = classLineText.match(/^\s*/)?.[0] ?? '';
            const memberIndentPrefix = classIndent + '    ';

            let buffer = '';
            let nestedSkipStack: number[] = [];
            const flushBuffer = () => {
                if (!buffer) return;
                const re = /def\s+(__[A-Za-z0-9_]+__)\s*\(/g;
                let m: RegExpExecArray | null;
                while ((m = re.exec(buffer))) implemented.add(m[1]);
                buffer = '';
            };

            for (let ln = startLine + 1; ln < doc.lineCount; ln++) {
                const lineText = doc.lineAt(ln).text;
                const leading = lineText.match(/^\s*/)?.[0] ?? '';
                if (lineText.trim().length && leading.length <= classIndent.length) break;

                const nestedClassMatch = lineText.match(/^\s*(class)\s+[A-Za-z_]/);
                if (nestedClassMatch && leading.length > classIndent.length) {
                    nestedSkipStack.push(leading.length);
                    continue;
                }
                if (nestedSkipStack.length) {
                    const currentNestedIndent = nestedSkipStack[nestedSkipStack.length - 1];
                    if (leading.length <= currentNestedIndent) nestedSkipStack.pop();
                    else continue;
                }

                if (lineText.startsWith(memberIndentPrefix) || lineText.trim() === '') {
                    const stripped = lineText.startsWith(memberIndentPrefix) ? lineText.slice(memberIndentPrefix.length) : lineText.trim() ? lineText.trim() : '';
                    buffer += stripped + '\n';
                    if (/\bdef\s+(__[A-Za-z0-9_]+__)\s*\(/.test(stripped)) {
                        const nextLine = ln + 1 < doc.lineCount ? doc.lineAt(ln + 1).text : '';
                        const nextLeading = nextLine.match(/^\s*/)?.[0] ?? '';
                        const nextIsContinuation = nextLine.trim().length && (nextLine.trim().startsWith(')') || nextLine.trim().startsWith(',') || nextLeading.length > leading.length);
                        if (!nextIsContinuation) flushBuffer();
                    }
                    continue;
                }
                flushBuffer();
            }
            flushBuffer();
        }
    } catch (e) { }
    return implemented;
}

export function getEnhancedExamples(word: string, baseUrl: string, doc?: vscode.TextDocument, position?: vscode.Position): string {
    const lower = word.toLowerCase();

    // Check for method-specific examples first (from methodResolver)
    if (doc && position) {
        const methodExample = getMethodExample(word);
        if (methodExample) {
            return methodExample;
        }
    }

    // Return enhanced examples if available (language constructs)
    if (ENHANCED_EXAMPLES[lower]) {
        return ENHANCED_EXAMPLES[lower];
    }

    // Check for common examples in fallback
    const commonExamples: Record<string, string> = {
        'upper': '```python\ntext = "hello world"\nresult = text.upper()  # "HELLO WORLD"\nprint(result)\n```',
        'lower': '```python\ntext = "HELLO WORLD"\nresult = text.lower()  # "hello world"\nprint(result)\n```',
        'strip': '```python\ntext = "  hello  "\nresult = text.strip()  # "hello"\nprint(result)\n```',
        'split': '```python\ntext = "apple,banana,cherry"\nresult = text.split(",")  # [\'apple\', \'banana\', \'cherry\']\nprint(result)\n```',
        'join': '```python\nitems = ["apple", "banana", "cherry"]\nresult = ", ".join(items)  # "apple, banana, cherry"\nprint(result)\n```',
        'replace': '```python\ntext = "Hello World"\nresult = text.replace("World", "Python")  # "Hello Python"\nprint(result)\n```',
        'find': '```python\ntext = "Hello World"\nposition = text.find("World")  # 6\nprint(position)\n```',
        'startswith': '```python\ntext = "Hello World"\nresult = text.startswith("Hello")  # True\nprint(result)\n```',
        'endswith': '```python\ntext = "Hello World"\nresult = text.endswith("World")  # True\nprint(result)\n```',
        'append': '```python\nfruits = ["apple", "banana"]\nfruits.append("cherry")\nprint(fruits)  # [\'apple\', \'banana\', \'cherry\']\n```',
        'extend': '```python\nlist1 = [1, 2, 3]\nlist2 = [4, 5]\nlist1.extend(list2)\nprint(list1)  # [1, 2, 3, 4, 5]\n```',
        'insert': '```python\nfruits = ["apple", "cherry"]\nfruits.insert(1, "banana")\nprint(fruits)  # [\'apple\', \'banana\', \'cherry\']\n```',
        'remove': '```python\nfruits = ["apple", "banana", "cherry"]\nfruits.remove("banana")\nprint(fruits)  # [\'apple\', \'cherry\']\n```',
        'pop': '```python\nfruits = ["apple", "banana", "cherry"]\nlast = fruits.pop()  # "cherry"\nfirst = fruits.pop(0)  # "apple"\nprint(fruits)  # [\'banana\']\n```',
        'clear': '```python\nfruits = ["apple", "banana", "cherry"]\nfruits.clear()\nprint(fruits)  # []\n```',
        'copy': '```python\noriginal = [1, 2, 3]\ncopy_list = original.copy()\nprint(copy_list)  # [1, 2, 3]\n```',
        'reverse': '```python\nnumbers = [1, 2, 3, 4, 5]\nnumbers.reverse()\nprint(numbers)  # [5, 4, 3, 2, 1]\n```',
        'sort': '```python\nnumbers = [3, 1, 4, 1, 5]\nnumbers.sort()\nprint(numbers)  # [1, 1, 3, 4, 5]\n```',
        'index': '```python\nfruits = ["apple", "banana", "cherry"]\nposition = fruits.index("banana")  # 1\nprint(position)\n```',
        'count': '```python\nnumbers = [1, 2, 2, 3, 2]\ncount = numbers.count(2)  # 3\nprint(count)\n```',
        'keys': '```python\ndata = {"name": "Alice", "age": 30}\nkeys_list = list(data.keys())  # [\'name\', \'age\']\nprint(keys_list)\n```',
        'values': '```python\ndata = {"name": "Alice", "age": 30}\nvalues_list = list(data.values())  # [\'Alice\', 30]\nprint(values_list)\n```',
        'items': '```python\ndata = {"name": "Alice", "age": 30}\nfor key, value in data.items():\n    print(f"{key}: {value}")\n```',
        'get': '```python\ndata = {"name": "Alice"}\nname = data.get("name", "Unknown")  # "Alice"\nage = data.get("age", 0)  # 0 (default)\nprint(name, age)\n```',
        'setdefault': '```python\ndata = {"name": "Alice"}\nage = data.setdefault("age", 25)  # 25\nprint(data)  # {\'name\': \'Alice\', \'age\': 25}\n```',
        'update': '```python\ndata = {"name": "Alice"}\ndata.update({"age": 30, "city": "NYC"})\nprint(data)  # {\'name\': \'Alice\', \'age\': 30, \'city\': \'NYC\'}\n```',
        'add': '```python\nnumbers = {1, 2, 3}\nnumbers.add(4)\nprint(numbers)  # {1, 2, 3, 4}\n```',
        'discard': '```python\nnumbers = {1, 2, 3, 4}\nnumbers.discard(3)\nprint(numbers)  # {1, 2, 4}\n```',
        'union': '```python\nset1 = {1, 2, 3}\nset2 = {3, 4, 5}\nresult = set1.union(set2)  # {1, 2, 3, 4, 5}\nprint(result)\n```',
        'intersection': '```python\nset1 = {1, 2, 3}\nset2 = {2, 3, 4}\nresult = set1.intersection(set2)  # {2, 3}\nprint(result)\n```',
        'type': '```python\nresult = type("hello")  # <class \'str\'>\nresult = type([1, 2, 3])  # <class \'list\'>\nresult = type(42)  # <class \'int\'>\nprint(result)\n```',
        'dir': '```python\n# List attributes and methods\nresult = dir(str)  # All string methods\nresult = dir([])   # All list methods\nprint(result)\n```',
        'help': '```python\n# Get help documentation\nhelp(print)  # Shows print function documentation\nhelp(str.upper)  # Shows string upper method docs\n```',
        'len': '```python\n# Length of sequences\ntext = "Hello, World!"\nprint(len(text))           # 13\n\nnumbers = [1, 2, 3, 4, 5]\nprint(len(numbers))        # 5\n\ndata = {\'a\': 1, \'b\': 2}\nprint(len(data))           # 2\n```',
        'range': '```python\n# Basic range\nfor i in range(5):  # 0, 1, 2, 3, 4\n    print(i)\n\n# Range with start and stop\nfor i in range(2, 8):  # 2, 3, 4, 5, 6, 7\n    print(i)\n\n# Range with step\nfor i in range(0, 10, 2):  # 0, 2, 4, 6, 8\n    print(i)\n```',
        'enumerate': '```python\n# Basic enumeration\nfruits = [\'apple\', \'banana\', \'cherry\']\nfor i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")\n\n# Custom start value\nfor i, fruit in enumerate(fruits, start=1):\n    print(f"{i}: {fruit}")\n```',
        'zip': '```python\n# Combining multiple iterables\nnames = [\'Alice\', \'Bob\', \'Charlie\']\nages = [25, 30, 35]\n\nfor name, age in zip(names, ages):\n    print(f"{name}: {age}")\n\n# Creating dictionary\nuser_data = dict(zip(names, ages))\nprint(user_data)\n```'
    };

    if (commonExamples[lower]) {
        return commonExamples[lower];
    }

    // Only return documentation link for truly unknown items
    return `See documentation: [${word}](${baseUrl})`;
}

export function buildSpecialMethodsSection(baseUrl: string, doc?: import('vscode').TextDocument, position?: import('vscode').Position): string {
    const dm = `${baseUrl}/reference/datamodel.html`;
    const oc = (name: string) => `[\`${name}\`](${dm}#object.${name})`;
    const lines: string[] = [];
    lines.push(`\n**Special methods (click name to open docs):**`);

    // Detect implementations in the current class
    const implemented = detectImplementedSpecialMethods(doc, position);

    // Common special methods grouped by category
    const categories = [
        {
            title: 'Basic',
            methods: ['__init__', '__repr__', '__str__', '__hash__', '__bool__']
        },
        {
            title: 'Comparison',
            methods: ['__eq__', '__lt__', '__le__', '__gt__', '__ge__', '__ne__']
        },
        {
            title: 'Container',
            methods: ['__len__', '__getitem__', '__setitem__', '__delitem__', '__contains__', '__iter__']
        },
        {
            title: 'Context',
            methods: ['__enter__', '__exit__']
        },
        {
            title: 'Callable',
            methods: ['__call__']
        }
    ];

    for (const category of categories) {
        const categoryMethods = category.methods.filter(method =>
            implemented.has(method) || DEFAULT_SPECIAL_METHODS.some(m => m.name === method)
        );

        if (categoryMethods.length > 0) {
            lines.push(`\n**${category.title}:**`);
            const methodLinks = categoryMethods.map(method => {
                const isImplemented = implemented.has(method);
                const link = oc(method);
                return isImplemented ? `✓ ${link}` : link;
            });
            lines.push(methodLinks.join(' · '));
        }
    }

    return lines.join('\n');
}
