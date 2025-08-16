import * as https from 'https';
import * as vscode from 'vscode';

// Use globalThis.URL to avoid needing the 'url' module types
const URLCtor = (globalThis as any).URL as (new (input: string, base?: string) => URL) | undefined;

type Info = { title: string; url: string; anchor: string };

// Smartly truncate markdown at natural boundaries (paragraphs/code fences)
function smartTruncateMarkdown(text: string, limit: number): string {
  if (text.length <= limit) return text;

  let cut = limit;
  let candidate = text.slice(0, cut);

  // Prefer cutting at paragraph boundary within last 200 chars
  const window = 200;
  const searchStart = Math.max(0, cut - window);
  const tail = candidate.slice(searchStart);

  const paraIdx = tail.lastIndexOf('\n\n');
  if (paraIdx !== -1) {
    cut = searchStart + paraIdx;
  } else {
    // Else try sentence boundary
    const sentenceIdx = tail.lastIndexOf('. ');
    if (sentenceIdx !== -1) cut = searchStart + sentenceIdx + 1; // keep the period
    else {
      // Else try last newline
      const nlIdx = tail.lastIndexOf('\n');
      if (nlIdx !== -1) cut = searchStart + nlIdx;
    }
  }

  let out = text.slice(0, cut).trim();

  // Close unmatched fenced code blocks; ensure the closing fence is on its own line
  let closedFence = false;
  const fenceCount = (out.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    // Put closing fence on its own line to properly terminate the code block
    if (!out.endsWith('\n')) out += '\n';
    out += '```\n';
    closedFence = true;
  }

  // Close unmatched inline backticks
  const inlineTicks = (out.match(/`/g) || []).length;
  if (inlineTicks % 2 !== 0) out += '`';

  // If we just closed a fence, add ellipsis on a new paragraph to avoid "```..." which breaks closure
  const ellipsis = closedFence ? '\n\n...' : '...';
  return out + ellipsis;
}

// Ensure we are not inside an open fenced code block before appending other markdown
function ensureClosedFences(text: string): string {
  let out = text;
  const fenceCount = (out.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    if (!out.endsWith('\n')) out += '\n';
    out += '```\n';
  }
  // After ensuring fences are closed, handle unmatched inline backticks
  try {
    const withoutFences = out.replace(/```[\s\S]*?```/g, '');
    const inlineTicks = (withoutFences.match(/`/g) || []).length;
    if (inlineTicks % 2 !== 0) {
      out += '`';
    }
  } catch {
    // Best-effort; ignore if regex fails
  }
  return out;
}

const MAP: Record<string, Info> = {
  // Control flow keywords
  class: {
    title: "class — Class Definitions",
    url: "reference/compound_stmts.html",
    anchor: "class-definitions"
  },
  def: {
    title: "def — Function Definitions",
    url: "reference/compound_stmts.html",
    anchor: "function-definitions"
  },
  return: {
    title: "return — Return Statement",
    url: "reference/simple_stmts.html",
    anchor: "the-return-statement"
  },
  with: {
    title: "with — Context Managers",
    url: "reference/compound_stmts.html",
    anchor: "the-with-statement"
  },
  yield: {
    title: "yield — Yield Expressions",
    url: "reference/expressions.html",
    anchor: "yield-expressions"
  },
  async: {
    title: "async — Asynchronous Functions",
    url: "reference/compound_stmts.html",
    anchor: "async-def"
  },
  await: {
    title: "await — Await Expressions",
    url: "reference/expressions.html",
    anchor: "await-expression"
  },
  import: {
    title: "import — Import Statements",
    url: "reference/simple_stmts.html",
    anchor: "the-import-statement"
  },
  from: {
    title: "from — Import From Statement",
    url: "reference/simple_stmts.html",
    anchor: "the-import-statement"
  },
  try: {
    title: "try — Exception Handling",
    url: "reference/compound_stmts.html",
    anchor: "the-try-statement"
  },
  if: {
    title: "if — Conditional Statements",
    url: "reference/compound_stmts.html",
    anchor: "the-if-statement"
  },
  for: {
    title: "for — For Loops",
    url: "reference/compound_stmts.html",
    anchor: "the-for-statement"
  },
  while: {
    title: "while — While Loops",
    url: "reference/compound_stmts.html",
    anchor: "the-while-statement"
  },
  except: {
    title: "except — Exception Handlers",
    url: "reference/compound_stmts.html",
    anchor: "the-try-statement"
  },
  finally: {
    title: "finally — Cleanup Code",
    url: "reference/compound_stmts.html",
    anchor: "the-try-statement"
  },
  else: {
    title: "else — Alternative Execution",
    url: "reference/compound_stmts.html",
    anchor: "the-if-statement"
  },
  elif: {
    title: "elif — Else If",
    url: "reference/compound_stmts.html",
    anchor: "the-if-statement"
  },
  break: {
    title: "break — Loop Termination",
    url: "reference/simple_stmts.html",
    anchor: "the-break-statement"
  },
  continue: {
    title: "continue — Loop Continuation",
    url: "reference/simple_stmts.html",
    anchor: "the-continue-statement"
  },
  pass: {
    title: "pass — No Operation",
    url: "reference/simple_stmts.html",
    anchor: "the-pass-statement"
  },
  lambda: {
    title: "lambda — Anonymous Functions",
    url: "reference/expressions.html",
    anchor: "lambda-expressions"
  },
  global: {
    title: "global — Global Variables",
    url: "reference/simple_stmts.html",
    anchor: "the-global-statement"
  },
  nonlocal: {
    title: "nonlocal — Nonlocal Variables",
    url: "reference/simple_stmts.html",
    anchor: "the-nonlocal-statement"
  },
  raise: {
    title: "raise — Raise Exception",
    url: "reference/simple_stmts.html",
    anchor: "the-raise-statement"
  },
  assert: {
    title: "assert — Debug Assertion",
    url: "reference/simple_stmts.html",
    anchor: "the-assert-statement"
  },
  del: {
    title: "del — Delete Statement",
    url: "reference/simple_stmts.html",
    anchor: "the-del-statement"
  },
  match: {
    title: "match — Pattern Matching (Python 3.10+)",
    url: "reference/compound_stmts.html",
    anchor: "the-match-statement"
  },
  case: {
    title: "case — Match Case (Python 3.10+)",
    url: "reference/compound_stmts.html",
    anchor: "the-match-statement"
  },

  // Built-in functions
  print: {
    title: "print() — Print Objects",
    url: "library/functions.html",
    anchor: "print"
  },
  len: {
    title: "len() — Return Length",
    url: "library/functions.html",
    anchor: "len"
  },
  range: {
    title: "range() — Range Object",
    url: "library/functions.html",
    anchor: "range"
  },
  enumerate: {
    title: "enumerate() — Enumerate Object",
    url: "library/functions.html",
    anchor: "enumerate"
  },
  zip: {
    title: "zip() — Zip Iterator",
    url: "library/functions.html",
    anchor: "zip"
  },
  map: {
    title: "map() — Apply Function",
    url: "library/functions.html",
    anchor: "map"
  },
  filter: {
    title: "filter() — Filter Elements",
    url: "library/functions.html",
    anchor: "filter"
  },
  sorted: {
    title: "sorted() — Return Sorted List",
    url: "library/functions.html",
    anchor: "sorted"
  },
  reversed: {
    title: "reversed() — Reverse Iterator",
    url: "library/functions.html",
    anchor: "reversed"
  },
  sum: {
    title: "sum() — Sum Iterable",
    url: "library/functions.html",
    anchor: "sum"
  },
  max: {
    title: "max() — Maximum Value",
    url: "library/functions.html",
    anchor: "max"
  },
  min: {
    title: "min() — Minimum Value",
    url: "library/functions.html",
    anchor: "min"
  },
  abs: {
    title: "abs() — Absolute Value",
    url: "library/functions.html",
    anchor: "abs"
  },
  round: {
    title: "round() — Round Number",
    url: "library/functions.html",
    anchor: "round"
  },

  // Data types
  str: {
    title: "str — String Type",
    url: "library/stdtypes.html",
    anchor: "text-sequence-type-str"
  },
  int: {
    title: "int — Integer Type",
    url: "library/functions.html",
    anchor: "int"
  },
  float: {
    title: "float — Floating Point",
    url: "library/functions.html",
    anchor: "float"
  },
  bool: {
    title: "bool — Boolean Type",
    url: "library/functions.html",
    anchor: "bool"
  },
  list: {
    title: "list — List Type",
    url: "library/stdtypes.html",
    anchor: "list"
  },
  dict: {
    title: "dict — Dictionary Type",
    url: "library/stdtypes.html",
    anchor: "dict"
  },
  set: {
    title: "set — Set Type",
    url: "library/stdtypes.html",
    anchor: "set"
  },
  tuple: {
    title: "tuple — Tuple Type",
    url: "library/stdtypes.html",
    anchor: "tuple"
  },

  // Special values
  None: {
    title: "None — Null Value",
    url: "library/constants.html",
    anchor: "None"
  },
  True: {
    title: "True — Boolean True",
    url: "library/constants.html",
    anchor: "True"
  },
  False: {
    title: "False — Boolean False",
    url: "library/constants.html",
    anchor: "False"
  }
};

// Enhanced contextual analysis
function getContextualInfo(doc: vscode.TextDocument, position: vscode.Position, word: string): Info | undefined {
  const line = doc.lineAt(position).text;
  const beforeWord = line.substring(0, position.character);
  const afterWord = line.substring(position.character + word.length);

  // Enhanced detection for built-in functions vs types
  if (['str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple'].includes(word)) {
    // Check if it's being used as a constructor/function call
    if (afterWord.trim().startsWith('(') || beforeWord.trim().endsWith('.')) {
      return MAP[word];
    }
    // Could be a type annotation or isinstance check
    if (beforeWord.includes(':') || beforeWord.includes('isinstance') || beforeWord.includes('type')) {
      return MAP[word];
    }
  }

  // Enhanced detection for keywords vs variable names
  if (['class', 'def', 'import', 'from'].includes(word)) {
    // Only show if it's actually the keyword, not a variable/attribute name
    if (beforeWord.trim().endsWith('.')) {
      return undefined; // It's an attribute access like obj.class
    }
  }

  // Context for async/await
  if (word === 'await') {
    // Make sure we're in an async context
    const fullText = doc.getText();
    const textBeforePosition = fullText.substring(0, doc.offsetAt(position));
    if (!textBeforePosition.includes('async def') && !textBeforePosition.includes('async with')) {
      // Could still be valid, but add a note
      const info = MAP[word];
      return info ? { ...info, title: info.title + " (requires async context)" } : undefined;
    }
  }

  return MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];
}

// Build a clickable list of Python special methods linking to the Data Model page
function buildSpecialMethodsSection(baseUrl: string): string {
  const dm = `${baseUrl}/reference/datamodel.html`;
  const oc = (name: string) => `[\`${name}\`](${dm}#object.${name})`;
  const tc = (name: string) => `[\`${name}\`](${dm}#type.${name})`;

  const lines: string[] = [];
  lines.push(`\n**Special methods (click to open docs):**`);
  // Essentials first (concise)
  lines.push(`- ${oc('__init__')} · ${oc('__repr__')} · ${oc('__str__')} · ${oc('__len__')} · ${oc('__iter__')} · ${oc('__contains__')} · ${oc('__getitem__')} · ${oc('__setitem__')} · ${oc('__enter__')} · ${oc('__exit__')} · ${oc('__call__')}`);

  // Collapsible full list to avoid overwhelming the hover
  lines.push(`<details><summary>More special methods…</summary>`);
  lines.push(`
${oc('__new__')} · ${oc('__del__')}`);
  lines.push(`${oc('__bytes__')} · ${oc('__format__')}`);
  lines.push(`${oc('__bool__')} · ${oc('__hash__')}`);
  lines.push(`${oc('__getattr__')} · ${oc('__getattribute__')} · ${oc('__setattr__')} · ${oc('__delattr__')} · ${oc('__dir__')}`);
  lines.push(`${oc('__get__')} · ${oc('__set__')} · ${oc('__delete__')} · ${oc('__set_name__')}`);
  lines.push(`${oc('__mro_entries__')} · ${oc('__init_subclass__')} · ${oc('__class_getitem__')} · ${tc('__instancecheck__')} · ${tc('__subclasscheck__')}`);
  lines.push(`${oc('__len__')} · ${oc('__length_hint__')} · ${oc('__reversed__')}`);
  lines.push(`${oc('__getitem__')} · ${oc('__setitem__')} · ${oc('__delitem__')} · ${oc('__missing__')}`);
  lines.push(`${oc('__int__')} · ${oc('__float__')} · ${oc('__complex__')} · ${oc('__index__')}`);
  lines.push(`${oc('__round__')} · ${oc('__trunc__')} · ${oc('__floor__')} · ${oc('__ceil__')}`);
  lines.push(`${oc('__neg__')} · ${oc('__pos__')} · ${oc('__abs__')} · ${oc('__invert__')}`);
  lines.push(`${oc('__add__')} · ${oc('__sub__')} · ${oc('__mul__')} · ${oc('__matmul__')} · ${oc('__truediv__')} · ${oc('__floordiv__')} · ${oc('__mod__')} · ${oc('__divmod__')} · ${oc('__pow__')} · ${oc('__lshift__')} · ${oc('__rshift__')} · ${oc('__and__')} · ${oc('__xor__')} · ${oc('__or__')}`);
  lines.push(`${oc('__radd__')} · ${oc('__rsub__')} · ${oc('__rmul__')} · ${oc('__rmatmul__')} · ${oc('__rtruediv__')} · ${oc('__rfloordiv__')} · ${oc('__rmod__')} · ${oc('__rdivmod__')} · ${oc('__rpow__')} · ${oc('__rlshift__')} · ${oc('__rrshift__')} · ${oc('__rand__')} · ${oc('__rxor__')} · ${oc('__ror__')}`);
  lines.push(`${oc('__iadd__')} · ${oc('__isub__')} · ${oc('__imul__')} · ${oc('__imatmul__')} · ${oc('__itruediv__')} · ${oc('__ifloordiv__')} · ${oc('__imod__')} · ${oc('__ipow__')} · ${oc('__ilshift__')} · ${oc('__irshift__')} · ${oc('__iand__')} · ${oc('__ixor__')} · ${oc('__ior__')}`);
  lines.push(`${oc('__match_args__')}`);
  lines.push(`${oc('__buffer__')} · ${oc('__release_buffer__')}`);
  lines.push(`${oc('__await__')} · ${oc('__aiter__')} · ${oc('__anext__')} · ${oc('__aenter__')} · ${oc('__aexit__')}`);
  lines.push(`</details>`);
  lines.push(`\nSee the full list: [Special method names](${dm}#special-method-names)`);
  return lines.join('\n');
}

// Enhanced example generation
function getEnhancedExamples(word: string, baseUrl?: string, doc?: vscode.TextDocument, position?: vscode.Position): string {
  console.log(`DEBUG: getEnhancedExamples called with word: "${word}"`);

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

**Essential Special Methods:**
- \`__init__(self, ...)\` - Constructor (called when creating instances)
- \`__str__(self)\` - String representation for users
- \`__repr__(self)\` - String representation for developers
- \`__len__(self)\` - Returns length (enables \`len(obj)\`)
- \`__eq__(self, other)\` - Equality comparison (\`obj1 == obj2\`)
- \`__lt__(self, other)\` - Less than comparison (\`obj1 < obj2\`)
- \`__getitem__(self, key)\` - Index access (\`obj[key]\`)
- \`__setitem__(self, key, value)\` - Index assignment (\`obj[key] = value\`)
- \`__contains__(self, item)\` - Membership test (\`item in obj\`)
- \`__iter__(self)\` - Makes object iterable
- \`__enter__(self)\` & \`__exit__(self, ...)\` - Context manager support

**Property & Method Decorators:**
- \`@property\` - Creates getter methods
- \`@classmethod\` - Methods that take class as first argument
- \`@staticmethod\` - Methods that don't need self or cls
- \`@abstractmethod\` - Abstract methods (from \`abc\` module)

**Common Patterns:**
- **Factory methods**: Use \`@classmethod\` to create alternative constructors
- **Validation**: Use \`@property\` with setters for data validation
- **Context managers**: Implement \`__enter__\` and \`__exit__\` for \`with\` statements
- **Collections**: Implement \`__len__\`, \`__getitem__\`, \`__iter__\` for collection-like behavior`,

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
\`\`\``,

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
\`\`\``,

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
\`\`\``
  };

  const result = examples[word.toLowerCase()] || '';
  console.log(`DEBUG: getEnhancedExamples returning for "${word}": ${result.length} characters`);
  if (result.length > 0) {
    console.log(`DEBUG: First 100 chars of result: ${result.substring(0, 100)}...`);
  }
  return result;
}

// Rest of your existing functions (fetchText, htmlToMarkdown, etc.)
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res: any) => {
      const statusCode = res.statusCode ?? 0;

      if (statusCode >= 300 && statusCode < 400 && res.headers && res.headers.location) {
        const next = URLCtor ? new URLCtor(res.headers.location as string, url).toString() : (res.headers.location as string);
        resolve(fetchText(next));
        return;
      }
      if (statusCode >= 400) {
        console.error(`HTTP ${statusCode} error for ${url}`);
        reject(new Error(`Request failed. Status code: ${statusCode} for ${url}`));
        return;
      }

      let data = '';
      res.on('data', (chunk: any) => (data += chunk.toString()));
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err: Error) => {
      console.error(`Network error for ${url}:`, err);
      reject(err);
    });
  });
}

