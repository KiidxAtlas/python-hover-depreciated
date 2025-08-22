import * as vscode from 'vscode';
import { Info } from '../types';

/**
 * Enhanced method resolver for built-in Python methods
 * Handles method calls on built-in types with better context awareness
 */

// Mapping of method names to their built-in type anchors
const METHOD_TO_TYPE_MAP: Record<string, { types: string[]; anchor: string; title: string }> = {
    // String methods
    'strip': { types: ['str'], anchor: 'str.strip', title: 'str.strip() — Remove Whitespace' },
    'split': { types: ['str'], anchor: 'str.split', title: 'str.split() — Split String' },
    'join': { types: ['str'], anchor: 'str.join', title: 'str.join() — Join Iterable' },
    'replace': { types: ['str'], anchor: 'str.replace', title: 'str.replace() — Replace Substring' },
    'find': { types: ['str'], anchor: 'str.find', title: 'str.find() — Find Substring' },
    'startswith': { types: ['str'], anchor: 'str.startswith', title: 'str.startswith() — Check Prefix' },
    'endswith': { types: ['str'], anchor: 'str.endswith', title: 'str.endswith() — Check Suffix' },
    'upper': { types: ['str'], anchor: 'str.upper', title: 'str.upper() — Uppercase' },
    'lower': { types: ['str'], anchor: 'str.lower', title: 'str.lower() — Lowercase' },
    'capitalize': { types: ['str'], anchor: 'str.capitalize', title: 'str.capitalize() — Capitalize First' },
    'title': { types: ['str'], anchor: 'str.title', title: 'str.title() — Title Case' },
    'isdigit': { types: ['str'], anchor: 'str.isdigit', title: 'str.isdigit() — Check Digits' },
    'isalpha': { types: ['str'], anchor: 'str.isalpha', title: 'str.isalpha() — Check Letters' },
    'isalnum': { types: ['str'], anchor: 'str.isalnum', title: 'str.isalnum() — Check Alphanumeric' },
    'count': { types: ['str', 'list'], anchor: 'str.count', title: 'count() — Count Occurrences' },
    'format': { types: ['str'], anchor: 'str.format', title: 'str.format() — Format String' },

    // List methods
    'append': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.append() — Add Item' },
    'extend': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.extend() — Extend List' },
    'insert': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.insert() — Insert Item' },
    'remove': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.remove() — Remove Item' },
    'pop': { types: ['list', 'dict'], anchor: 'mutable-sequence-types', title: 'pop() — Remove & Return' },
    'clear': { types: ['list', 'dict', 'set'], anchor: 'mutable-sequence-types', title: 'clear() — Remove All Items' },
    'copy': { types: ['list', 'dict', 'set'], anchor: 'mutable-sequence-types', title: 'copy() — Shallow Copy' },
    'reverse': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.reverse() — Reverse In Place' },
    'sort': { types: ['list'], anchor: 'mutable-sequence-types', title: 'list.sort() — Sort In Place' },
    'index': { types: ['list', 'tuple', 'str'], anchor: 'str.index', title: 'index() — Index of Item' },

    // Dictionary methods
    'keys': { types: ['dict'], anchor: 'dict.keys', title: 'dict.keys() — Dictionary Keys' },
    'values': { types: ['dict'], anchor: 'dict.values', title: 'dict.values() — Dictionary Values' },
    'items': { types: ['dict'], anchor: 'dict.items', title: 'dict.items() — Dictionary Items' },
    'get': { types: ['dict'], anchor: 'dict.get', title: 'dict.get() — Get Value' },
    'setdefault': { types: ['dict'], anchor: 'dict.setdefault', title: 'dict.setdefault() — Get or Set Default' },
    'update': { types: ['dict'], anchor: 'dict.update', title: 'dict.update() — Update Dictionary' },
    'popitem': { types: ['dict'], anchor: 'dict.popitem', title: 'dict.popitem() — Remove & Return Item' },
    'fromkeys': { types: ['dict'], anchor: 'dict.fromkeys', title: 'dict.fromkeys() — Create from Keys' },

    // Set methods
    'add': { types: ['set'], anchor: 'frozenset.add', title: 'set.add() — Add Element' },
    'discard': { types: ['set'], anchor: 'frozenset.discard', title: 'set.discard() — Remove Element' },
    'union': { types: ['set'], anchor: 'frozenset.union', title: 'set.union() — Union of Sets' },
    'intersection': { types: ['set'], anchor: 'frozenset.intersection', title: 'set.intersection() — Intersection' },
    'difference': { types: ['set'], anchor: 'frozenset.difference', title: 'set.difference() — Difference' },
    'symmetric_difference': { types: ['set'], anchor: 'frozenset.symmetric_difference', title: 'set.symmetric_difference() — Symmetric Difference' },
    'issubset': { types: ['set'], anchor: 'frozenset.issubset', title: 'set.issubset() — Check Subset' },
    'issuperset': { types: ['set'], anchor: 'frozenset.issuperset', title: 'set.issuperset() — Check Superset' },
    'isdisjoint': { types: ['set'], anchor: 'frozenset.isdisjoint', title: 'set.isdisjoint() — Check Disjoint' }
};

