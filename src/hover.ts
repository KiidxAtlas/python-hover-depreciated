import * as vscode from 'vscode';
import { getConfig } from './config';
import { getContextualInfo } from './context';
import { BUILTIN_KEYWORDS, DATA_TYPES, getDunderInfo, MAP, TYPING_CONSTRUCTS } from './data/map';
import { getSectionMarkdown } from './docs/sections';
import { buildSpecialMethodsSection, getEnhancedExamples } from './examples';
import { getMethodExample, isKnownMethod, resolveMethodInfo } from './features/methodResolver';
import { resolveImportInfo } from './typeResolver';
import { Info } from './types';
import { createDocsCacheKey, createHotCacheKey } from './utils/cacheKeys';
import { ensureClosedFences, smartTruncateMarkdown } from './utils/markdown';
import { createSafeMarkdownString } from './utils/security';

/**
 * Detect operators at the given position
 */
function detectOperatorAtPosition(doc: vscode.TextDocument, position: vscode.Position): { range: vscode.Range; word: string } | null {
    const line = doc.lineAt(position.line);
    const lineText = line.text;
    const char = position.character;

    // Check for multi-character operators first (longest match)
    const operators = ['==', '!=', '<=', '>=', '//', '**', '<<', '>>', '+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>='];

    for (const op of operators) {
        const startPos = char - op.length + 1;
        if (startPos >= 0 && startPos + op.length <= lineText.length) {
            const textAtPos = lineText.substring(startPos, startPos + op.length);
            if (textAtPos === op) {
                const range = new vscode.Range(position.line, startPos, position.line, startPos + op.length);
                return { range, word: op };
            }
        }
    }

    // If no multi-character operator found, try single-character operators
    if (char < lineText.length) {
        const singleOps = ['+', '-', '*', '/', '%', '<', '>', '=', '&', '|', '^', '~'];
        const charAtPos = lineText[char];
        if (singleOps.includes(charAtPos)) {
            const range = new vscode.Range(position.line, char, position.line, char + 1);
            return { range, word: charAtPos };
        }
    }

    return null;
}

/**
 * Get module-specific quick reference information
 */
function getModuleQuickReference(moduleName: string): string | null {
    const quickRefs: Record<string, string> = {
        'os': '`os.getcwd()`, `os.listdir()`, `os.path.join()`, `os.makedirs()`, `os.remove()`',
        'sys': '`sys.argv`, `sys.version`, `sys.path`, `sys.exit()`, `sys.platform`',
        'math': '`math.pi`, `math.sqrt()`, `math.sin()`, `math.floor()`, `math.ceil()`',
        'random': '`random.randint()`, `random.choice()`, `random.shuffle()`, `random.random()`',
        'json': '`json.loads()`, `json.dumps()`, `json.load()`, `json.dump()`',
        'datetime': '`datetime.now()`, `datetime.date()`, `datetime.timedelta()`, `strftime()`',
        're': '`re.search()`, `re.match()`, `re.findall()`, `re.sub()`, `re.compile()`',
        'pathlib': '`Path()`, `Path.exists()`, `Path.mkdir()`, `Path.glob()`, `Path.read_text()`',
        'collections': '`Counter()`, `defaultdict()`, `deque()`, `OrderedDict()`, `namedtuple()`',
        'itertools': '`itertools.chain()`, `combinations()`, `permutations()`, `cycle()`, `count()`'
    };

    return quickRefs[moduleName] || null;
}

/**
 * Enhanced hover provider with error boundaries and debouncing
 */
