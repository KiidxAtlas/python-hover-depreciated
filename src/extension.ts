import * as vscode from 'vscode';
import { getConfig } from './config';
import { MAP } from './data/map';
import { getSectionMarkdown } from './docs/sections';
import { createHoverProvider } from './hover';
import { CacheManager } from './utils/cache';
import { HttpClient } from './utils/http';

// MAP and constants moved to ./data/map

// Enhanced contextual analysis
// Context detection moved to ./context

// Build a clickable list of Python special methods linking to the Data Model page
// Examples and special methods moved to ./examples

// Enhanced example generation
// Examples moved to ./examples

// Rest of your existing functions (fetchText, htmlToMarkdown, etc.)
// Fetch, HTML conversion, and section extraction moved to ./docs and ./utils

/**
 * Initialize enhanced systems for better performance and features
 */
async function initializeEnhancedSystems(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Initialize cache manager with disk persistence
        const cacheManager = CacheManager.getInstance();
        cacheManager.initialize(context);

        // Initialize HTTP client with retry configuration
        const httpClient = HttpClient.getInstance();
        httpClient.updateFromConfig();

        // Set up periodic cache cleanup
        const cleanupInterval = setInterval(() => {
            cacheManager.cleanupExpired();
        }, 10 * 60 * 1000); // Every 10 minutes

        context.subscriptions.push({
            dispose: () => clearInterval(cleanupInterval)
        });

        console.log('Enhanced systems initialized successfully');
    } catch (error) {
        console.warn('Failed to initialize enhanced systems:', error);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Python Hover extension activated');

    // Initialize enhanced systems
    initializeEnhancedSystems(context);

    // PRIORITY: Register hover provider FIRST for higher priority over other extensions
    const provider: vscode.HoverProvider = createHoverProvider(context);

    // Register with a single comprehensive selector for maximum coverage and priority
    const documentSelector: vscode.DocumentSelector = [
        { language: "python", scheme: "file" },
        { language: "python", scheme: "untitled" }
    ];

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(documentSelector, provider)
    );

    // Register commands
    const debugExtraction = vscode.commands.registerCommand('pythonHover.debugExtraction', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file and place the cursor on a supported keyword to debug extraction.');
            return;
        }
        const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]+/);
        if (!range) {
            vscode.window.showInformationMessage('No Python keyword found at cursor position.');
            return;
        }
        const word = editor.document.getText(range);
        const info = (MAP as any)[word] || (MAP as any)[word.toLowerCase()];
        if (!info) {
            vscode.window.showInformationMessage(`No docs mapping found for '${word}'.`);
            return;
        }
        const { getDocsBaseUrl } = await import('./config');
        const baseUrl = getDocsBaseUrl();
        try {
            // Invalidate session cache for this section so we re-run the latest extraction pipeline
            try { (await import('./docs/sections')).invalidateSectionSessionCache(baseUrl, info.url, info.anchor); } catch { }
            const md = await getSectionMarkdown(baseUrl, info.url, info.anchor);
            // Rewrite docs.python.org links to our command so clicks open in the Simple Browser
            const processed = md.replace(/\]\((https:\/\/docs\.python\.org\/[^)]+)\)/gi, (_m, url) => {
                try {
                    const encoded = encodeURIComponent(JSON.stringify([url]));
                    return `](command:pythonHover.openDocsInEditorWithUrl?${encoded})`;
                } catch {
                    return `](${url})`;
                }
            });
            const doc = await vscode.workspace.openTextDocument({ content: processed, language: 'markdown' });
            const editorShown = await vscode.window.showTextDocument(doc, { preview: true });
            // Also open the Markdown preview to the side for clickable links
            try {
                await vscode.commands.executeCommand('markdown.showPreviewToSide', doc.uri);
            } catch { /* ignore if preview not available */ }
        } catch (e: any) {
            const msg = e?.message || String(e);
            vscode.window.showErrorMessage(`Debug Extraction failed: ${msg}`);
        }
    });
    const showAllSpecialMethodsCmd = vscode.commands.registerCommand('pythonHover.showAllSpecialMethods', async () => {
        const { getDocsBaseUrl } = await import('./config');
        const baseUrl = getDocsBaseUrl();
        const dm = `${baseUrl}/reference/datamodel.html`;
        // Use helper index, and annotate which are implemented in the active editor/class
        const { getSpecialMethodsIndex, detectImplementedSpecialMethods } = await import('./examples');
        const methods = getSpecialMethodsIndex(baseUrl);
        const editor = vscode.window.activeTextEditor;
        const implemented = detectImplementedSpecialMethods(editor?.document, editor?.selection.active);

        const items = methods.map(m => ({
            label: m.label,
            description: (implemented.has(m.label) ? 'implemented — ' : '') + (m.description || ''),
            url: m.url
        }));

        const pick = await vscode.window.showQuickPick(items, {
            matchOnDescription: true,
            placeHolder: 'Select a special method to open its documentation'
        });
        if (pick) await vscode.env.openExternal(vscode.Uri.parse((pick as any).url));
    });

    // Copy current hover content (if any) from the selection word by reconstructing markdown similarly
    const copyHoverText = vscode.commands.registerCommand('pythonHover.copyHoverText', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file to copy hover content.');
            return;
        }
        const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]+/);
        if (!range) return;
        const word = editor.document.getText(range);
        const info = (MAP as any)[word] || (MAP as any)[word.toLowerCase()];
        if (!info) {
            vscode.window.showInformationMessage(`No docs mapping found for '${word}'.`);
            return;
        }
        const { getDocsBaseUrl } = await import('./config');
        const baseUrl = getDocsBaseUrl();
        try {
            const md = await getSectionMarkdown(baseUrl, info.url, info.anchor);
            await vscode.env.clipboard.writeText(md);
            vscode.window.showInformationMessage('Hover documentation copied to clipboard.');
        } catch (e: any) {
            vscode.window.showWarningMessage(`Could not fetch docs to copy: ${e?.message || e}`);
        }
    });

    // Insert a class template at cursor for quick-start
    const insertClassTemplate = vscode.commands.registerCommand('pythonHover.insertClassTemplate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file to insert a class template.');
            return;
        }
        const snippet = new vscode.SnippetString(
            [
                'class ${1:ClassName}:',
                '    def __init__(self${2:, value}):',
                '        ${3:pass}',
                '',
                '    def __repr__(self):',
                "        return f'${1:ClassName}()'",
                '',
                '    def __str__(self):',
                "        return self.__repr__()",
                '',
                '    def __eq__(self, other):',
                '        return isinstance(other, ${1:ClassName}) and vars(self) == vars(other)',
                ''
            ].join('\n')
        );
        await editor.insertSnippet(snippet, editor.selection.active);
    });
    // Insert an if/elif/else template at cursor
    const insertIfTemplate = vscode.commands.registerCommand('pythonHover.insertIfTemplate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file to insert an if statement template.');
            return;
        }
        const snippet = new vscode.SnippetString(
            [
                'if ${1:condition}:',
                '    ${2:pass}',
                'elif ${3:other_condition}:',
                '    ${4:pass}',
                'else:',
                '    ${5:pass}'
            ].join('\n')
        );
        await editor.insertSnippet(snippet, editor.selection.active);
    });
    // Insert a try/except/else/finally template at cursor
    const insertTryTemplate = vscode.commands.registerCommand('pythonHover.insertTryTemplate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file to insert a try statement template.');
            return;
        }
        const snippet = new vscode.SnippetString(
            [
                'try:',
                '    ${1:pass}',
                'except ${2:Exception} as ${3:e}:',
                '    ${4:handle_error}',
                'else:',
                '    ${5:pass}',
                'finally:',
                '    ${6:cleanup}'
            ].join('\n')
        );
        await editor.insertSnippet(snippet, editor.selection.active);
    });
    const clearCacheCommand = vscode.commands.registerCommand('pythonHover.clearCache', async () => {
        const { CACHE_PREFIXES, isCacheKey } = await import('./utils/cacheKeys');
        const allKeys = context.globalState.keys();

        // Clear all cache types using centralized cache key detection
        const cacheKeys = allKeys.filter(key => isCacheKey(key));

        let clearedCount = 0;
        for (const key of cacheKeys) {
            await context.globalState.update(key, undefined);
            clearedCount++;
        }

        // Clear all in-memory caches
        try {
            // Clear hot cache manager
            const { CacheManager } = await import('./utils/cache');
            const cacheManager = CacheManager.getInstance();
            cacheManager.clear();
        } catch { }

        try {
            // Clear global hot cache
            (globalThis as any).__pyHoverHotCache?.clear?.();
        } catch { }

        try {
            // Clear section session cache
            (await import('./docs/sections')).invalidateSectionSessionCache();
        } catch { }

        vscode.window.showInformationMessage(
            `🗑️ Cleared ${clearedCount} cached entries and all in-memory caches. Next hover will fetch fresh documentation.`
        );
    });

    const refreshContentCommand = vscode.commands.registerCommand('pythonHover.refreshContent', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Please open a Python file to refresh hover content.');
            return;
        }

        const position = editor.selection.active;
        const range = editor.document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        if (!range) {
            vscode.window.showInformationMessage('No Python keyword found at cursor position.');
            return;
        }

        const word = editor.document.getText(range);

        // Enhanced lookup that includes builtin functions and dunder methods
        const { getContextualInfo } = await import('./context');
        const info = getContextualInfo(editor.document, position, word) || MAP[word] || MAP[word.toLowerCase()];

        if (!info) {
            vscode.window.showInformationMessage(`'${word}' is not a supported Python keyword or function.`);
            return;
        }

        // Clear cache for this specific keyword using centralized cache key management
        const { pythonVersion } = getConfig();
        const { createDocsCacheKey, createHotCacheKey, createSectionCacheKey, getCacheKeysByPrefix } = await import('./utils/cacheKeys');
        const allKeys = context.globalState.keys();

        // Clear all related cache entries for this word
        const docsCacheKey = createDocsCacheKey(pythonVersion, info.url, info.anchor);
        const hotCacheKey = createHotCacheKey(pythonVersion, info.url, info.anchor);

        // Find all section cache keys that might match
        const sectionKeys = getCacheKeysByPrefix(allKeys, 'sec:').filter(key =>
            key.includes(info.url) && (info.anchor ? key.includes(info.anchor) : true)
        );

        const keysToDelete = [docsCacheKey, hotCacheKey, ...sectionKeys];

        let clearedCount = 0;
        for (const key of keysToDelete) {
            await context.globalState.update(key, undefined);
            clearedCount++;
        }

        // Clear in-memory caches for this item
        try {
            const { CacheManager } = await import('./utils/cache');
            const cacheManager = CacheManager.getInstance();
            // Clear the specific hot cache entry
            cacheManager.delete(hotCacheKey);
        } catch { }

        try {
            (await import('./docs/sections')).invalidateSectionSessionCache(undefined, info.url, info.anchor);
        } catch { }

        vscode.window.showInformationMessage(
            `🔄 Refreshed documentation for '${word}' (cleared ${clearedCount} cache entries). Next hover will fetch fresh content.`
        );
    });

    const showStatisticsCommand = vscode.commands.registerCommand('pythonHover.showStatistics', async () => {
        const { CACHE_PREFIXES, getCacheKeysByPrefix } = await import('./utils/cacheKeys');
        const allKeys = context.globalState.keys();
        const cacheKeys = getCacheKeysByPrefix(allKeys, CACHE_PREFIXES.DOCS);

        let totalSize = 0;
        let expiredCount = 0;
        const now = Date.now();
        const { cacheDays } = getConfig();
        const freshMs = cacheDays * 24 * 60 * 60 * 1000;

        const entriesByType: Record<string, number> = {};
        let oldestEntry: Date | undefined;
        let newestEntry: Date | undefined;

        for (const key of cacheKeys) {
            const cached = context.globalState.get<{ ts: number; md: string }>(key);
            if (cached) {
                totalSize += cached.md.length;

                const entryDate = new Date(cached.ts);
                if (!oldestEntry || entryDate < oldestEntry) {
                    oldestEntry = entryDate;
                }
                if (!newestEntry || entryDate > newestEntry) {
                    newestEntry = entryDate;
                }

                if (now - cached.ts > freshMs) {
                    expiredCount++;
                }

                // Count by cache type
                const prefix = Object.entries(CACHE_PREFIXES).find(([, p]) => key.startsWith(p))?.[0] || 'UNKNOWN';
                entriesByType[prefix] = (entriesByType[prefix] || 0) + 1;
            }
        }

        // Get in-memory cache stats
        let memoryStats = '';
        try {
            const { CacheManager } = await import('./utils/cache');
            const cacheManager = CacheManager.getInstance();
            const stats = cacheManager.getStats();
            const memStats = cacheManager.getMemoryStats();
            memoryStats = `\n• In-memory entries: ${stats.size} (${stats.hitRate * 100}% hit rate)`;
            memoryStats += `\n• Memory usage: ${(memStats.currentSize / 1024 / 1024).toFixed(1)}MB / ${(memStats.maxSize / 1024 / 1024).toFixed(1)}MB`;
        } catch { }

        const message = [
            `📊 Python Hover Cache Statistics:`,
            `• Total entries: ${cacheKeys.length}`,
            `• Expired entries: ${expiredCount}`,
            `• Total cache size: ${(totalSize / 1024).toFixed(1)} KB`,
            `• Cache duration: ${cacheDays} days`,
            memoryStats,
            oldestEntry ? `• Oldest entry: ${oldestEntry.toLocaleDateString()}` : '',
            newestEntry ? `• Newest entry: ${newestEntry.toLocaleDateString()}` : '',
            Object.entries(entriesByType).length > 0 ? `• By type: ${Object.entries(entriesByType).map(([k, v]) => `${k}:${v}`).join(', ')}` : ''
        ].filter(Boolean).join('\n');

        vscode.window.showInformationMessage(message);
    });

    // Open the official docs for the symbol at cursor
    const openDocsAtCursor = vscode.commands.registerCommand('pythonHover.openDocsAtCursor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'python') {
            vscode.window.showWarningMessage('Open a Python file to open docs.');
            return;
        }
        const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]+/);
        if (!range) return;
        const word = editor.document.getText(range);
        const info = (MAP as any)[word] || (MAP as any)[word.toLowerCase()];
        if (!info) {
            vscode.window.showInformationMessage(`No docs mapping found for '${word}'.`);
            return;
        }
        const { getDocsBaseUrl } = await import('./config');
        const base = getDocsBaseUrl();
        const url = `${base}/${info.url}#${info.anchor}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    });

    // Open docs inside VS Code (Simple Browser). Accepts optional URL argument.
    const openDocsInEditorWithUrl = vscode.commands.registerCommand('pythonHover.openDocsInEditorWithUrl', async (...args: any[]) => {
        // Support being called via command URI with JSON args or directly with a string
        let url: string | undefined = undefined;
        if (args && args.length) {
            const first = args[0];
            if (typeof first === 'string') url = first;
            else if (Array.isArray(first) && typeof first[0] === 'string') url = first[0];
        }
        if (!url) {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'python') {
                vscode.window.showWarningMessage('Open a Python file to open docs in editor.');
                return;
            }
            const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]+/);
            if (!range) return;
            const word = editor.document.getText(range);
            const info = (MAP as any)[word] || (MAP as any)[word.toLowerCase()];
            if (!info) {
                vscode.window.showInformationMessage(`No docs mapping found for '${word}'.`);
                return;
            }
            const { getDocsBaseUrl } = await import('./config');
            const base = getDocsBaseUrl();
            url = `${base}/${info.url}#${info.anchor}`;
        }
        const { openTarget } = getConfig();
        try {
            if (openTarget === 'external') {
                await vscode.env.openExternal(vscode.Uri.parse(url!));
            } else {
                try {
                    await vscode.commands.executeCommand('simpleBrowser.show', url);
                } catch {
                    await vscode.env.openExternal(vscode.Uri.parse(url!));
                }
            }
        } catch (e) {
            await vscode.env.openExternal(vscode.Uri.parse(url!));
        }
    });

    // Copy the official docs URL for the symbol at cursor (or provided via arg) to clipboard
    const copyDocsUrl = vscode.commands.registerCommand('pythonHover.copyDocsUrl', async (...args: any[]) => {
        let urlFromArg: string | undefined = undefined;
        if (args && args.length) {
            const first = args[0];
            if (typeof first === 'string') urlFromArg = first;
            else if (Array.isArray(first) && typeof first[0] === 'string') urlFromArg = first[0];
        }
        let url = urlFromArg;
        if (!url) {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'python') {
                vscode.window.showWarningMessage('Open a Python file to copy docs URL.');
                return;
            }
            const range = editor.document.getWordRangeAtPosition(editor.selection.active, /[A-Za-z_]+/);
            if (!range) return;
            const word = editor.document.getText(range);
            const info = (MAP as any)[word] || (MAP as any)[word.toLowerCase()];
            if (!info) {
                vscode.window.showInformationMessage(`No docs mapping found for '${word}'.`);
                return;
            }
            const { getDocsBaseUrl } = await import('./config');
            const base = getDocsBaseUrl();
            url = `${base}/${info.url}#${info.anchor}`;
        }
        try {
            await vscode.env.clipboard.writeText(url!);
            vscode.window.showInformationMessage('Copied docs URL to clipboard.');
        } catch (e) {
            vscode.window.showWarningMessage('Failed to copy docs URL.');
        }
    });

    // Toggle enhanced examples on/off
    const toggleExamples = vscode.commands.registerCommand('pythonHover.toggleExamples', async () => {
        const cfg = vscode.workspace.getConfiguration('pythonHover');
        const current = cfg.get<boolean>('showExamples') ?? true;
        await cfg.update('showExamples', !current, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Enhanced examples ${!current ? 'enabled' : 'disabled'}.`);
    });

    // Toggle type-aware hovers on/off
    const toggleTypeAware = vscode.commands.registerCommand('pythonHover.toggleTypeAwareHovers', async () => {
        const cfg = vscode.workspace.getConfiguration('pythonHover');
        const current = cfg.get<boolean>('typeAwareHovers') ?? true;
        await cfg.update('typeAwareHovers', !current, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Type-aware hovers ${!current ? 'enabled' : 'disabled'}.`);
    });

    // Reload extension for priority testing
    const reloadExtension = vscode.commands.registerCommand('pythonHover.reloadExtension', async () => {
        const result = await vscode.window.showInformationMessage(
            'This will reload VS Code to reset extension priorities. Continue?',
            'Reload Window', 'Cancel'
        );
        if (result === 'Reload Window') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    });

    // Test lambda extraction specifically
    const testLambda = vscode.commands.registerCommand('pythonHover.testLambda', async () => {
        try {
            const { getSectionMarkdown } = await import('./docs/sections');
            const { getDocsBaseUrl } = await import('./config');
            const baseUrl = getDocsBaseUrl();

            const info = {
                title: 'lambda — Anonymous Functions',
                url: 'reference/expressions.html',
                anchor: 'lambda-expressions'
            };

            vscode.window.showInformationMessage('Testing lambda extraction...');

            const result = await getSectionMarkdown(baseUrl, info.url, info.anchor);

            // Show first 300 characters
            const preview = result.substring(0, 300) + (result.length > 300 ? '...' : '');

            const doc = await vscode.workspace.openTextDocument({
                content: `# Lambda Extraction Test\n\n**URL:** ${baseUrl}/${info.url}#${info.anchor}\n\n**Length:** ${result.length} characters\n\n**Preview:**\n\n${preview}\n\n**Full Content:**\n\n${result}`,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc, { preview: true });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Lambda test failed: ${error.message}`);
            console.error('Lambda extraction error:', error);
        }
    });

    context.subscriptions.push(
        debugExtraction,
        clearCacheCommand,
        refreshContentCommand,
        showStatisticsCommand,
        showAllSpecialMethodsCmd,
        openDocsAtCursor,
        toggleExamples,
        toggleTypeAware,
        reloadExtension,
        testLambda,
        openDocsInEditorWithUrl,
        copyHoverText,
        insertClassTemplate,
        insertIfTemplate,
        insertTryTemplate,
        copyDocsUrl
    );
}

export function deactivate() { }
