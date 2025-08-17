import * as vscode from 'vscode';
import { getConfig } from './config';
import { getContextualInfo } from './context';
import { BUILTIN_KEYWORDS, DATA_TYPES, MAP } from './data/map';
import { getSectionMarkdown } from './docs/sections';
import { buildSpecialMethodsSection, getEnhancedExamples } from './examples';
import { ensureClosedFences, smartTruncateMarkdown } from './utils/markdown';

export const createHoverProvider = (context: vscode.ExtensionContext): vscode.HoverProvider => ({
    async provideHover(doc, position) {
        const { contextAware, includeBuiltins, showExamples, maxContentLength, pythonVersion, cacheDays, includeDataTypes, includeConstants, summaryOnly, showSpecialMethodsSection, offlineOnly, showActionLinks } = getConfig();

        const range = doc.getWordRangeAtPosition(position, /[A-Za-z_]+/);
        if (!range) return;

        const word = doc.getText(range);
        let info: { title: string; url: string; anchor: string } | undefined;

        if (contextAware) info = getContextualInfo(doc, position, word);
        else info = MAP[word as keyof typeof MAP] || MAP[word.toLowerCase()];

        const lower = word.toLowerCase();
        // Preserve original behavior: includeBuiltins=false hides built-ins AND data types
        if (!includeBuiltins && (BUILTIN_KEYWORDS.includes(lower) || DATA_TYPES.includes(lower))) return;
        // Additional control: when built-ins are included, allow separately hiding data types
        if (includeBuiltins && !includeDataTypes && DATA_TYPES.includes(lower)) return;
        if (!includeConstants && ['None', 'True', 'False'].includes(word)) return;

        if (!info) return;

        const ver = pythonVersion;
        const baseUrl = `https://docs.python.org/${ver}`;

        const cacheKey = `pyDocs:v7:${ver}:${info.url}#${info.anchor}`;
        const cached = context.globalState.get<{ ts: number; md: string }>(cacheKey);
        const now = Date.now();
        const freshMs = cacheDays * 24 * 60 * 60 * 1000;

        let mdBody: string | undefined = undefined;
        if (cached && (now - cached.ts) < freshMs) mdBody = cached.md;

        if (!mdBody && !offlineOnly) {
            try {
                mdBody = await getSectionMarkdown(baseUrl, info.url, info.anchor);
                await context.globalState.update(cacheKey, { ts: now, md: mdBody });
            } catch (error) {
                mdBody = '';
            }
        }

        const docsBody = ensureClosedFences(mdBody || '');

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
            examplesBody = getEnhancedExamples(word, baseUrl, doc, position) || '';
        }

        const fullUrl = `${baseUrl}/${info.url}#${info.anchor}`;
        let linkBody = `\n\n[📖 Open official docs](${fullUrl})`;
        if (showActionLinks) {
            const actions: string[] = [];
            const encoded = encodeURIComponent(JSON.stringify([fullUrl]));
            actions.push(`[Open in Editor](command:pythonHover.openDocsInEditorWithUrl?${encoded})`);
            actions.push(`[Copy Section](command:pythonHover.copyHoverText)`);
            if (lower === 'class') actions.push(`[Insert Class Template](command:pythonHover.insertClassTemplate)`);
            linkBody += `\n${actions.join(' · ')}`;
        }

        let finalBody: string;
        const unlimited = (maxContentLength ?? 0) <= 0;
        if (unlimited) {
            const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
            let body = ensureClosedFences((docsBody ? docsBody + '\n\n' : '') + combinedExamples);
            if (!body.endsWith('\n\n')) body += '\n\n';
            finalBody = body + linkBody.trimStart();
        } else if (!examplesBody && !specialMethodsBody) {
            let docs = docsBody;
            if (docs.length > maxContentLength) docs = smartTruncateMarkdown(docs, maxContentLength);
            let safeDocs = ensureClosedFences(docs);
            if (!safeDocs.endsWith('\n\n')) safeDocs += '\n\n';
            finalBody = safeDocs + linkBody.trimStart();
        } else {
            const totalBudget = Math.max(500, maxContentLength);
            const combinedExamples = ensureClosedFences((specialMethodsBody ? specialMethodsBody + '\n\n' : '') + (examplesBody || ''));
            const minExamplesBudget = Math.min(combinedExamples.length, Math.max(500, Math.floor(totalBudget * 0.40)), 1400);
            const linkBudget = Math.min(linkBody.length + 10, 200);
            let docsBudget = totalBudget - minExamplesBudget - linkBudget;
            if (docsBudget < 300) docsBudget = Math.max(200, Math.floor(totalBudget * 0.25));
            let docsPart = docsBody;
            if (docsPart.length > docsBudget) docsPart = smartTruncateMarkdown(docsPart, docsBudget);
            let examplesPart = combinedExamples;
            if (examplesPart.length > minExamplesBudget) examplesPart = smartTruncateMarkdown(examplesPart, minExamplesBudget);
            let safeBody = ensureClosedFences((docsPart ? docsPart + '\n\n' : '') + examplesPart);
            if (!safeBody.endsWith('\n\n')) safeBody += '\n\n';
            finalBody = safeBody + linkBody.trimStart();
        }

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportHtml = true;
        md.appendMarkdown(finalBody);
        return new vscode.Hover(md, range);
    }
});
