import * as https from 'https';
import * as vscode from 'vscode';

// Use globalThis.URL to avoid needing the 'url' module types
const URLCtor = (globalThis as any).URL as (new (input: string, base?: string) => URL) | undefined;

type Info = { title: string; url: string; anchor: string };

const MAP: Record<string, Info> = {
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
  }
};

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

  // Extract just the base domain and path from baseUrl
  // For pages like https://docs.python.org/3/reference/compound_stmts.html
  // we want the base to be https://docs.python.org/3/reference/ for relative links
  let urlBase: string;
  if (baseUrl.includes('://')) {
    // Full URL provided, extract the directory part
    urlBase = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  } else {
    // Just a base domain
    urlBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  }

  let md = noScripts
    // Convert internal links to working absolute URLs BEFORE removing them
    .replace(/<a[^>]*href="([^"#]*?)(?:#([^"]*))?"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, anchor, text) => {
      // Skip empty hrefs or just fragments
      if (!href || href.startsWith('#')) {
        return strip(text);
      }

      // Only process relative links (not external ones)
      if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('mailto:')) {
        // Handle relative paths properly
        let cleanHref = href;

        // If href starts with ../, resolve it relative to the base
        if (href.startsWith('../')) {
          // For ../ paths, we need to go up one directory from the current URL
          // E.g., from /reference/compound_stmts.html, ../ goes to the parent directory
          cleanHref = href.replace(/^\.\.\//, '');

          // Extract the base domain from the full URL
          const urlParts = baseUrl.split('/');
          // Remove the last two parts (filename and directory) to go up one level
          const parentUrl = urlParts.slice(0, -2).join('/');
          const fullUrl = anchor ? `${parentUrl}/${cleanHref}#${anchor}` : `${parentUrl}/${cleanHref}`;
          return `[${strip(text)}](${fullUrl})`;
        } else {
          // Regular relative link
          const fullUrl = anchor ? `${urlBase}/${cleanHref}#${anchor}` : `${urlBase}/${cleanHref}`;
          return `[${strip(text)}](${fullUrl})`;
        }
      }

      // For external links, keep them as-is
      if (href.startsWith('http')) {
        const fullUrl = anchor ? `${href}#${anchor}` : href;
        return `[${strip(text)}](${fullUrl})`;
      }

      // For other malformed links, just return the text
      return strip(text);
    })
    // Remove remaining broken or malformed links
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, (_match, text) => strip(text || ''))
    .replace(/<link[^>]*>/gi, "")
    // Remove navigation, header, and reference elements
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<div[^>]*class="[^"]*headerlink[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    // Handle code blocks BEFORE removing other tags
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, p1) => "\n```python\n" + decode(p1).trim() + "\n```\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => "`" + decode(p1).trim() + "`")
    // Handle definition lists (common in Python docs)
    .replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, (_m, p1) => `**${strip(decode(p1))}**\n`)
    .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (_m, p1) => `${strip(decode(p1))}\n\n`)
    .replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (_m, p1) => p1)
    // Handle lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p1) => `- ${strip(decode(p1))}\n`)
    .replace(/<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi, (_m, p1) => p1 + "\n")
    // Handle headings
    .replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, _level, text) => `\n### ${strip(decode(text))}\n`)
    // Handle text formatting
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
    // Handle paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p1) => strip(decode(p1)) + "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove ALL remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Clean up special characters and symbols
    .replace(/¶/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    // Clean up extra whitespace
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

  // Step 1: Find the exact anchor position
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

  // Step 2: Look for the heading that comes after this anchor
  // The anchor is inside a section, and the heading comes after it
  const afterAnchor = html.slice(anchorPos);
  const headingMatch = afterAnchor.match(/<h([2-6])\b[^>]*>(.*?)<\/h\1>/i);

  let headingText = '';
  let headingEndPos = anchorPos;

  if (headingMatch && typeof headingMatch.index === 'number') {
    headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();
    headingEndPos = anchorPos + headingMatch.index + headingMatch[0].length;
  }

  // Step 3: Extract content from after the heading to the next heading
  const afterHeading = html.slice(headingEndPos);
  const nextHeadingMatch = afterHeading.match(/<h[2-6]\b/i);
  const nextHeadingPos = nextHeadingMatch ? headingEndPos + nextHeadingMatch.index! : html.length;

  // Get the section content from heading end to next heading (but limit to reasonable size)
  const maxSectionLength = 8000; // Increased for more content
  const sectionHtml = html.slice(headingEndPos, Math.min(nextHeadingPos, headingEndPos + maxSectionLength));

  // Step 4: Extract meaningful content from the section
  // Look for multiple paragraphs, code examples, and definition lists
  const paragraphs = [...sectionHtml.matchAll(/<p\b[^>]*>(.*?)<\/p>/gis)];
  const codeBlocks = [...sectionHtml.matchAll(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis)];
  const defLists = [...sectionHtml.matchAll(/<dl\b[^>]*>(.*?)<\/dl>/gis)];

  let contentText = '';

  // Extract first 6-8 paragraphs for better context
  const maxParagraphs = 8;
  for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
    const paragraph = htmlToMarkdown(paragraphs[i][0], full).trim();
    if (paragraph && paragraph.length > 5 && !paragraph.includes('¶')) { // Skip permalink paragraphs
      contentText += paragraph + '\n\n';
    }
  }

  // Add definition lists (common in Python docs for syntax)
  for (let i = 0; i < Math.min(defLists.length, 2) && contentText.length < 800; i++) {
    const defList = htmlToMarkdown(defLists[i][0], full).trim();
    if (defList && defList.length > 20) {
      contentText += defList + '\n\n';
    }
  }

  // Add first 2 code examples if available and content isn't too long
  for (let i = 0; i < Math.min(codeBlocks.length, 2) && contentText.length < 900; i++) {
    const codeExample = htmlToMarkdown(codeBlocks[i][0], full).trim();
    if (codeExample && codeExample.includes('```')) {
      contentText += codeExample + '\n\n';
    }
  }

  // If still minimal content, extract more from the raw section
  if (contentText.length < 150) {
    const rawContent = htmlToMarkdown(sectionHtml.slice(0, 4000), full).trim();
    if (rawContent.length > contentText.length) {
      contentText = rawContent;
    }
  }

  // Ensure we have meaningful content
  if (contentText.length < 50) {
    throw new Error(`Insufficient content extracted for anchor ${anchor}`);
  }

  // Step 5: Truncate if too long and format result
  if (contentText.length > 1500) {
    contentText = contentText.slice(0, 1500).trim() + '...';
  }

  const titleLine = headingText ? `### ${headingText}\n\n` : '';
  const result = (titleLine + contentText).trim();

  return result;
}