class EnhancedHoverProvider implements vscode.HoverProvider {
    private pendingRequests = new Map<string, NodeJS.Timeout>();
    private readonly debounceMs = 50;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async provideHover(doc: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
        const key = `${doc.uri.toString()}:${position.line}:${position.character}`;

        // Cancel previous pending request for same position
        const pending = this.pendingRequests.get(key);
        if (pending) {
            clearTimeout(pending);
        }

        // Debounce rapid hover requests
        return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
                this.pendingRequests.delete(key);
                let currentWord = '';
                try {
                    const range = doc.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
                    if (range) {
                        currentWord = doc.getText(range);
                    } else {
                        // Try operators
                        const operatorResult = detectOperatorAtPosition(doc, position);
                        if (operatorResult) {
                            currentWord = operatorResult.word;
                        }
                    }

                    const result = await this.doProvideHover(doc, position);
                    resolve(result);
                } catch (error) {
                    // Log error for debugging but don't show to user
                    console.error('Hover provider error:', error);

                    // Return a fallback hover with basic information
                    try {
                        let range = doc.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
                        let word = '';

                        if (range) {
                            word = doc.getText(range);
                        } else {
                            // Try operators for fallback too
                            const operatorResult = detectOperatorAtPosition(doc, position);
                            if (operatorResult) {
                                range = operatorResult.range;
                                word = operatorResult.word;
                            }
                        }

                        if (range && word) {
                            const fallbackMsg = new vscode.MarkdownString('Documentation temporarily unavailable. Try again in a moment.');
                            fallbackMsg.isTrusted = true;
                            resolve(new vscode.Hover(fallbackMsg, range));
                        } else {
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                }
            }, this.debounceMs);

            this.pendingRequests.set(key, timeout);
        });
    }

    private async doProvideHover(doc: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
        const startTime = Date.now();

        const { contextAware, includeBuiltins, showExamples, maxContentLength, pythonVersion, cacheDays, includeDataTypes, includeConstants, includeExceptions, summaryOnly, showSpecialMethodsSection, includeDunderMethods, offlineOnly, showActionLinks, openTarget, prominentDisplay, includeStringMethods, includeListMethods, includeDictMethods, includeSetMethods, includeModuleInfo, showSignatures, enhancedMethodResolution, showPracticalExamples } = getConfig();

        // Try to get word range - first try normal identifiers, then operators
        let range = doc.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        let word = '';

        if (range) {
            word = doc.getText(range);
        } else {
            // Try to detect operators at the current position
            const operatorResult = detectOperatorAtPosition(doc, position);
            if (operatorResult) {
                range = operatorResult.range;
                word = operatorResult.word;
            }
        }

        if (!range || !word) return null;
        let info: Info | undefined;

        // Enhanced method resolution - check for method calls first
        if (enhancedMethodResolution && isKnownMethod(word)) {
            // Check if this is a method call (has a dot before it)
            const lineText = doc.lineAt(position.line).text;
            const beforeWord = lineText.substring(0, range.start.character);
            const dotMatch = beforeWord.match(/(\w+)\s*\.\s*$/);

            if (dotMatch) {
                const receiverName = dotMatch[1];
                // Check method inclusion settings
                const methodInfo = resolveMethodInfo(doc, position, word, undefined);
                if (methodInfo) {
                    const methodTypes = ['string', 'list', 'dict', 'set'];
                    const includeFlags = [includeStringMethods, includeListMethods, includeDictMethods, includeSetMethods];

                    // For now, allow all if any are enabled
                    if (includeFlags.some(flag => flag)) {
                        info = methodInfo;
                    }
                }
            }
        }

        // Check for import statements with enhanced module display
        if (!info && includeModuleInfo) {
            const importInfo = resolveImportInfo(doc, position, word);
            if (importInfo) {
                // Create a more prominent module hover that takes precedence
                const moduleMarkdown = new vscode.MarkdownString();
                moduleMarkdown.isTrusted = false; // Module links should be external only
                moduleMarkdown.supportHtml = false;

                // Get base URL from config
                const { getDocsBaseUrl: getBaseUrl } = await import('./config');
                const baseUrl = getBaseUrl();

                // Create a clean, prominent module documentation display
                const moduleTitle = `## 🐍 ${importInfo.title}`;
                const moduleLink = `${baseUrl}/${importInfo.url}`;

                let moduleContent = `${moduleTitle}\n\n`;

                // Add direct action links at the top for immediate access
                const actions = [
                    `[📖 Open Documentation](${moduleLink})`,
                    `[📋 Copy URL](command:pythonHover.copyDocsUrl?${encodeURIComponent(JSON.stringify([moduleLink]))})`,
                    `[🔍 Open in Editor](command:pythonHover.openDocsInEditorWithUrl?${encodeURIComponent(JSON.stringify([moduleLink]))})`
                ];
                moduleContent += `${actions.join(' · ')}\n\n`;

                // Add a clean separator and brief description
                moduleContent += `---\n\n`;
                moduleContent += `**Module**: \`${word}\`  \n`;
                moduleContent += `**Type**: Python Standard Library Module  \n`;
                moduleContent += `**Documentation**: [${importInfo.title}](${moduleLink})  \n\n`;

                // Add module-specific quick reference if available
                const moduleQuickRef = getModuleQuickReference(word);
                if (moduleQuickRef) {
                    moduleContent += `### Quick Reference\n${moduleQuickRef}\n\n`;
                }

                moduleContent += `*Click "📖 Open Documentation" above for complete module documentation.*`;

                // Use safe markdown creation - this has command URIs so needs to be trusted and validated
                const safeModuleMarkdown = createSafeMarkdownString(moduleContent, true);
                return new vscode.Hover(safeModuleMarkdown, range);
            }
        }

        // Use context-aware mapping when enabled; otherwise fall back to static map
        if (!info && contextAware) info = getContextualInfo(doc, position, word);
        if (!info) info = MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];

        // Type-aware attribute/method: obj.attr or obj.method(); best-effort mapping to stdtypes
        let usedTypeAware = false;
        if (!info) {
            const { typeAwareHovers } = getConfig();
            if (typeAwareHovers) {
                try {
                    const lineText = doc.lineAt(position.line).text;
                    // Find receiver before the dot immediately preceding the current word
                    // e.g.,  foo.bar  or  foo.bar(  -> receiver: foo, member: bar
                    const upto = lineText.substring(0, range.end.character);
                    const dotIdx = upto.lastIndexOf('.');
                    if (dotIdx >= 0) {
                        // Extract receiver name just before the dot
                        const before = upto.substring(0, dotIdx);
                        const m = before.match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/);
                        if (m) {
                            const receiver = m[1];
                            const { resolveTypeInfoForAttribute } = await import('./typeResolver');
                            const resolved = await resolveTypeInfoForAttribute(doc, position, receiver, word);
                            if (resolved) { info = resolved; usedTypeAware = true; }
                        }
                    }
                } catch { /* ignore */ }
            }
        }

        // Dunder mapping when enabled - now with enhanced context
        if (!info && includeDunderMethods && /^__.*__$/.test(word)) {
            info = getDunderInfo(word);
        }

        const lower = word.toLowerCase();
        // Preserve original behavior: includeBuiltins=false hides built-ins AND data types
        if (!includeBuiltins && (BUILTIN_KEYWORDS.includes(lower) || DATA_TYPES.includes(lower))) return null;
        // Additional control: when built-ins are included, allow separately hiding data types
        if (!includeDataTypes && DATA_TYPES.includes(lower)) return null;
        // Allow typing constructs when built-ins are enabled (they're considered advanced built-ins)
        if (!includeBuiltins && TYPING_CONSTRUCTS.includes(word)) return null;
        if (includeBuiltins && !includeDataTypes && DATA_TYPES.includes(lower)) return null;
        if (!includeConstants && ['None', 'True', 'False'].includes(word)) return null;
        // Allow hiding exceptions via config
        if (!includeExceptions && ['Exception', 'BaseException', 'ValueError', 'TypeError', 'KeyError', 'IndexError', 'StopIteration'].includes(word)) return null;

        if (!info) return null;

        const { getDocsBaseUrl } = await import('./config');
        const baseUrl = getDocsBaseUrl();

        // Use enhanced cache manager instead of global session cache
        const { CacheManager } = await import('./utils/cache');
        const cacheManager = CacheManager.getInstance();

        const sessionHotKey = createHotCacheKey(pythonVersion, info.url, info.anchor);
        const cacheKey = createDocsCacheKey(pythonVersion, info.url, info.anchor);
        const cached = this.context.globalState.get<{ ts: number; md: string }>(cacheKey);
        const now = Date.now();
        const freshMs = cacheDays * 24 * 60 * 60 * 1000;

        let mdBody: string | undefined = undefined;
        if (cached && (now - cached.ts) < freshMs) mdBody = cached.md;

        // Check hot in-memory cache next (very fast)
        const hot = cacheManager.get<{ md: string }>(sessionHotKey);
        if (!mdBody && hot) {
            mdBody = hot.md;
        }

        // If offline mode and we have no cached content, bail early to avoid network errors
        if (!mdBody && offlineOnly) {
            // give user a minimal hint to open official docs
            mdBody = `*(offline mode) No cached documentation found for this item.*`;
        }

        if (!mdBody && !offlineOnly) {
            try {
                mdBody = await getSectionMarkdown(baseUrl, info.url, info.anchor || '');
                await this.context.globalState.update(cacheKey, { ts: now, md: mdBody });

                // Store in enhanced cache manager with 10 minute TTL
                try {
                    cacheManager.set(sessionHotKey, { md: mdBody }, 1000 * 60 * 10);
                } catch { }
            } catch (error) {
                mdBody = '';
            }
        }

        const docsBody = ensureClosedFences(mdBody || '');
        // Extract first grammar fence (```text ... with ::= inside) to move it later for readability
        const splitGrammarFence = (md: string): { without: string; fence: string } => {
            try {
                const fenceRe = /```[a-zA-Z]*[\r\n]([\s\S]*?)```/g;
                let m: RegExpExecArray | null;
                while ((m = fenceRe.exec(md))) {
                    const block = m[0];
                    const inner = m[1] || '';
                    if (/::=/.test(inner)) {
                        const without = md.slice(0, m.index) + md.slice(m.index + block.length);
                        return { without: ensureClosedFences(without.trim()), fence: ensureClosedFences(block.trim()) };
                    }
                }
            } catch { }
            return { without: md, fence: '' };
        };
        const { without: docsNoGrammar, fence: grammarFence } = splitGrammarFence(docsBody);

        // Detect glossary terms in docs text and prepare a compact Related section with links
        const buildRelatedLinks = (): string => {
            try {
                const txt = (docsBody || '').toLowerCase();
                if (!txt) return '';
                const rel: Array<{ label: string; href: string }> = [];
                const add = (label: string, href: string) => {
                    const full = href.startsWith('http') ? href : `${baseUrl.replace(/\/$/, '')}/${href.replace(/^\//, '')}`;
                    if (!rel.find(r => r.label === label)) rel.push({ label, href: full });
                };
                const checks: Array<[RegExp, string, string]> = [
                    [/\bdecorator(s)?\b/i, 'Decorator', 'glossary.html#term-decorator'],
                    [/\bcontext manager(s)?\b/i, 'Context manager', 'glossary.html#term-context-manager'],
                    [/\biterator(s)?\b/i, 'Iterator', 'glossary.html#term-iterator'],
                    [/\bgenerator(s)?\b/i, 'Generator', 'glossary.html#term-generator'],
                    [/\bcoroutine(s)?\b/i, 'Coroutine', 'glossary.html#term-coroutine'],
                    [/\bcomprehension(s)?\b/i, 'Comprehension', 'glossary.html#term-comprehension'],
                    [/\bnamespace(s)?\b/i, 'Namespace', 'glossary.html#term-namespace'],
                    [/\bmetaclass(es)?\b/i, 'Metaclass', 'reference/datamodel.html#metaclasses'],
                    [/\bmapping(s)?\b/i, 'Mapping', 'glossary.html#term-mapping'],
                    [/\bsequence(s)?\b/i, 'Sequence', 'glossary.html#term-sequence'],
                    [/\bscope(s)?\b/i, 'Scope', 'glossary.html#term-scope'],
                    [/\bglobal statement\b/i, 'global statement', 'reference/simple_stmts.html#global'],
                    [/\bnonlocal statement\b/i, 'nonlocal statement', 'reference/simple_stmts.html#nonlocal'],
                    [/\bexceptions?\b/i, 'Exceptions', 'reference/executionmodel.html#exceptions'],
                    [/\braise statement\b/i, 'raise statement', 'reference/simple_stmts.html#raise']
                ];
                for (const [re, label, href] of checks) {
                    if (re.test(docsBody)) add(label, href);
                    if (rel.length >= 4) break;
                }
                if (!rel.length) return '';
                const links = rel.map(r => `[${r.label}](${r.href})`).join(' · ');
                return `\nRelated: ${links}\n`;
            } catch { return ''; }
        };
        const relatedLinks = summaryOnly ? '' : buildRelatedLinks();
        const typeAwareHint = usedTypeAware ? `
_Type-aware_: resolved member to a concrete type based on nearby code (best-effort).
` : '';
        // If this is a dunder hover, also add a direct link to its specific anchor for clarity
        let dunderDirectLink = '';
        if (/^__.*__$/.test(word)) {
            dunderDirectLink = `See: [${word}](${baseUrl}/reference/datamodel.html#object.${word})\n`;
        }

        let examplesBody = '';
        // Always show examples for common syntax keywords (def, class, import, try, with, for, if, while)
        const MUST_SHOW_EXAMPLES = ['def', 'class', 'import', 'try', 'with', 'for', 'if', 'while'];
        // Build special methods section independently so it shows even when enhanced examples are disabled
        let specialMethodsBody = '';
        if (showSpecialMethodsSection && lower === 'class') {
            // show special methods regardless of showExamples; builder is best-effort and respects doc/position
            specialMethodsBody = buildSpecialMethodsSection(baseUrl, doc, position);
        }
        // Show examples when enabled OR when the symbol is a core syntax element we always want examples for
        if (!summaryOnly && (showExamples || MUST_SHOW_EXAMPLES.includes(lower))) {
            if (showPracticalExamples) {
                examplesBody = getEnhancedExamples(word, baseUrl, doc, position) || '';
            } else {
                // Fallback to method-specific examples
                if (enhancedMethodResolution && isKnownMethod(word)) {
                    examplesBody = getMethodExample(word) || '';
                }
            }
        }

        const fullUrl = `${baseUrl}/${info.url}#${info.anchor}`;
        let linkBody = `\n\n[📖 Open official docs](${fullUrl})`;
        if (showActionLinks) {
            const actions: string[] = [];
            const encoded = encodeURIComponent(JSON.stringify([fullUrl]));
            const openLabel = openTarget === 'external' ? 'Open in Browser' : 'Open in Editor';
            actions.push(`[${openLabel}](command:pythonHover.openDocsInEditorWithUrl?${encoded})`);
            actions.push(`[Copy URL](command:pythonHover.copyDocsUrl?${encoded})`);
            actions.push(`[Copy Section](command:pythonHover.copyHoverText)`);
            try {
                const { showActionsInsertTemplates } = await import('./config').then(m => m.getConfig());
            } catch { /* ignore */ }
            // Insert templates when enabled
            try {
                const cfg = await import('./config').then(m => m.getConfig());
                if (cfg.showActionsInsertTemplates) {
                    if (lower === 'class') actions.push(`[Insert Class Template](command:pythonHover.insertClassTemplate)`);
                    if (lower === 'try') actions.push(`[Insert Try Template](command:pythonHover.insertTryTemplate)`);
                    if (['if', 'with', 'for', 'while'].includes(lower)) actions.push(`[Insert If Template](command:pythonHover.insertIfTemplate)`);
                }
            } catch { /* ignore */ }
            linkBody += `\n${actions.join(' · ')}`;
        }

        let finalBody: string;
        const unlimited = (maxContentLength ?? 0) <= 0;
        if (unlimited) {
            const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
            let body = ensureClosedFences((docsNoGrammar ? docsNoGrammar + '\n\n' : '') + combinedExamples + (relatedLinks ? relatedLinks + '\n' : '') + (typeAwareHint || '') + (dunderDirectLink || ''));
            if (!body.endsWith('\n\n')) body += '\n\n';
            finalBody = body + (grammarFence ? grammarFence + '\n\n' : '') + linkBody.trimStart();
        } else if (!examplesBody && !specialMethodsBody) {
            let docs = docsNoGrammar;
            if (docs.length > maxContentLength) docs = smartTruncateMarkdown(docs, maxContentLength);
            let safeDocs = ensureClosedFences(docs + (relatedLinks ? '\n' + relatedLinks : '') + (typeAwareHint ? '\n' + typeAwareHint : '') + (dunderDirectLink ? '\n' + dunderDirectLink : ''));
            if (!safeDocs.endsWith('\n\n')) safeDocs += '\n\n';
            finalBody = safeDocs + (grammarFence ? grammarFence + '\n\n' : '') + linkBody.trimStart();
        } else {
            const totalBudget = Math.max(500, maxContentLength);
            const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
            const minExamplesBudget = Math.min(combinedExamples.length, Math.max(500, Math.floor(totalBudget * 0.40)), 1400);
            const linkBudget = Math.min(linkBody.length + 10, 200);
            let docsBudget = totalBudget - minExamplesBudget - linkBudget;
            if (docsBudget < 300) docsBudget = Math.max(200, Math.floor(totalBudget * 0.25));
            let docsPart = docsNoGrammar;
            if (docsPart.length > docsBudget) docsPart = smartTruncateMarkdown(docsPart, docsBudget);
            let examplesPart = combinedExamples;
            if (examplesPart.length > minExamplesBudget) examplesPart = smartTruncateMarkdown(examplesPart, minExamplesBudget);
            let safeBody = ensureClosedFences((docsPart ? docsPart + '\n\n' : '') + examplesPart + (relatedLinks ? '\n' + relatedLinks : '') + (typeAwareHint ? '\n' + typeAwareHint : '') + (dunderDirectLink ? '\n' + dunderDirectLink : ''));
            if (!safeBody.endsWith('\n\n')) safeBody += '\n\n';
            finalBody = safeBody + (grammarFence ? grammarFence + '\n\n' : '') + linkBody.trimStart();
        }

        // Convert docs.python.org links into command URIs so clicks reliably open the
        // docs in the Simple Browser (or fallback external) via our command handler.
        // Important: skip rewriting inside fenced code blocks (```), since links there are
        // displayed as literal text and aren't clickable; rewriting just adds noise.
        const transformLinksOutsideCode = (text: string): string => {
            const lines = text.split(/\r?\n/);
            let inFence = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (/^```/.test(line)) {
                    inFence = !inFence;
                    continue;
                }
                if (!inFence) {
                    lines[i] = line.replace(/\]\((https:\/\/docs\.python\.org\/[^)]+)\)/gi, (_m, url) => {
                        try {
                            const encoded = encodeURIComponent(JSON.stringify([url]));
                            return `](command:pythonHover.openDocsInEditorWithUrl?${encoded})`;
                        } catch {
                            return `](${url})`;
                        }
                    });
                }
            }
            return lines.join('\n');
        };
        const finalProcessed = transformLinksOutsideCode(finalBody);

        // Create enhanced hover UI with better formatting and safe markdown handling
        let enhancedContent = '';

        // Add compact title with emoji - controlled by compactDisplay setting
        if (info.title) {
            const { compactDisplay } = getConfig();
            const titleEmoji = word.startsWith('__') ? '🔧' :
                BUILTIN_KEYWORDS.includes(word.toLowerCase()) ? '⚡' :
                    TYPING_CONSTRUCTS.includes(word) ? '🏷️' : '🐍';

            if (compactDisplay) {
                // Compact display for top alignment - no separators or extra spacing
                if (prominentDisplay) {
                    enhancedContent += `## ${titleEmoji} **${info.title}**\n\n`;
                } else {
                    enhancedContent += `**${titleEmoji} ${info.title}**\n\n`;
                }
            } else {
                // Traditional display with separators
                if (prominentDisplay) {
                    enhancedContent += `---\n## ${titleEmoji} **${info.title}**\n---\n\n`;
                } else {
                    enhancedContent += `# ${titleEmoji} ${info.title}\n\n`;
                }
            }
        }

        // Add the main content immediately after title
        enhancedContent += finalProcessed;

        // Add footer - compact if compactDisplay is enabled
        if (!enhancedContent.includes('📖 Open official docs')) {
            const { compactDisplay } = getConfig();
            if (compactDisplay) {
                enhancedContent += '\n\n';
            } else {
                enhancedContent += '\n\n---\n';
            }

            if (prominentDisplay) {
                enhancedContent += `**📖 [➤ VIEW FULL PYTHON DOCUMENTATION](${fullUrl})**`;
            } else {
                enhancedContent += `*🔗 [View in Python Documentation](${fullUrl})*`;
            }
        }

        // Use safe markdown creation - check if content has command URIs
        const hasCommands = enhancedContent.includes('command:pythonHover.');
        const md = createSafeMarkdownString(enhancedContent, hasCommands);

        // Add subtle version info for debugging (only in dev mode)
        if (process.env.NODE_ENV === 'development') {
            md.appendMarkdown('\n\n---\n\n*Python Hover v2.4.5*');
        }

        return new vscode.Hover(md, range);
    }

    /**
     * Cleanup method to clear pending requests
     */
    dispose(): void {
        for (const timeout of this.pendingRequests.values()) {
            clearTimeout(timeout);
        }
        this.pendingRequests.clear();
    }
}

/**
 * Create the enhanced hover provider with error handling and debouncing
 */
export const createHoverProvider = (context: vscode.ExtensionContext): vscode.HoverProvider => {
    return new EnhancedHoverProvider(context);
};
