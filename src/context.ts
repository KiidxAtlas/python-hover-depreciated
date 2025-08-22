import * as vscode from 'vscode';
import { BUILTIN_KEYWORDS, DATA_TYPES, getDunderInfo, MAP } from './data/map';
import { isKnownMethod, resolveMethodInfo } from './features/methodResolver';
import { resolveImportInfo } from './typeResolver';
import { Info } from './types';

/**
 * Cache for compiled regex patterns to improve performance
 */
const REGEX_CACHE = new Map<string, RegExp>();

/**
 * Get a cached regex pattern or create and cache it
 */
function getCachedRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}:${flags || ''}`;
    if (!REGEX_CACHE.has(key)) {
        try {
            REGEX_CACHE.set(key, new RegExp(pattern, flags));
        } catch (error) {
            console.error('Invalid regex pattern:', pattern, error);
            // Return a safe fallback regex that never matches
            return /(?!)/;
        }
    }
    return REGEX_CACHE.get(key)!;
}

/**
 * Enhanced contextual information provider for Python hover
 * Provides context-aware documentation based on code patterns and usage
 */
export function getContextualInfo(doc: vscode.TextDocument, position: vscode.Position, word: string): Info | undefined {
    const line = doc.lineAt(position).text;
    const beforeWord = line.substring(0, position.character);
    const afterWord = line.substring(position.character + word.length);
    const fullLine = line.trim();

    // Check for import statements first
    const importInfo = resolveImportInfo(doc, position, word);
    if (importInfo) return importInfo;

    // Check for method calls on built-in types
    if (isKnownMethod(word)) {
        // Try to determine the receiver type from context
        const dotMatch = beforeWord.match(getCachedRegex(String.raw`(\w+)\s*\.\s*$`));
        if (dotMatch) {
            const receiverName = dotMatch[1];
            const methodInfo = resolveMethodInfo(doc, position, word, undefined);
            if (methodInfo) return methodInfo;
        }
    }

    // Handle dunder methods with enhanced context
    if (getCachedRegex('^__.*__$').test(word)) {
        return getDunderInfoWithContext(doc, position, word, beforeWord, afterWord);
    }

    // Handle builtin functions with context awareness
    if (BUILTIN_KEYWORDS.includes(word)) {
        return getBuiltinInfoWithContext(doc, position, word, beforeWord, afterWord);
    }

    // Enhanced data type detection
    if (DATA_TYPES.includes(word)) {
        return getDataTypeInfoWithContext(doc, position, word, beforeWord, afterWord);
    }

    // Enhanced keyword detection with context
    if (['class', 'def', 'import', 'from'].includes(word)) {
        // Don't show docs for attribute access (e.g., obj.class)
        if (beforeWord.trim().endsWith('.')) return undefined;

        // Enhanced context for async def
        if (word === 'def' && beforeWord.includes('async')) {
            const info = MAP[word];
            return info ? { ...info, title: 'async def — Asynchronous Function Definition' } : undefined;
        }
    }

    // Enhanced await context detection
    if (word === 'await') {
        const fullText = doc.getText();
        const textBeforePosition = fullText.substring(0, doc.offsetAt(position));

        // Check if we're in an async context
        const inAsyncFunction = getCachedRegex(String.raw`async\s+def\s+\w+[^:]*:\s*[^]*$`).test(textBeforePosition);
        const inAsyncWith = textBeforePosition.includes('async with');
        const inAsyncFor = textBeforePosition.includes('async for');

        if (!inAsyncFunction && !inAsyncWith && !inAsyncFor) {
            const info = MAP[word];
            return info ? { ...info, title: info.title + ' (requires async context)' } : undefined;
        }
    }

    // Enhanced with statement context
    if (word === 'with') {
        if (beforeWord.includes('async')) {
            const info = MAP[word];
            return info ? { ...info, title: 'async with — Asynchronous Context Manager' } : undefined;
        }
    }

    // Enhanced yield context
    if (word === 'yield') {
        if (afterWord.trim().startsWith('from')) {
            const info = MAP[word];
            return info ? { ...info, title: 'yield from — Delegate to Subgenerator' } : undefined;
        }
    }

    // F-string detection
    if (word === 'f' && getCachedRegex('^["\'"]').test(afterWord.trim())) {
        return MAP['f-string'];
    }

    // Enhanced exception handling context
    if (['except', 'finally', 'raise'].includes(word)) {
        // Check if we're in a try block context
        const linesBefore = [];
        for (let i = Math.max(0, position.line - 10); i < position.line; i++) {
            linesBefore.push(doc.lineAt(i).text);
        }
        const context = linesBefore.join('\n');

        if (word === 'except' && context.includes('try:')) {
            const info = MAP[word];
            return info ? { ...info, title: info.title + ' (in try block)' } : undefined;
        }
    }

    // Enhanced loop context detection
    if (['break', 'continue'].includes(word)) {
        // Check if we're in a loop context
        const linesBefore = [];
        for (let i = Math.max(0, position.line - 20); i < position.line; i++) {
            linesBefore.push(doc.lineAt(i).text);
        }
        const context = linesBefore.join('\n');

        const inLoop = getCachedRegex(String.raw`\b(for|while)\b`).test(context);
        if (!inLoop) {
            const info = MAP[word];
            return info ? { ...info, title: info.title + ' (requires loop context)' } : undefined;
        }
    }

    // Fall back to standard mapping
    return MAP[word as keyof typeof MAP] || MAP[word.toLowerCase() as keyof typeof MAP];
}

/**
 * Get dunder method info with enhanced context awareness
 */
function getDunderInfoWithContext(
    doc: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    beforeWord: string,
    afterWord: string
): Info | undefined {
    const info = getDunderInfo(word);
    if (!info) return undefined;

    // Check if we're in a class definition context
    const lineNumber = position.line;
    let inClass = false;
    let className = '';

    // Look backwards for class definition
    for (let i = lineNumber; i >= Math.max(0, lineNumber - 50); i--) {
        const line = doc.lineAt(i).text;
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            inClass = true;
            className = classMatch[1];
            break;
        }
    }

    // Enhance title based on context
    if (inClass) {
        // Common patterns for different dunder methods
        if (word === '__init__') {
            return { ...info, title: `${word}() — Constructor for ${className}` };
        } else if (word === '__str__') {
            return { ...info, title: `${word}() — String representation for ${className}` };
        } else if (word === '__repr__') {
            return { ...info, title: `${word}() — Developer representation for ${className}` };
        } else if (word.match(/^__(add|sub|mul|div|mod|pow)__$/)) {
            return { ...info, title: `${word}() — Arithmetic operation for ${className}` };
        } else if (word.match(/^__(eq|ne|lt|le|gt|ge)__$/)) {
            return { ...info, title: `${word}() — Comparison operation for ${className}` };
        } else if (word.match(/^__(getitem|setitem|delitem)__$/)) {
            return { ...info, title: `${word}() — Item access for ${className}` };
        }
    }

    return info;
}

/**
 * Get builtin function info with enhanced context awareness
 */
function getBuiltinInfoWithContext(
    doc: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    beforeWord: string,
    afterWord: string
): Info | undefined {
    const info = MAP[word];
    if (!info) return undefined;

    // Enhanced context for specific builtins
    if (word === 'len') {
        // Check if applied to common types
        if (beforeWord.includes('list') || beforeWord.includes('dict') || beforeWord.includes('str')) {
            return { ...info, title: `${word}() — Get length of sequence/collection` };
        }
    }

    if (word === 'isinstance') {
        // Look for type annotations in the context
        const line = doc.lineAt(position).text;
        if (line.includes('Union') || line.includes('Optional')) {
            return { ...info, title: `${word}() — Type checking (useful with Union types)` };
        }
    }

    if (word === 'super') {
        // Check if we're in a class method
        const lineNumber = position.line;
        let inMethod = false;

        for (let i = lineNumber; i >= Math.max(0, lineNumber - 20); i--) {
            const line = doc.lineAt(i).text.trim();
            if (line.startsWith('def ') && line.includes('self')) {
                inMethod = true;
                break;
            }
        }

        if (inMethod) {
            return { ...info, title: `${word}() — Access parent class methods` };
        }
    }

    return info;
}

/**
 * Get data type info with enhanced context awareness
 */
function getDataTypeInfoWithContext(
    doc: vscode.TextDocument,
    position: vscode.Position,
    word: string,
    beforeWord: string,
    afterWord: string
): Info | undefined {
    const info = MAP[word];
    if (!info) return undefined;

    // Constructor call context: str(), int(), etc.
    if (afterWord.trim().startsWith('(')) {
        return { ...info, title: `${word}() — ${word.charAt(0).toUpperCase() + word.slice(1)} constructor/converter` };
    }

    // Attribute access context: obj.str
    if (beforeWord.trim().endsWith('.')) {
        return info;
    }

    // Type annotation context: x: str, isinstance(x, str)
    if (beforeWord.includes(':') || beforeWord.includes('isinstance') || beforeWord.includes('type')) {
        return { ...info, title: `${word} — ${word.charAt(0).toUpperCase() + word.slice(1)} type` };
    }

    // Class inheritance context: class MyClass(str):
    if (beforeWord.includes('(') && beforeWord.includes('class')) {
        return { ...info, title: `${word} — ${word.charAt(0).toUpperCase() + word.slice(1)} base class` };
    }

    return info;
}
