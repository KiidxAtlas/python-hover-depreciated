import * as vscode from 'vscode';

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

export function buildSpecialMethodsSection(baseUrl: string, doc?: import('vscode').TextDocument, position?: import('vscode').Position): string {
    const dm = `${baseUrl}/reference/datamodel.html`;
    const oc = (name: string) => `[
\`${name}\`](${dm}#object.${name})`;
    const lines: string[] = [];
    lines.push(`\n**Special methods (click name to open docs):**`);

    // Detect implementations in the current class (best-effort): handle decorators, multiline def signatures, and avoid nested classes
    const implemented = new Set<string>();
    try {
        if (doc && position) {
            // Find the nearest containing 'class' line above the cursor
            let startLine = position.line;
            while (startLine >= 0) {
                const text = doc.lineAt(startLine).text;
                if (/^\s*class\s+[A-Za-z_]/.test(text)) break;
                startLine--;
            }
            if (startLine >= 0) {
                const classLineText = doc.lineAt(startLine).text;
                const classIndent = classLineText.match(/^\s*/)?.[0] ?? '';
                const memberIndentPrefix = classIndent + '    '; // 4-space indent assumed for class body

                let buffer = '';
                let nestedSkipStack: number[] = [];

                const flushBuffer = () => {
                    if (!buffer) return;
                    // Search for def __dunder__ names across the buffered block (handles decorators and multiline defs)
                    const re = /def\s+(__[A-Za-z0-9_]+__)\s*\(/g;
                    let m: RegExpExecArray | null;
                    while ((m = re.exec(buffer))) {
                        implemented.add(m[1]);
                    }
                    buffer = '';
                };

                for (let ln = startLine + 1; ln < doc.lineCount; ln++) {
                    const lineText = doc.lineAt(ln).text;
                    // stop scanning when indentation returns to or above classIndent and a new top-level construct appears
                    const leading = lineText.match(/^\s*/)?.[0] ?? '';
                    if (lineText.trim().length && leading.length <= classIndent.length) break;

                    // Detect nested class and skip its body
                    const nestedClassMatch = lineText.match(/^\s*(class)\s+[A-Za-z_]/);
                    if (nestedClassMatch && leading.length > classIndent.length) {
                        nestedSkipStack.push(leading.length);
                        continue;
                    }

                    // If currently inside a nested class, check if we've exited it
                    if (nestedSkipStack.length) {
                        const currentNestedIndent = nestedSkipStack[nestedSkipStack.length - 1];
                        if (leading.length <= currentNestedIndent) {
                            nestedSkipStack.pop();
                        } else {
                            // we are inside nested class body; skip
                            continue;
                        }
                    }

                    // If this line is part of the class member area (decorator, def, or continuation), accumulate
                    if (lineText.startsWith(memberIndentPrefix) || lineText.trim() === '') {
                        // strip the memberIndentPrefix for simpler regex across the buffer
                        const stripped = lineText.startsWith(memberIndentPrefix) ? lineText.slice(memberIndentPrefix.length) : lineText.trim() ? lineText.trim() : '';
                        buffer += stripped + '\n';
                        // If this line contains a def start, and next line is dedent or blank or next line not continuation, we can flush.
                        if (/\bdef\s+(__[A-Za-z0-9_]+__)\s*\(/.test(stripped)) {
                            // but keep collecting in case of multiline signature; flush when next non-empty line does not end with ',' or continues with more indentation
                            // Simple heuristic: if next line exists and starts with memberIndentPrefix + ' ' (further indent) or stripped ends with ',' or '(' then wait; otherwise flush
                            const nextLine = ln + 1 < doc.lineCount ? doc.lineAt(ln + 1).text : '';
                            const nextLeading = nextLine.match(/^\s*/)?.[0] ?? '';
                            const nextIsContinuation = nextLine.trim().length && (nextLine.trim().startsWith(')') || nextLine.trim().startsWith(',') || nextLeading.length > leading.length);
                            if (!nextIsContinuation) flushBuffer();
                        }
                        continue;
                    }

                    // Any other line (e.g., top-level def) -> flush buffer and possibly stop
                    flushBuffer();
                }

                flushBuffer();
            }
        }
    } catch (e) {
        // best-effort; ignore parse failures
    }

    // Render a compact inline list: show implemented ones with a checkmark
    const rendered = DEFAULT_SPECIAL_METHODS.map(e => {
        const name = e.name;
        const desc = SPECIAL_METHOD_DESCRIPTIONS[name];
        const impl = implemented.has(name) ? ' **(implemented)**' : '';
        return `- ${oc(name)}${impl}${desc ? ` — ${desc}` : ''}`;
    });

    // Limit to first 12 methods to avoid verbosity
    lines.push(rendered.slice(0, 12).join('\n'));
    const commandUri = `command:pythonHover.showAllSpecialMethods`;
    lines.push(`\n[Show all special methods…](${commandUri}) · [Reference: Special method names](${dm}#special-method-names)`);
    return lines.join('\n');
}

export function getEnhancedExamples(word: string, baseUrl?: string, doc?: vscode.TextDocument, position?: vscode.Position): string {
    const examples: Record<string, string> = {
        'class': `
**Practical Examples:**

\`\`\`python
# Basic class with constructor
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __str__(self):
        return f"Person(name='{self.name}', age={self.age})"

    def greet(self):
        return f"Hello, I'm {self.name}"

# Class with inheritance
class Student(Person):
    def __init__(self, name, age, student_id):
        super().__init__(name, age)
        self.student_id = student_id

    @classmethod
    def from_string(cls, data):
        name, age, student_id = data.split(',')
        return cls(name, int(age), student_id)

    @staticmethod
    def get_school_year():
        return "2024-2025"

    @property
    def info(self):
        return f"{self.name} (ID: {self.student_id})"

# Dataclass (Python 3.7+)
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def distance_from_origin(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5
\`\`\`
`,
        'def': `
**Examples:**

\`\`\`python
# Basic function
def greet(name):
    return f"Hello, {name}!"

# Function with default arguments
def create_user(name, age=25, active=True):
    return {"name": name, "age": age, "active": active}

# Function with *args and **kwargs
def flexible_func(*args, **kwargs):
    print(f"Args: {args}, Kwargs: {kwargs}")

# Function with type hints
def calculate(x: int, y: int) -> int:
    return x + y
\`\`\`
`,
        'import': `
**Examples:**

\`\`\`python
# Basic imports
import os
import sys
from pathlib import Path
from collections import defaultdict, Counter

# Aliased imports
import numpy as np
from datetime import datetime as dt

# Relative imports (in packages)
from .models import User
from ..utils import helper_function

# Conditional imports
try:
    import optional_module
except ImportError:
    optional_module = None
\`\`\`
`,
        'try': `
**Examples:**

\`\`\`python
# Basic exception handling
try:
    result = risky_operation()
except ValueError as e:
    print(f"Invalid value: {e}")
except FileNotFoundError:
    print("File not found")
else:
    print("No exceptions occurred")
finally:
    cleanup_resources()

# Multiple exception types
try:
    data = json.loads(text)
except (ValueError, TypeError) as e:
    print(f"JSON error: {e}")
\`\`\`
`,
    };
    return examples[word.toLowerCase()] || '';
}
