import * as https from 'https';
import { URL } from 'url';
import * as vscode from 'vscode';

type Info = { title: string; url: string; anchor: string; fallback: string };

const MAP: Record<string, Info> = {
  class: {
    title: "class — Class Definitions",
    url: "reference/compound_stmts.html",
    anchor: "class-definitions",
    fallback: "Defines a new class. Supports inheritance, metaclasses, and class suite execution."
  },
  def: {
    title: "def — Function Definitions",
    url: "reference/compound_stmts.html",
    anchor: "function-definitions",
    fallback: "Defines a function/method with parameters, defaults, *args, **kwargs, and annotations."
  },
  return: {
    title: "return — Return Statement",
    url: "reference/simple_stmts.html",
    anchor: "the-return-statement",
    fallback: "Exit a function and optionally return a value. In generators, sets StopIteration(value)."
  },
  with: {
    title: "with — Context Manager",
    url: "reference/compound_stmts.html",
    anchor: "the-with-statement",
    fallback: "Ensures setup/teardown around a block using context managers; guarantees __exit__ runs."
  },
  yield: {
    title: "yield — Yield Expression",
    url: "reference/expressions.html",
    anchor: "yield-expressions",
    fallback: "Creates a generator; yields values and suspends state; `yield from` delegates."
  },
  async: {
    title: "async — Asynchronous Definitions",
    url: "reference/compound_stmts.html",
    anchor: "async-def",
    fallback: "`async def` defines a coroutine function to be scheduled in an event loop."
  },
  await: {
    title: "await — Await Expression",
    url: "reference/expressions.html",
    anchor: "await-expression",
    fallback: "Suspends a coroutine until an awaitable completes; returns its result."
  },
  import: {
    title: "import — Import Statement",
    url: "reference/simple_stmts.html",
    anchor: "the-import-statement",
    fallback: "Loads modules/symbols; supports package imports and aliasing."
  },
  try: {
    title: "try — Exception Handling",
    url: "reference/compound_stmts.html",
    anchor: "the-try-statement",
    fallback: "Handle exceptions with except; run cleanup in finally; optional else when no exception."
  },
  if: {
    title: "if — Conditional Statement",
    url: "reference/compound_stmts.html",
    anchor: "the-if-statement",
    fallback: "Conditional execution via if/elif/else branches."
  },
  for: {
    title: "for — For Statement",
    url: "reference/compound_stmts.html",
    anchor: "the-for-statement",
    fallback: "Iterate over an iterable; optional else runs if loop completes without break."
  }
  // Add more keywords as needed…
};

function fetchText(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		https.get(url, (res: import('http').IncomingMessage) => {
			const statusCode = res.statusCode ?? 0;
			if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
				const next = new URL(res.headers.location as string, url).toString();
				resolve(fetchText(next));
				return;
			}
			if (statusCode >= 400) {
				reject(new Error(`Request failed. Status code: ${statusCode}`));
				return;
			}

			let data = '';
			res.on('data', (chunk: Buffer | string) => (data += chunk.toString()));
			res.on('end', () => resolve(data));
		}).on('error', (err: Error) => reject(err));
	});
}

function htmlToMarkdown(html: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  let md = noScripts
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, p1) => "\n```\n" + decode(p1) + "\n```\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => "`" + decode(p1).trim() + "`")
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${strip(text)}](${href})`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p1) => `- ${strip(p1)}\n`)
    .replace(/<(h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _h, text) => `\n### ${strip(text)}\n`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p1) => strip(p1) + "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
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

  // Find the id="anchor"
  const anchorIdx = html.indexOf(`id="${anchor}"`);
  if (anchorIdx === -1) throw new Error("anchor not found");

  // Find heading start containing this anchor (e.g., <h2 id="class-definitions">)
  const hStart = html.lastIndexOf("<h", anchorIdx);
  if (hStart === -1) throw new Error("heading start not found");

  const headingHead = html.slice(hStart, hStart + 40);
  const hMatch = headingHead.match(/<h([2-4])\b/i);
  const level = hMatch ? Number(hMatch[1]) : 2;

  // Find next heading of same or higher level
  const after = html.slice(anchorIdx + 1);
  const nextHeadingRegex = new RegExp(`<h[2-${level}]\\b`, "i");
  const nextRel = after.search(nextHeadingRegex);
  const sectionHtml = nextRel === -1 ? html.slice(hStart) : html.slice(hStart, anchorIdx + 1 + nextRel);

  return htmlToMarkdown(sectionHtml);
}

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.HoverProvider = {
    async provideHover(doc, position) {
      const range = doc.getWordRangeAtPosition(position, /[A-Za-z_]+/);
      if (!range) return;
      const word = doc.getText(range);
      const info = MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];
      if (!info) return;

      const cfg = vscode.workspace.getConfiguration("pythonKeywordHovers");
      const ver = (cfg.get<string>("pythonVersion") || "3").trim();
      const cacheDays = cfg.get<number>("cacheDays") ?? 7;
      const baseUrl = `https://docs.python.org/${ver}`;

      const cacheKey = `pyDocs:${ver}:${info.url}#${info.anchor}`;
      const cached = context.globalState.get<{ ts: number; md: string }>(cacheKey);
      const now = Date.now();
      const freshMs = cacheDays * 24 * 60 * 60 * 1000;

      let mdBody: string | undefined =
        cached && now - cached.ts < freshMs ? cached.md : undefined;

      if (!mdBody) {
        try {
          mdBody = await getSectionMarkdown(baseUrl, info.url, info.anchor);
          await context.globalState.update(cacheKey, { ts: now, md: mdBody });
        } catch {
          mdBody = info.fallback;
        }
      }
      // Always append official link
      mdBody += `\n\n[Open official docs](${baseUrl}/${info.url}#${info.anchor})`;

      const md = new vscode.MarkdownString(mdBody);
      md.isTrusted = true;
      return new vscode.Hover(md, range);
    }
  };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ language: "python" }, provider)
  );
}

export function deactivate() {}
