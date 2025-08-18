import * as vscode from 'vscode';
import { getConfig } from './config';
import { MAP } from './data/map';
import { getSectionMarkdown } from './docs/sections';
import { createHoverProvider } from './hover';

// MAP and constants moved to ./data/map

// Enhanced contextual analysis
// Context detection moved to ./context

// Build a clickable list of Python special methods linking to the Data Model page
// Examples and special methods moved to ./examples

// Enhanced example generation
// Examples moved to ./examples

// Rest of your existing functions (fetchText, htmlToMarkdown, etc.)
// Fetch, HTML conversion, and section extraction moved to ./docs and ./utils

export function activate(context: vscode.ExtensionContext) {
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
        const { pythonVersion } = getConfig();
        const baseUrl = `https://docs.python.org/${pythonVersion}`;
        try {
            // Invalidate session cache for this section so we re-run the latest extraction pipeline
            try { (await import('./docs/sections')).invalidateSectionSessionCache(baseUrl, info.url, info.anchor); } catch {}
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
        const { pythonVersion } = getConfig();
        const ver = pythonVersion;
        const baseUrl = `https://docs.python.org/${ver}`;
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
        const { pythonVersion } = getConfig();
        const baseUrl = `https://docs.python.org/${pythonVersion}`;
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
        const { pythonVersion } = getConfig();
        const ver = pythonVersion;
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
        const { cacheDays } = getConfig();
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
        const { pythonVersion } = getConfig();
        const url = `https://docs.python.org/${pythonVersion}/${info.url}#${info.anchor}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    });

    // Open docs inside VS Code (Simple Browser). Accepts optional URL argument.
    const openDocsInEditorWithUrl = vscode.commands.registerCommand('pythonHover.openDocsInEditorWithUrl', async (urlArg?: string) => {
        let url = urlArg;
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
            const { pythonVersion } = getConfig();
            url = `https://docs.python.org/${pythonVersion}/${info.url}#${info.anchor}`;
        }
        try {
            await vscode.commands.executeCommand('simpleBrowser.show', url);
        } catch (e) {
            // Fallback to external if simple browser isn't available
            await vscode.env.openExternal(vscode.Uri.parse(url!));
        }
    });

    // Toggle enhanced examples on/off
    const toggleExamples = vscode.commands.registerCommand('pythonHover.toggleExamples', async () => {
        const cfg = vscode.workspace.getConfiguration('pythonHover');
        const current = cfg.get<boolean>('showExamples') ?? true;
        await cfg.update('showExamples', !current, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Enhanced examples ${!current ? 'enabled' : 'disabled'}.`);
    });

    const provider: vscode.HoverProvider = createHoverProvider(context);

    context.subscriptions.push(
        debugExtraction,
        clearCacheCommand,
        refreshContentCommand,
        showStatisticsCommand,
        showAllSpecialMethodsCmd,
        openDocsAtCursor,
    toggleExamples,
    openDocsInEditorWithUrl,
        copyHoverText,
        insertClassTemplate,
        insertIfTemplate,
        insertTryTemplate,
        vscode.languages.registerHoverProvider({ language: "python" }, provider)
    );
}

export function deactivate() { }