/**
 * Enhanced examples for method calls with type-specific examples
 */
const METHOD_EXAMPLES: Record<string, { [type: string]: string }> = {
    'strip': {
        'str': `\`\`\`python
# Remove whitespace from both ends
text = "  hello world  "
clean_text = text.strip()  # "hello world"

# Remove specific characters
text = "___hello___"
clean_text = text.strip("_")  # "hello"
\`\`\``
    },
    'split': {
        'str': `\`\`\`python
# Split by whitespace (default)
text = "apple banana cherry"
words = text.split()  # ['apple', 'banana', 'cherry']

# Split by specific delimiter
csv_data = "name,age,city"
fields = csv_data.split(",")  # ['name', 'age', 'city']

# Limit splits
text = "a.b.c.d"
parts = text.split(".", 1)  # ['a', 'b.c.d']
\`\`\``
    },
    'join': {
        'str': `\`\`\`python
# Join list with separator
words = ['apple', 'banana', 'cherry']
sentence = " ".join(words)  # "apple banana cherry"

# Join with different separators
csv_data = ",".join(words)  # "apple,banana,cherry"
path = "/".join(['home', 'user', 'documents'])  # "home/user/documents"
\`\`\``
    },
    'append': {
        'list': `\`\`\`python
# Add single item to end of list
fruits = ['apple', 'banana']
fruits.append('cherry')  # ['apple', 'banana', 'cherry']

# Append different types
numbers = [1, 2, 3]
numbers.append([4, 5])  # [1, 2, 3, [4, 5]]
\`\`\``
    },
    'extend': {
        'list': `\`\`\`python
# Add multiple items from iterable
fruits = ['apple', 'banana']
fruits.extend(['cherry', 'date'])  # ['apple', 'banana', 'cherry', 'date']

# Extend with string (iterates characters)
letters = ['a', 'b']
letters.extend('cd')  # ['a', 'b', 'c', 'd']
\`\`\``
    },
    'keys': {
        'dict': `\`\`\`python
# Get all keys from dictionary
user = {'name': 'Alice', 'age': 30, 'city': 'New York'}
keys = list(user.keys())  # ['name', 'age', 'city']

# Iterate over keys
for key in user.keys():
    print(f"{key}: {user[key]}")
\`\`\``
    },
    'values': {
        'dict': `\`\`\`python
# Get all values from dictionary
user = {'name': 'Alice', 'age': 30, 'city': 'New York'}
values = list(user.values())  # ['Alice', 30, 'New York']

# Check if value exists
if 'Alice' in user.values():
    print("Alice found!")
\`\`\``
    },
    'items': {
        'dict': `\`\`\`python
# Get key-value pairs
user = {'name': 'Alice', 'age': 30}
items = list(user.items())  # [('name', 'Alice'), ('age', 30)]

# Iterate over items
for key, value in user.items():
    print(f"{key}: {value}")
\`\`\``
    }
};

/**
 * Resolve method information based on context
 */
export function resolveMethodInfo(
    doc: vscode.TextDocument,
    position: vscode.Position,
    methodName: string,
    receiverType?: string
): Info | undefined {
    const methodInfo = METHOD_TO_TYPE_MAP[methodName];
    if (!methodInfo) return undefined;

    // If we have a specific receiver type, use it
    if (receiverType && methodInfo.types.includes(receiverType)) {
        const url = receiverType === 'str' ? 'library/stdtypes.html' : 'library/stdtypes.html';
        return {
            title: methodInfo.title,
            url: url,
            anchor: methodInfo.anchor
        };
    }

    // Default to the first supported type
    const defaultType = methodInfo.types[0];
    const url = defaultType === 'str' ? 'library/stdtypes.html' : 'library/stdtypes.html';

    return {
        title: methodInfo.title,
        url: url,
        anchor: methodInfo.anchor
    };
}

/**
 * Get enhanced examples for a method based on its type
 */
export function getMethodExample(methodName: string, type: string = 'str'): string {
    const examples = METHOD_EXAMPLES[methodName];
    if (!examples) return '';

    return examples[type] || examples[Object.keys(examples)[0]] || '';
}

/**
 * Detect if a word is a known method call
 */
export function isKnownMethod(methodName: string): boolean {
    return methodName in METHOD_TO_TYPE_MAP;
}

/**
 * Get all methods for a specific type
 */
export function getMethodsForType(typeName: string): string[] {
    return Object.keys(METHOD_TO_TYPE_MAP).filter(method =>
        METHOD_TO_TYPE_MAP[method].types.includes(typeName)
    );
}