function htmlToMarkdown(html: string, baseUrl: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  let urlBase: string;
  if (baseUrl.includes('://')) {
    urlBase = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  } else {
    urlBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  }

  let md = noScripts
    .replace(/<a[^>]*href="([^"#]*?)(?:#([^"]*))?"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, anchor, text) => {
      if (!href || href.startsWith('#')) {
        return strip(text);
      }
      if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('mailto:')) {
        let cleanHref = href;
        if (href.startsWith('../')) {
          cleanHref = href.replace(/^\.\.\//, '');
          const urlParts = baseUrl.split('/');
          const parentUrl = urlParts.slice(0, -2).join('/');
          const fullUrl = anchor ? `${parentUrl}/${cleanHref}#${anchor}` : `${parentUrl}/${cleanHref}`;
          return `[${strip(text)}](${fullUrl})`;
        } else {
          const fullUrl = anchor ? `${urlBase}/${cleanHref}#${anchor}` : `${urlBase}/${cleanHref}`;
          return `[${strip(text)}](${fullUrl})`;
        }
      }
      if (href.startsWith('http')) {
        const fullUrl = anchor ? `${href}#${anchor}` : href;
        return `[${strip(text)}](${fullUrl})`;
      }
      return strip(text);
    })
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, (_match, text) => strip(text || ''))
    .replace(/<link[^>]*>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<div[^>]*class="[^"]*headerlink[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, p1) => "\n```python\n" + decode(p1).trim() + "\n```\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => "`" + decode(p1).trim() + "`")
    .replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, (_m, p1) => `**${strip(decode(p1))}**\n`)
    .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (_m, p1) => `${strip(decode(p1))}\n\n`)
    .replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (_m, p1) => p1)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p1) => `- ${strip(decode(p1))}\n`)
    .replace(/<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi, (_m, p1) => p1 + "\n")
    .replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, _level, text) => `\n### ${strip(decode(text))}\n`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p1) => strip(decode(p1)) + "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/¶/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n");

  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function strip(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function decode(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function getSectionMarkdown(baseUrl: string, page: string, anchor: string): Promise<string> {
  const full = `${baseUrl.replace(/\/$/, "")}/${page}`;
  const html = await fetchText(full);

  let anchorPos = html.indexOf(`id="${anchor}"`);
  if (anchorPos === -1) {
    anchorPos = html.indexOf(`id='${anchor}'`);
  }
  if (anchorPos === -1) {
    anchorPos = html.indexOf(`name="${anchor}"`);
  }
  if (anchorPos === -1) {
    throw new Error(`Anchor ${anchor} not found in ${full}`);
  }

  const afterAnchor = html.slice(anchorPos);
  const headingMatch = afterAnchor.match(/<h([2-6])\b[^>]*>(.*?)<\/h\1>/i);

  let headingText = '';
  let headingEndPos = anchorPos;

  if (headingMatch && typeof headingMatch.index === 'number') {
    headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();
    headingEndPos = anchorPos + headingMatch.index + headingMatch[0].length;
  }

  const afterHeading = html.slice(headingEndPos);
  const nextHeadingMatch = afterHeading.match(/<h[2-6]\b/i);
  const nextHeadingPos = nextHeadingMatch ? headingEndPos + nextHeadingMatch.index! : html.length;

  const maxSectionLength = 8000;
  const sectionHtml = html.slice(headingEndPos, Math.min(nextHeadingPos, headingEndPos + maxSectionLength));

  const paragraphs = [...sectionHtml.matchAll(/<p\b[^>]*>(.*?)<\/p>/gis)];
  const codeBlocks = [...sectionHtml.matchAll(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis)];
  const defLists = [...sectionHtml.matchAll(/<dl\b[^>]*>(.*?)<\/dl>/gis)];

  let contentText = '';

  const maxParagraphs = 8;
  for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
    const paragraph = htmlToMarkdown(paragraphs[i][0], full).trim();
    if (paragraph && paragraph.length > 5 && !paragraph.includes('¶')) {
      contentText += paragraph + '\n\n';
    }
  }

  for (let i = 0; i < Math.min(defLists.length, 2) && contentText.length < 800; i++) {
    const defList = htmlToMarkdown(defLists[i][0], full).trim();
    if (defList && defList.length > 20) {
      contentText += defList + '\n\n';
    }
  }

  for (let i = 0; i < Math.min(codeBlocks.length, 2) && contentText.length < 900; i++) {
    const codeExample = htmlToMarkdown(codeBlocks[i][0], full).trim();
    if (codeExample && codeExample.includes('```')) {
      contentText += codeExample + '\n\n';
    }
  }

  if (contentText.length < 150) {
    const rawContent = htmlToMarkdown(sectionHtml.slice(0, 4000), full).trim();
    if (rawContent.length > contentText.length) {
      contentText = rawContent;
    }
  }

  if (contentText.length < 50) {
    throw new Error(`Insufficient content extracted for anchor ${anchor}`);
  }

  if (contentText.length > 1500) {
    contentText = contentText.slice(0, 1500).trim() + '...';
  }

  const titleLine = headingText ? `### ${headingText}\n\n` : '';
  const result = (titleLine + contentText).trim();

  return result;
}

export function activate(context: vscode.ExtensionContext) {
  // Register commands
  const clearCacheCommand = vscode.commands.registerCommand('pythonHover.clearCache', async () => {
    const allKeys = context.globalState.keys();
    const cacheKeys = allKeys.filter(key => key.startsWith('pyDocs:'));

    for (const key of cacheKeys) {
      await context.globalState.update(key, undefined);
    }

    vscode.window.showInformationMessage(`Cleared ${cacheKeys.length} cached Python documentation entries.`);
  });

  const refreshContentCommand = vscode.commands.registerCommand('pythonHover.refreshContent', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'python') {
      vscode.window.showWarningMessage('Please open a Python file to refresh hover content.');
      return;
    }

    const position = editor.selection.active;
    const range = editor.document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    if (!range) {
      vscode.window.showInformationMessage('No Python keyword found at cursor position.');
      return;
    }

    const word = editor.document.getText(range);
    if (!MAP[word]) {
      vscode.window.showInformationMessage(`'${word}' is not a supported Python keyword.`);
      return;
    }

    // Clear cache for this specific keyword
    const cfg = vscode.workspace.getConfiguration("pythonHover");
    const ver = (cfg.get<string>("pythonVersion") || "3").trim();
    const info = MAP[word];
    const cacheKey = `pyDocs:v7:${ver}:${info.url}#${info.anchor}`;

    await context.globalState.update(cacheKey, undefined);
    vscode.window.showInformationMessage(`Refreshed documentation cache for '${word}'.`);
  });

  const showStatisticsCommand = vscode.commands.registerCommand('pythonHover.showStatistics', async () => {
    const allKeys = context.globalState.keys();
    const cacheKeys = allKeys.filter(key => key.startsWith('pyDocs:'));

    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();
    const cfg = vscode.workspace.getConfiguration("pythonHover");
    const cacheDays = cfg.get<number>("cacheDays") ?? 7;
    const freshMs = cacheDays * 24 * 60 * 60 * 1000;

    for (const key of cacheKeys) {
      const cached = context.globalState.get<{ ts: number; md: string }>(key);
      if (cached) {
        totalSize += cached.md.length;
        if (now - cached.ts > freshMs) {
          expiredCount++;
        }
      }
    }

    const message = [
      `📊 Python Hover Cache Statistics:`,
      `• Total entries: ${cacheKeys.length}`,
      `• Expired entries: ${expiredCount}`,
      `• Total cache size: ${(totalSize / 1024).toFixed(1)} KB`,
      `• Cache duration: ${cacheDays} days`
    ].join('\n');

    vscode.window.showInformationMessage(message);
  });

  const provider: vscode.HoverProvider = {
    async provideHover(doc, position) {
      const cfg = vscode.workspace.getConfiguration("pythonHover");

      // Check if context-aware detection is enabled
      const contextAware = cfg.get<boolean>("contextAware") ?? true;
      const includeBuiltins = cfg.get<boolean>("includeBuiltins") ?? true;
      const showExamples = cfg.get<boolean>("showExamples") ?? true;
      const maxContentLength = cfg.get<number>("maxContentLength") ?? 1500;

      const range = doc.getWordRangeAtPosition(position, /[A-Za-z_]+/);
      if (!range) return;

      const word = doc.getText(range);
      let info: Info | undefined;

      if (contextAware) {
        info = getContextualInfo(doc, position, word);
      } else {
        info = MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];
      }

      // Filter built-ins if disabled
      const builtinKeywords = ['print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'sum', 'max', 'min', 'abs', 'round', 'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple'];
      if (!includeBuiltins && info && builtinKeywords.includes(word.toLowerCase())) {
        return;
      }

      if (!info) {
        return;
      }

      const ver = (cfg.get<string>("pythonVersion") || "3").trim();
      const cacheDays = cfg.get<number>("cacheDays") ?? 7;
      const baseUrl = `https://docs.python.org/${ver}`;

      const cacheKey = `pyDocs:v7:${ver}:${info.url}#${info.anchor}`;
      const cached = context.globalState.get<{ ts: number; md: string }>(cacheKey);
      const now = Date.now();
      const freshMs = cacheDays * 24 * 60 * 60 * 1000;

      let mdBody: string | undefined = undefined;
      if (cached && (now - cached.ts) < freshMs) {
        mdBody = cached.md;
        console.log(`Using cached content for ${word}: ${mdBody.length} chars`);
      }

      if (!mdBody) {
        try {
          console.log(`Fetching fresh content for ${word} from ${baseUrl}/${info.url}#${info.anchor}`);
          mdBody = await getSectionMarkdown(baseUrl, info.url, info.anchor);

          await context.globalState.update(cacheKey, { ts: now, md: mdBody });
          console.log(`Cached fresh content for ${word}: ${mdBody.length} chars`);
        } catch (error) {
          console.error(`Failed to fetch content for ${word}:`, error);
          const errorMsg = error instanceof Error ? error.message : String(error);

          // Fall back to examples-only hover if docs fetch fails
          console.log(`Python Hover: Failed to fetch docs for '${word}': ${errorMsg}. Falling back to examples-only.`);
          mdBody = '';
        }
      }

      // Proceed even if mdBody is empty to allow examples-only hover

      // Build final markdown ensuring examples are included even when truncating
  const docsBody = ensureClosedFences(mdBody || ''); // keep docs separate from examples and close any fences

      let examplesBody = '';
      let specialMethodsBody = '';
      if (showExamples) {
        console.log(`DEBUG: showExamples is enabled, getting examples for word: ${word}`);
        examplesBody = getEnhancedExamples(word, baseUrl, doc, position) || '';
        if (word.toLowerCase() === 'class') {
          specialMethodsBody = buildSpecialMethodsSection(baseUrl);
        }
        console.log(`DEBUG: getEnhancedExamples returned: ${examplesBody ? examplesBody.length : 0} characters`);
      } else {
        console.log(`DEBUG: showExamples is disabled`);
      }

  const fullUrl = `${baseUrl}/${info.url}#${info.anchor}`;
  // Use a single straightforward HTTP link with the requested label
  const linkBody = `\n\n[📖 Open official docs](${fullUrl})`;

  let finalBody: string;
  const unlimited = (maxContentLength ?? 0) <= 0;
  if (unlimited) {
    const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
    let body = ensureClosedFences((docsBody ? docsBody + '\n\n' : '') + combinedExamples);
    if (!body.endsWith('\n\n')) body += '\n\n';
    finalBody = body + linkBody.trimStart();
  } else if (!examplesBody && !specialMethodsBody) {
        // No examples, just docs (with truncation) + link
        let docs = docsBody;
  if (docs.length > maxContentLength) {
          docs = smartTruncateMarkdown(docs, maxContentLength);
        }
  let safeDocs = ensureClosedFences(docs);
    // Guarantee at least one blank line before link
    if (!safeDocs.endsWith('\n\n')) safeDocs += '\n\n';
  finalBody = safeDocs + linkBody.trimStart();
      } else {
    // Reserve a portion of the budget for examples/special methods
        const totalBudget = Math.max(500, maxContentLength); // guard against very small values
  // Put special methods first so they are not truncated away, and allow a slightly larger cap
  const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
  const minExamplesBudget = Math.min(combinedExamples.length, Math.max(500, Math.floor(totalBudget * 0.40)), 1400);
        // Leave space for the link
        const linkBudget = Math.min(linkBody.length + 10, 200);
        let docsBudget = totalBudget - minExamplesBudget - linkBudget;
        // Ensure docs budget isn't too small
        if (docsBudget < 300) {
          docsBudget = Math.max(200, Math.floor(totalBudget * 0.25));
        }

  let docsPart = docsBody;
        if (docsPart.length > docsBudget) {
          docsPart = smartTruncateMarkdown(docsPart, docsBudget);
        }

  let examplesPart = combinedExamples;
    if (examplesPart.length > minExamplesBudget) {
      examplesPart = smartTruncateMarkdown(examplesPart, minExamplesBudget);
    }

  let safeBody = ensureClosedFences((docsPart ? docsPart + '\n\n' : '') + examplesPart);
    if (!safeBody.endsWith('\n\n')) safeBody += '\n\n';
  finalBody = safeBody + linkBody.trimStart();
      }

  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.supportHtml = true;
  // Append the composed markdown in parts to avoid accidental escaping by template handling
  md.appendMarkdown(finalBody);
  return new vscode.Hover(md, range);
    }
  };

  context.subscriptions.push(
    clearCacheCommand,
    refreshContentCommand,
    showStatisticsCommand,
    vscode.languages.registerHoverProvider({ language: "python" }, provider)
  );
}

export function deactivate() {}
