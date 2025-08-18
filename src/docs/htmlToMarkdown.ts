function strip(s: string) { return s.replace(/\s+/g, ' ').trim(); }
function decode(s: string) {
    if (!s) return s;
    // Named entities we commonly see in Python docs
    let out = s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&hellip;/g, '...');

    // Decimal numeric entities: &#64; -> @
    out = out.replace(/&#(\d+);/g, (_m, code) => {
        try { return String.fromCharCode(parseInt(code, 10)); } catch { return '' }
    });

    // Hex numeric entities: &#x40; -> @
    out = out.replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
        try { return String.fromCharCode(parseInt(hex, 16)); } catch { return '' }
    });

    return out;
}

export function htmlToMarkdown(html: string, baseUrl: string): string {
    // Lazy import to avoid circular deps; get grammar limits from config
    let limitLines = 8, maxChars = 600;
    try {
        const { getConfig } = require('../config');
        const cfg = getConfig();
        limitLines = Math.max(1, Math.min(30, Number(cfg.limitGrammarLines ?? 8)));
        maxChars = Math.max(100, Math.min(3000, Number(cfg.grammarMaxChars ?? 600)));
    } catch { /* use defaults */ }
    // Fast-path for short inputs: avoid heavy regex churn for small fragments
    // Fast-path for short inputs: decode entities first so small Sphinx/grammar
    // fragments like `"&#64;"` or numeric entities are converted before tags
    // are stripped. This avoids showing raw HTML entities in hovers.
    if (!html || html.length < 400) {
        const decoded = decode(html);
        // Preserve links even in fast path: convert <a href> into markdown links first
        let small = decoded.replace(/<a[^>]*href=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi, (_m, h1, h2, h3, inner) => {
            let href = h1 || h2 || h3 || '';
            const label = strip(decode(inner || ''));
            if (!href) return label;

            // Handle versioned paths before trying URL constructor to prevent incorrect URLs
            if (/^\d+(?:\.\d+)?\//.test(href)) {
                const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                const ver = versionMatch ? versionMatch[1] : '3';
                // Replace the version number in the href instead of prepending
                const pathWithoutVersion = href.replace(/^\d+(?:\.\d+)?\//, '');
                return `[${label}](https://docs.python.org/${ver}/${pathWithoutVersion})`;
            }

            try {
                // Normalize whitespace-split docs URLs like "https://docs. 3.13/reference/..."
                try {
                    const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                    const ver = versionMatch ? versionMatch[1] : '3';
                    const m = href.match(/^https:\/\/docs\.(?:python\.org\/)?\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/i);
                    if (m) {
                        const tail = String(m[1]).replace(/^\d+(?:\.\d+)?\//, '');
                        href = `https://docs.python.org/${ver}/${tail}`;
                    }
                } catch { /* ignore */ }
                const resolved = new URL(href, baseUrl).toString();
                return `[${label}](${resolved})`;
            } catch {
                return `[${label}](${href})`;
            }
        });
        // Strip any remaining tags
        small = small.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        // Apply minimal heuristics for critical cross-refs even in fast-path
        try {
            const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
            const ver = versionMatch ? versionMatch[1] : '3';
            const datamodelUrl = `https://docs.python.org/${ver}/reference/datamodel.html#types`;
            // Link only the phrase after "see section" so text reads naturally
            small = small.replace(/\b([Ss]ee section)\s+(the\s+standard\s+type\s+hierarchy)\b/, (_m, prefix, phrase) => {
                return `${prefix} [${phrase}](${datamodelUrl})`;
            });
            // If not already linked anywhere, link the plain phrase
            if (!small.includes(datamodelUrl)) {
                small = small.replace(/\b(The\s+standard\s+type\s+hierarchy|standard\s+type\s+hierarchy)\b/ig, (_m, p1) => `[${p1}](${datamodelUrl})`);
            }
        } catch { }
        // Auto-link PEP references like "PEP 8" -> https://peps.python.org/pep-0008/
        try {
            small = small.replace(/\bPEP\s*(\d{1,4})\b/g, (_m, n) => {
                const num = String(n).padStart(4, '0');
                return `[PEP ${Number(n)}](https://peps.python.org/pep-${num}/)`;
            });
        } catch { }
        // Remove stray numeric footnotes like [4]
        small = small.replace(/\[\d+\]/g, '');

        // Repair whitespace-split docs URLs and bare versioned paths in plain text
        try {
            const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
            const ver = versionMatch ? versionMatch[1] : '3';
            // Merge whitespace after host and fill python.org, forcing current base version
            small = small.replace(/https:\/\/docs\.\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/gi, (_m, rest) => {
                const tail = String(rest).replace(/^\d+(?:\.\d+)?\//, '');
                return `https://docs.python.org/${ver}/${tail}`;
            });
            // Normalize any remaining https://docs.* hostnames
            small = small.replace(/https:\/\/docs\.(?!python\.org)/gi, 'https://docs.python.org/');
            // Collapse whitespace after docs.python.org/ and force current base version
            small = small.replace(/https:\/\/docs\.python\.org\/\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/gi, (_m, rest) => {
                const tail = String(rest).replace(/^\d+(?:\.\d+)?\//, '');
                return `https://docs.python.org/${ver}/${tail}`;
            });
            // Prefix bare versioned reference/library paths with docs host (force base version)
            small = small.replace(/(^|\s)(\d+(?:\.\d+)?\/(?:reference|library)\/[\w\-\/\.\#]+)/g, (_m, pre, path) => {
                const tail = String(path).replace(/^\d+(?:\.\d+)?\//, '');
                return `${pre}https://docs.python.org/${ver}/${tail}`;
            });
        } catch { }
        return small;
    }

    // Remove scripts/styles and a few noisy blocks first using non-greedy matching.
    let work = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<div[^>]*class="[^"]*admonition[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*(sidebar|seealso)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<sup[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
        .replace(/<a[^>]*class="[^"]*footnote-reference[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
        .replace(/<a[^>]*class="[^"]*fn-backref[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

    let urlBase: string;
    if (baseUrl.includes('://')) urlBase = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    else urlBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    // Production lists -> fenced code (grammar). Handle in one pass.
    work = work.replace(/<div[^>]*class="[^"]*productionlist[^"]*"[^>]*>[\s\S]*?<\/div>/gi, (m) => {
        const inner = m.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n');
        const lines = decode(inner).split('\n').map(s => s.trim());
        // Keep only grammar-ish lines containing ::= to avoid pulling prose into the code block
        const grammar = lines.filter(s => s && /::=/.test(s));
        if (!grammar.length) return '';
        const text = grammar.join('\n');
        return `\n\n\`\`\`text\n${text}\n\`\`\`\n\n`;
    });

    // IMPORTANT: Process links BEFORE converting pre/code blocks to avoid order-of-operations issues
    // Replace links intelligently, but operate on smaller chunks to avoid scanning entire page repeatedly.
    work = work.replace(/<a[^>]*href="([^"]*?)(?:#([^"]*))?"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, anchor, text) => {
        try {
            const baseForResolve = baseUrl && baseUrl.includes('://') ? baseUrl : (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
            if (!href) return strip(text);
            // Normalize whitespace-split docs URLs like "https://docs. 3.13/reference/..."
            try {
                const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                const ver = versionMatch ? versionMatch[1] : '3';
                const m = (href as string).match(/^https:\/\/docs\.(?:python\.org\/)?\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/i);
                if (m) {
                    const tail = String(m[1]).replace(/^\d+(?:\.\d+)?\//, '');
                    href = `https://docs.python.org/${ver}/${tail}`;
                }
            } catch { /* ignore */ }
            // If it's a fragment-only link (#anchor), resolve against the page URL
            if (href.startsWith('#')) {
                try {
                    const resolvedFrag = new URL(href, baseForResolve).toString();
                    return `[${strip(text)}](${resolvedFrag})`;
                } catch { return strip(text); }
            }
            // resolve relative hrefs against the page/base URL using the URL constructor
            let resolved: string;
            try {
                const hrefWithAnchor = anchor ? `${href}#${anchor}` : href;
                resolved = new URL(hrefWithAnchor, baseForResolve).toString();
            } catch {
                if (href.startsWith('http')) resolved = anchor ? `${href}#${anchor}` : href;
                else resolved = (baseForResolve.replace(/\/$/, '') + '/' + href.replace(/^\//, '')) + (anchor ? `#${anchor}` : '');
            }
            return `[${strip(text)}](${resolved})`;
        } catch (e) {
            return strip(text);
        }
    });

    // Convert highlight + pre blocks AFTER link processing
    // Important: Don't strip ALL HTML tags since we've already processed links to markdown
    work = work.replace(/<div[^>]*class="[^"]*highlight[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gi, (_m, p1) => {
        // Remove only specific HTML tags, but preserve markdown links that have already been processed
        let inner = p1 as string;
        // Remove spans and other formatting tags, but preserve the text content and markdown links
        inner = inner.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
        inner = inner.replace(/<code[^>]*>/g, '').replace(/<\/code>/g, '');
        // Decode HTML entities
        inner = decode(inner);
        const code = inner.replace(/\n{3,}/g, '\n\n').trim();
        return `\n\n\`\`\`python\n${code}\n\`\`\`\n\n`;
    });

    // Convert <pre><code> blocks AFTER link processing
    work = work.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, p1) => "\n```python\n" + decode(p1).trim() + "\n```\n");

    // Generic replacements for remaining tags. Operating on the reduced 'work' variable is cheaper.
    let md = work
        // Note: link processing already happened above, so we skip the fallback anchor processing
        .replace(/<link[^>]*>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<div[^>]*class="[^"]*headerlink[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => "`" + decode(p1).trim() + "`")
        .replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, (_m, p1) => `**${strip(decode(p1))}**\n`)
        .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (_m, p1) => `${strip(decode(p1))}\n\n`)
        .replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (_m, p1) => p1)
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p1) => `- ${strip(decode(p1))}\n`)
        .replace(/<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi, (_m, p1) => p1 + "\n")
        .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, _level, rawText) => {
            // Convert heading inner HTML to plain text, but strip any markdown links that
            // may have been produced earlier (keep only their labels) and drop headerlink icons.
            let text = strip(decode(rawText));
            // Remove markdown links inside headings entirely (keep label only)
            text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
            // Drop the paragraph sign or empty artifacts
            text = text.replace(/[¶]+/g, '').replace(/\[\]\([^)]*\)/g, '').trim();
            // Remove leading section numbers like "8.1." if present
            text = text.replace(/^\d+(?:\.\d+)*\.\s*/, '').trim();
            return `\n### ${text}\n`;
        })
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
        .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
        .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
        .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p1) => strip(decode(p1)) + "\n\n")
        .replace(/<br\s*\/?>(?=\n?)/gi, "\n")
        .replace(/<[^>]+>/g, '')
        .replace(/\u00b6/g, '')
        // Remove bracketed numeric footnotes left in text e.g., [5]
        .replace(/\s\[\d+\]/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s+\n/g, "\n\n");

    md = md.replace(/\n{3,}/g, "\n\n").trim();
    // Keep links as generated above. Do minimal stray-fragment cleanup.
    md = md.replace(/\bhtml#grammar-[^\s)\]]+/gi, '');

    // Heuristic fix: repair missing/cut cross-reference links for 'The standard type hierarchy' and similar phrases.
    try {
        const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
        const ver = versionMatch ? versionMatch[1] : '3';
        const datamodelUrl = `https://docs.python.org/${ver}/reference/datamodel.html#types`;
        // Replace broken markdown links
        md = md.replace(/\[([^\]]*standard type hierarchy[^\]]*)\]\(https:\/\/docs\.[^\s)\]]*\)/ig, (_m, txt) => {
            return `[${txt}](${datamodelUrl})`;
        });
        // Replace "see section <phrase>" with link on the phrase only
        md = md.replace(/\b([Ss]ee section)\s+(the\s+standard\s+type\s+hierarchy)\b/, (_m, prefix, phrase) => {
            return `${prefix} [${phrase}](${datamodelUrl})`;
        });
        // If the datamodel link already exists, avoid additional phrase linking to prevent nested links
        if (!md.includes(datamodelUrl)) {
            // If the phrase appears but there is no docs.python.org link yet, inject a link on the phrase
            if (/standard\s+type\s+hierarchy/i.test(md) && !/docs\.python\.org\//i.test(md)) {
                md = md.replace(/\b(The\s+standard\s+type\s+hierarchy|standard\s+type\s+hierarchy)\b/ig, (_m, p1) => `[${p1}](${datamodelUrl})`);
            }
        }
    } catch { /* best-effort repair */ }
    // Quick cleanup: fix truncated or partial docs links like "https://docs." or
    // whitespace-split docs URLs that appear when attributes are sliced.
    // Examples to repair:
    //   - https://docs. 3.13/reference/expressions → https://docs.python.org/3.13/reference/expressions
    //   - https://docs.python.org/ 3.13/reference/… → https://docs.python.org/3.13/reference/…
    //   - 3.13/reference/expressions (bare) → https://docs.python.org/3.13/reference/expressions
    try {
        const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
        const ver = versionMatch ? versionMatch[1] : '3';
        // Merge whitespace after host and fill python.org, forcing current base version
        md = md.replace(/https:\/\/docs\.\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/gi, (_m, rest) => {
            const tail = String(rest).replace(/^\d+(?:\.\d+)?\//, '');
            return `https://docs.python.org/${ver}/${tail}`;
        });
        // Normalize any remaining https://docs.* hostnames
        md = md.replace(/https:\/\/docs\.(?!python\.org)/gi, 'https://docs.python.org/');
        // Collapse whitespace after docs.python.org/ and force current base version
        md = md.replace(/https:\/\/docs\.python\.org\/\s+((?:\d+(?:\.\d+)?\/)?[\w\-\/\.\#]+)/gi, (_m, rest) => {
            const tail = String(rest).replace(/^\d+(?:\.\d+)?\//, '');
            return `https://docs.python.org/${ver}/${tail}`;
        });
        // Prefix bare versioned paths with docs host (force base version)
        // Split by markdown links to avoid modifying URLs inside links
        const linkParts = md.split(/(\[[^\]]*\]\([^)]*\))/);
        md = linkParts.map((part, index) => {
            // Skip markdown link parts (odd indices)
            if (index % 2 === 1) return part;

            // Apply repair only to non-link parts
            return part.replace(/(^|\s)(\d+(?:\.\d+)?\/(?:reference|library)\/[\w\-\/\.\#]+)/g, (_m, pre, path) => {
                const tail = String(path).replace(/^\d+(?:\.\d+)?\//, '');
                return `${pre}https://docs.python.org/${ver}/${tail}`;
            });
        }).join('');
    } catch { }

    // Convert stray EBNF / grammar lines that include '::=' into small fenced code
    // blocks. These lines often appear inline in Sphinx-produced fragments and
    // make hover content noisy; showing them as code is clearer than raw markup.
    try {
        md = md.replace(/^(?:(?!```)[^\n])*::=.*$/gim, (m) => {
            let line = strip(decode(m));
            // Strip markdown links and emphasis that may have been introduced earlier
            line = line.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
            line = line.replace(/\*\*([^*]+)\*\*/g, '$1');
            line = line.replace(/\*([^*]+)\*/g, '$1');
            // Remove backticks around tokens
            line = line.replace(/`([^`]+)`/g, '$1');
            // If prose follows the grammar on the same line (common in Sphinx),
            // split the line so only the grammar is fenced and prose remains as text.
            // Heuristic: look for a capitalized sentence start after the ::= portion.
            const opIdx = line.indexOf('::=');
            if (opIdx >= 0) {
                const after = line.slice(opIdx + 3);
                const candidates = [' It ', ' This ', ' Then ', ' If ', ' A ', ' An ', ' The '];
                let splitAt = -1;
                for (const c of candidates) {
                    const idx = after.indexOf(c);
                    if (idx >= 0) {
                        const abs = opIdx + 3 + idx;
                        if (splitAt === -1 || abs < splitAt) splitAt = abs;
                    }
                }
                if (splitAt > -1) {
                    let grammar = line.slice(0, splitAt).trim();
                    // Split multiple productions on a single line into separate lines
                    grammar = grammar.replace(/\s+([A-Za-z_][A-Za-z0-9_]*\s*::=)/g, '\n$1');
                    const prose = line.slice(splitAt).trim();
                    const fenced = grammar ? `\n\n\`\`\`text\n${grammar}\n\`\`\`\n` : '';
                    return fenced + (prose ? `\n${prose}\n` : '');
                }
            }
            // No prose split; still format grammar nicely by splitting multiple productions
            let grammarOnly = line.replace(/\s+([A-Za-z_][A-Za-z0-9_]*\s*::=)/g, '\n$1');
            // Limit lines/chars to avoid overwhelming the hover (configurable)
            const lines = grammarOnly.split('\n').slice(0, limitLines);
            let joined = lines.join('\n');
            if (joined.length > maxChars) joined = joined.slice(0, maxChars).trim() + ' …';
            return "\n\n```text\n" + joined + "\n```\n";
        });
    } catch { }

    // Auto-link PEP references like "PEP 8" -> https://peps.python.org/pep-0008/
    try {
        md = md.replace(/\bPEP\s*(\d{1,4})\b/g, (_m, n) => {
            const num = String(n).padStart(4, '0');
            return `[PEP ${Number(n)}](https://peps.python.org/pep-${num}/)`;
        });
    } catch { }

    // Auto-link common cross-references if not already linked
    try {
        const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
        const ver = versionMatch ? versionMatch[1] : '3';
        const exceptionsUrl = `https://docs.python.org/${ver}/reference/executionmodel.html#exceptions`;
        const raiseUrl = `https://docs.python.org/${ver}/reference/simple_stmts.html#raise`;
        const booleanOpsUrl = `https://docs.python.org/${ver}/reference/expressions.html#boolean-operations`;
        const withStmtUrl = `https://docs.python.org/${ver}/reference/compound_stmts.html#with`;
        const decoratorUrl = `https://docs.python.org/${ver}/glossary.html#term-decorator`;
        const namespaceUrl = `https://docs.python.org/${ver}/glossary.html#term-namespace`;
        const scopeUrl = `https://docs.python.org/${ver}/glossary.html#term-scope`;
        const globalStmtUrl = `https://docs.python.org/${ver}/reference/simple_stmts.html#global`;
        const nonlocalStmtUrl = `https://docs.python.org/${ver}/reference/simple_stmts.html#nonlocal`;
        if (!md.includes(exceptionsUrl)) {
            md = md.replace(/\b(Exceptions)\b(?!\])/g, (_m, t) => `[${t}](${exceptionsUrl})`);
        }
        if (!md.includes(raiseUrl)) {
            md = md.replace(/\b(The raise statement|raise statement)\b(?!\])/gi, (_m, t) => `[${t}](${raiseUrl})`);
        }
        if (!md.includes(booleanOpsUrl)) {
            md = md.replace(/\b(Boolean operations?)\b(?!\])/gi, (_m, t) => `[${t}](${booleanOpsUrl})`);
        }
        if (!md.includes(withStmtUrl)) {
            md = md.replace(/\b(The with statement|with statement)\b(?!\])/gi, (_m, t) => `[${t}](${withStmtUrl})`);
        }
        if (!md.includes(decoratorUrl)) {
            md = md.replace(/\b(decorator|decorators)\b(?!\])/gi, (_m, t) => `[${t}](${decoratorUrl})`);
        }
        if (!md.includes(namespaceUrl)) {
            md = md.replace(/\b(namespace|namespaces)\b(?!\])/gi, (_m, t) => `[${t}](${namespaceUrl})`);
        }
        if (!md.includes(scopeUrl)) {
            md = md.replace(/\b(scope|scopes)\b(?!\])/gi, (_m, t) => `[${t}](${scopeUrl})`);
        }
        if (!md.includes(globalStmtUrl)) {
            md = md.replace(/\b(global statement)\b(?!\])/gi, (_m, t) => `[${t}](${globalStmtUrl})`);
        }
        if (!md.includes(nonlocalStmtUrl)) {
            md = md.replace(/\b(nonlocal statement)\b(?!\])/gi, (_m, t) => `[${t}](${nonlocalStmtUrl})`);
        }
    } catch { }

    // Normalize plain 'Examples:' labels into a markdown heading to improve structure
    try {
        // Perform this outside code fences; simple approach is acceptable as 'Examples:' rarely appears inside code
        md = md.replace(/(^|\n)\s*Examples:\s*(?=\n|$)/g, '\n\n### Examples:\n\n');
    } catch { }

    // Convert decorator + function definition snippets into fenced python blocks when they appear as plain lines
    try {
        // Scan lines and wrap consecutive @... lines followed by a def/async def line
        const lines = md.split(/\r?\n/);
        const out: string[] = [];
        let i = 0;
        while (i < lines.length) {
            // Skip if inside an existing fence
            if (/^```/.test(lines[i])) {
                out.push(lines[i++]);
                while (i < lines.length && !/^```/.test(lines[i])) out.push(lines[i++]);
                if (i < lines.length) out.push(lines[i++]);
                continue;
            }
            if (/^@\S/.test(lines[i])) {
                const start = i;
                let j = i;
                while (j < lines.length && /^@\S/.test(lines[j])) j++;
                if (j < lines.length && /^(?:async\s+)?def\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(lines[j])) {
                    // include the def line
                    j++;
                    // Optionally include one simple following line (e.g., 'pass') if it's inline or indented
                    if (j < lines.length && (/^\s{0,4}(pass|\.\.\.|return\b)/.test(lines[j]) || /^\s{4}/.test(lines[j]))) j++;
                    const block = lines.slice(start, j).join('\n');
                    out.push('```python');
                    out.push(block);
                    out.push('```');
                    i = j;
                    continue;
                }
            }
            out.push(lines[i++]);
        }
        md = out.join('\n');
    } catch { }

    // Final sanitization: some markdown links may still be malformed because the
    // original HTML was sliced mid-attribute and the URL portion contains spaces
    // or stray markup (e.g., "https://docs. **funcdef** ..."). Convert those into
    // safe links where possible, otherwise drop the URL and keep the label.
    try {
        md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
            try {
                let u = (url || '').trim();
                // If URL contains whitespace, take only the first token (most likely the real URL)
                if (/\s/.test(u)) {
                    // Special case: handle split docs URL where host and path are separated
                    const joinDocs = u.match(/^https:\/\/docs\.(?:python\.org\/)?\s+((?:\d+(?:\.\d+)?\/)?.+)/i);
                    if (joinDocs) {
                        const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                        const ver = versionMatch ? versionMatch[1] : '3';
                        const tail = joinDocs[1].replace(/^\d+(?:\.\d+)?\//, '');
                        u = `https://docs.python.org/${ver}/${tail}`;
                    } else {
                        u = u.split(/\s+/)[0];
                    }
                }
                // Trim trailing punctuation that commonly leaks into slices
                u = u.replace(/[\),.;:]+$/g, '');
                if (!u) return strip(decode(label));
                // Normalize truncated docs.* hostnames
                if (/^https:\/\/docs\.(?!python\.org)/i.test(u)) {
                    u = u.replace(/^https:\/\/docs\.(.*)$/i, 'https://docs.python.org/$1');
                }
                // Prefix versioned reference paths like '3.13/reference/expressions' with docs.python.org
                if (/^\d+(?:\.\d+)?\/.+/.test(u)) {
                    const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                    const ver = versionMatch ? versionMatch[1] : '3';
                    const tail = u.replace(/^\d+(?:\.\d+)?\//, '');
                    u = `https://docs.python.org/${ver}/${tail.replace(/^\//, '')}`;
                }
                // Collapse whitespace after docs.python.org if any slipped through
                u = u.replace(/^https:\/\/docs\.python\.org\/\s+((?:\d+(?:\.\d+)?\/)?\/.+)/i, (_mm: string, rest: string) => {
                    const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
                    const ver = versionMatch ? versionMatch[1] : '3';
                    const tail = String(rest).replace(/^\d+(?:\.\d+)?\//, '').replace(/^\//, '');
                    return `https://docs.python.org/${ver}/${tail}`;
                });
                // If it's a plausible absolute URL, keep it; otherwise fall back to plain text
                if (/^https?:\/\//i.test(u)) return `[${strip(decode(label))}](${u})`;
                return strip(decode(label));
            } catch {
                return strip(decode(label));
            }
        });
    } catch { }

    // Remove stray numeric footnotes like [4]
    md = md.replace(/\[\d+\]/g, '');
    return md;
}
