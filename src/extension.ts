import * as https from 'https';
import * as vscode from 'vscode';

// Use globalThis.URL to avoid needing the 'url' module types
const URLCtor = (globalThis as any).URL as (new (input: string, base?: string) => URL) | undefined;

type Info = { title: string; url: string; anchor: string };

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

// Enhanced example generation
function getEnhancedExamples(word: string): string {
  const examples: Record<string, string> = {
    'class': `
**Practical Examples:**

\`\`\`python
class MyClass(BaseClass):
    def __init__(self, param):
        self.param = param

    @classmethod
    def from_string(cls, data):
        return cls(data)

    @staticmethod
    def utility_method():
        return "helper"

    @property
    def value(self):
        return self.param

    def __str__(self):
        return f"MyClass({self.param})"
\`\`\`

**Common Special Methods:**
- \`__init__(self)\` - Constructor
- \`__str__(self)\` - String representation
- \`__repr__(self)\` - Developer representation
- \`__len__(self)\` - Length support
- \`__getitem__(self, key)\` - Index access`,

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

  return examples[word.toLowerCase()] || '';
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

          // Add enhanced examples if enabled
          if (showExamples) {
            const examples = getEnhancedExamples(word);
            if (examples) {
              mdBody += examples;
            }
          }

          // Enforce max content length
          if (mdBody.length > maxContentLength) {
            mdBody = mdBody.slice(0, maxContentLength).trim() + '...';
          }

          await context.globalState.update(cacheKey, { ts: now, md: mdBody });
          console.log(`Cached fresh content for ${word}: ${mdBody.length} chars`);
        } catch (error) {
          console.error(`Failed to fetch content for ${word}:`, error);
          const errorMsg = error instanceof Error ? error.message : String(error);

          // Show less intrusive error for failed fetches
          console.log(`Python Hover: Failed to fetch docs for '${word}': ${errorMsg}`);
          return undefined;
        }
      }

      if (!mdBody) {
        return undefined;
      }

      mdBody += `\n\n[📖 Open official docs](${baseUrl}/${info.url}#${info.anchor})`;

      const md = new vscode.MarkdownString(mdBody);
      md.isTrusted = true;
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