export function activate(context: vscode.ExtensionContext) {
  // Register command to clear cache
  const clearCacheCommand = vscode.commands.registerCommand('pythonHover.clearCache', async () => {
    // Get all keys from global state
    const allKeys = context.globalState.keys();
    const cacheKeys = allKeys.filter(key => key.startsWith('pyDocs:'));

    // Clear all cache entries
    for (const key of cacheKeys) {
      await context.globalState.update(key, undefined);
    }

    vscode.window.showInformationMessage(`Cleared ${cacheKeys.length} cached Python documentation entries.`);
  });

  const provider: vscode.HoverProvider = {
    async provideHover(doc, position) {
      const range = doc.getWordRangeAtPosition(position, /[A-Za-z_]+/);
      if (!range) return;
      const word = doc.getText(range);
      const info = MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];
      if (!info) {
        return;
      }

      const cfg = vscode.workspace.getConfiguration("pythonHover");
      const ver = (cfg.get<string>("pythonVersion") || "3").trim();
      const cacheDays = cfg.get<number>("cacheDays") ?? 7;
      const baseUrl = `https://docs.python.org/${ver}`;

      const cacheKey = `pyDocs:v6:${ver}:${info.url}#${info.anchor}`;  // v6 to test correct ../ path handling
      const cached = context.globalState.get<{ ts: number; md: string }>(cacheKey);
      const now = Date.now();
      const freshMs = cacheDays * 24 * 60 * 60 * 1000;

      // Check cache first
      let mdBody: string | undefined = undefined;
      if (cached && (now - cached.ts) < freshMs) {
        mdBody = cached.md;
        console.log(`Using cached content for ${word}: ${mdBody.length} chars`);
      }

      if (!mdBody) {
        try {
          console.log(`Fetching fresh content for ${word} from ${baseUrl}/${info.url}#${info.anchor}`);
          mdBody = await getSectionMarkdown(baseUrl, info.url, info.anchor);

          // Add practical examples for certain keywords
          if (word.toLowerCase() === 'class') {
            mdBody += `\n\n**Practical Examples:**\n\n\`\`\`python\nclass MyClass(BaseClass):\n    def __init__(self, param):\n        self.param = param\n    \n    @classmethod\n    def from_string(cls, data):\n        return cls(data)\n    \n    @staticmethod\n    def utility_method():\n        return "helper"\n    \n    @property\n    def value(self):\n        return self.param\n    \n    def __str__(self):\n        return f"MyClass({self.param})"\n\`\`\`\n\n**Common Special Methods:**\n- \`__init__(self)\` - Constructor\n- \`__str__(self)\` - String representation\n- \`__repr__(self)\` - Developer representation\n- \`__len__(self)\` - Length support\n- \`__getitem__(self, key)\` - Index access`;
          } else if (word.toLowerCase() === 'def') {
            mdBody += `\n\n**Examples:**\n\n\`\`\`python\n# Basic function\ndef greet(name):\n    return f"Hello, {name}!"\n\n# Function with default arguments\ndef create_user(name, age=25, active=True):\n    return {"name": name, "age": age, "active": active}\n\n# Function with *args and **kwargs\ndef flexible_func(*args, **kwargs):\n    print(f"Args: {args}, Kwargs: {kwargs}")\n\n# Function with type hints\ndef calculate(x: int, y: int) -> int:\n    return x + y\n\`\`\``;
          } else if (word.toLowerCase() === 'import') {
            mdBody += `\n\n**Examples:**\n\n\`\`\`python\n# Basic imports\nimport os\nimport sys\nfrom pathlib import Path\nfrom collections import defaultdict, Counter\n\n# Aliased imports\nimport numpy as np\nfrom datetime import datetime as dt\n\n# Relative imports (in packages)\nfrom .models import User\nfrom ..utils import helper_function\n\n# Conditional imports\ntry:\n    import optional_module\nexcept ImportError:\n    optional_module = None\n\`\`\``;
          } else if (word.toLowerCase() === 'try') {
            mdBody += `\n\n**Examples:**\n\n\`\`\`python\n# Basic exception handling\ntry:\n    result = risky_operation()\nexcept ValueError as e:\n    print(f"Invalid value: {e}")\nexcept FileNotFoundError:\n    print("File not found")\nelse:\n    print("No exceptions occurred")\nfinally:\n    cleanup_resources()\n\n# Multiple exception types\ntry:\n    data = json.loads(text)\nexcept (ValueError, TypeError) as e:\n    print(f"JSON error: {e}")\n\n# Re-raising exceptions\ntry:\n    process_data()\nexcept Exception as e:\n    log_error(e)\n    raise  # Re-raise the same exception\n\`\`\``;
          }

          await context.globalState.update(cacheKey, { ts: now, md: mdBody });
          console.log(`Cached fresh content for ${word}: ${mdBody.length} chars`);
        } catch (error) {
          console.error(`Failed to fetch content for ${word}:`, error);
          // Show a more helpful error message to the user
          const errorMsg = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Python Keyword Hovers: Failed to fetch docs for '${word}': ${errorMsg}`);
          return undefined;
        }
      }

      // If we still don't have content, don't show a hover
      if (!mdBody) {
        return undefined;
      }

      // Always append official link
      mdBody += `\n\n[Open official docs](${baseUrl}/${info.url}#${info.anchor})`;

      const md = new vscode.MarkdownString(mdBody);
      md.isTrusted = true;
      return new vscode.Hover(md, range);
    }
  };

  context.subscriptions.push(
    clearCacheCommand,
    vscode.languages.registerHoverProvider({ language: "python" }, provider)
  );
}

export function deactivate() {}
