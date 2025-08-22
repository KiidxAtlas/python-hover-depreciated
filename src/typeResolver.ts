import * as vscode from 'vscode';
import { MAP, MODULES } from './data/map';
import { isKnownMethod, resolveMethodInfo } from './features/methodResolver';
import { Info } from './types';

/**
 * Best-effort type resolver without Language Server integration.
 *
 * This module provides heuristic-based type resolution for Python code by analyzing:
 * - Variable assignments: `obj = ClassName(...)`
 * - Type annotations: `obj: ClassName`
 * - String literals: `obj = "..."`, `f"..."`, `r"..."`
 * - Collection literals: `obj = [...]`, `obj = {...}`, `obj = (...)`
 * - Import statements: `import module`, `from module import name`
 * - Method calls on built-in types with enhanced examples
 *
 * Returns an Info object pointing to the appropriate documentation page,
 * and attempts to anchor to specific method sections when available.
 *
 * @author Python Hover Extension
 * @since 2.1.7
 */

/**
 * Mapping of Python built-in type names to their corresponding MAP keys
 */
const TYPE_KEYWORDS: Record<string, keyof typeof MAP> = {
    'str': 'str',
    'list': 'list',
    'dict': 'dict',
    'set': 'set',
    'tuple': 'tuple',
    'int': 'int',
    'float': 'float',
    'bool': 'bool'
};

/**
 * Common module mappings for import statement hover
 *
 * Supports 70+ built-in Python modules including:
 * - Standard Library: os, sys, math, random, datetime, json, re, pathlib
 * - Collections: collections, itertools, functools, array, heapq, bisect
 * - Concurrency: threading, multiprocessing, asyncio, queue
 * - I/O & Formats: io, csv, xml, pickle, gzip, zipfile, tarfile
 * - Networking: urllib, http, socket, ftplib, smtplib, email
 * - Development: unittest, logging, pdb, profile, timeit, inspect
 * - Data Types: typing, enum, dataclasses, decimal, fractions, uuid
 * - Text Processing: string, textwrap, unicodedata, codecs, locale
 * - System: subprocess, shutil, glob, tempfile, warnings, gc
 * - Cryptography: hashlib, secrets, base64
 * - And many more...
 */
const MODULE_INFO = MODULES;

/**
 * Detect import statements and provide module information
 */
export function resolveImportInfo(doc: vscode.TextDocument, position: vscode.Position, word: string): Info | undefined {
    const line = doc.lineAt(position).text.trim();

    // Check if we're in an import statement
    if (line.startsWith('import ') || line.startsWith('from ')) {
        // Handle "import module" or "import module as alias"
        const importMatch = line.match(/^import\s+([a-zA-Z_][a-zA-Z0-9_.]*)/);
        if (importMatch) {
            const moduleName = importMatch[1].split('.')[0]; // Get base module name
            if (MODULE_INFO[moduleName]) {
                return MODULE_INFO[moduleName];
            }
        }

        // Handle "from module import name"
        const fromMatch = line.match(/^from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import/);
        if (fromMatch) {
            const moduleName = fromMatch[1].split('.')[0]; // Get base module name
            if (MODULE_INFO[moduleName]) {
                return {
                    ...MODULE_INFO[moduleName],
                    title: `${word} — from ${MODULE_INFO[moduleName].title}`
                };
            }
        }
    }

    // Check if the word itself is a known module
    if (MODULE_INFO[word]) {
        return MODULE_INFO[word];
    }

    return undefined;
}

/**
 * Resolves type information for an attribute or method access pattern.
 *
 * Analyzes the document backwards from the current position to find type
 * information for the receiver object, then maps it to appropriate documentation.
 *
 * @param doc - The VS Code text document being analyzed
 * @param position - Current cursor position in the document
 * @param receiverName - Name of the object whose attribute/method is being accessed
 * @param memberName - Name of the attribute or method being accessed
 * @returns Promise resolving to Info object with documentation details, or undefined if not resolvable
 *
 * @example
 * ```typescript
 * // For code: `my_string.upper()` where my_string was assigned as `my_string = "hello"`
 * const info = await resolveTypeInfoForAttribute(doc, pos, 'my_string', 'upper');
 * // Returns info pointing to str.upper documentation
 * ```
 */
export async function resolveTypeInfoForAttribute(doc: vscode.TextDocument, position: vscode.Position, receiverName: string, memberName: string): Promise<Info | undefined> {
    try {
        // First check if this is a known method that we can resolve directly
        if (isKnownMethod(memberName)) {
            // Try to determine the receiver type
            const receiverType = await inferReceiverType(doc, position, receiverName);
            const methodInfo = resolveMethodInfo(doc, position, memberName, receiverType);
            if (methodInfo) return methodInfo;
        }

        // Look back a limited window for simple assignments/annotations
        const maxLinesBack = 200; // small, keeps things quick
        for (let i = position.line; i >= Math.max(0, position.line - maxLinesBack); i--) {
            const text = doc.lineAt(i).text;
            // pattern: name: Type
            const ann = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*:\\s*([A-Za-z_][A-Za-z0-9_]*)`);
            const mAnn = text.match(ann);
            if (mAnn) {
                const t = mAnn[1];
                const info = typeToInfo(t, memberName);
                if (info) return info;
            }
            // pattern: name = Something(...)
            const call = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\(`);
            const mCall = text.match(call);
            if (mCall) {
                const t = mCall[1];
                const info = typeToInfo(t, memberName);
                if (info) return info;
            }
            // pattern: name = "..."|f"..."|r"..."|b"..." (bytes also considered string-like)
            const strAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*(?:[fFrRbBuU]?)[\'\"]`);
            if (strAssign.test(text)) {
                return methodAnchorFromStdType('str', memberName);
            }
            // name = [ ... ]
            const listAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\[`);
            if (listAssign.test(text)) return methodAnchorFromStdType('list', memberName);
            // name = { ... }
            const dictAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\{`);
            if (dictAssign.test(text)) {
                // naive: treat as dict; set detection is ambiguous without parsing
                return methodAnchorFromStdType('dict', memberName);
            }
            // name = ( ... ) → tuple
            const tupleAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\(`);
            if (tupleAssign.test(text)) return methodAnchorFromStdType('tuple', memberName);
        }
    } catch { }
    return undefined;
}

/**
 * Infer the type of a receiver variable by looking at assignments
 */
async function inferReceiverType(doc: vscode.TextDocument, position: vscode.Position, receiverName: string): Promise<string | undefined> {
    const maxLinesBack = 100;
    for (let i = position.line; i >= Math.max(0, position.line - maxLinesBack); i--) {
        const text = doc.lineAt(i).text;

        // Check for string assignment
        const strAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*(?:[fFrRbBuU]?)[\'\"]`);
        if (strAssign.test(text)) return 'str';

        // Check for list assignment
        const listAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\[`);
        if (listAssign.test(text)) return 'list';

        // Check for dict assignment
        const dictAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\{`);
        if (dictAssign.test(text)) return 'dict';

        // Check for set constructor
        const setAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*set\\(`);
        if (setAssign.test(text)) return 'set';

        // Check for tuple assignment
        const tupleAssign = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*\\(`);
        if (tupleAssign.test(text)) return 'tuple';

        // Check for type annotations
        const ann = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*:\\s*([A-Za-z_][A-Za-z0-9_]*)`);
        const mAnn = text.match(ann);
        if (mAnn) return mAnn[1].toLowerCase();

        // Check for constructor calls
        const call = new RegExp(`\\b${escapeRegExp(receiverName)}\\s*=\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\(`);
        const mCall = text.match(call);
        if (mCall) return mCall[1].toLowerCase();
    }
    return undefined;
}

/**
 * Maps a type name to its corresponding Info object with method anchor.
 *
 * @param t - The type name to map (e.g., 'str', 'list', 'dict')
 * @param memberName - The member name to create an anchor for
 * @returns Info object with documentation details, or undefined if type is unknown
 *
 * @example
 * ```typescript
 * const info = typeToInfo('str', 'upper');
 * // Returns info for str.upper method
 * ```
 */
function typeToInfo(t: string, memberName: string): Info | undefined {
    const l = t.toLowerCase();
    if (TYPE_KEYWORDS[l]) return methodAnchorFromStdType(TYPE_KEYWORDS[l], memberName);
    // For unknown classes, not enough info to map to docs.python.org reliably.
    return undefined;
}

/**
 * Creates an Info object for a standard type method with proper anchoring.
 *
 * Maps built-in types to their documentation pages and creates appropriate
 * anchors for specific methods. Standard types like str, list, dict, etc.
 * are mapped to the stdtypes.html page with method-specific anchors.
 *
 * @param kind - The type kind from the MAP (e.g., 'str', 'list')
 * @param memberName - The method or attribute name
 * @returns Info object with title, URL, and anchor, or undefined if type not found
 *
 * @example
 * ```typescript
 * const info = methodAnchorFromStdType('str', 'split');
 * // Returns: { title: "str.split — Text Sequence Type", url: "library/stdtypes.html", anchor: "str.split" }
 * ```
 */
function methodAnchorFromStdType(kind: keyof typeof MAP, memberName: string): Info | undefined {
    const base = MAP[kind];
    if (!base) return undefined;
    // Try well-known anchor patterns in stdtypes: e.g., str.endswith → 'str.endswith'
    const anchor = stdTypeMethodAnchor(kind, memberName) || base.anchor;
    // For method anchors, the canonical page is stdtypes.html for core containers and text/numeric types
    const stdtypesKinds = new Set(['str', 'list', 'dict', 'set', 'tuple', 'int', 'float', 'bool']);
    const url = stdtypesKinds.has(String(kind)) ? 'library/stdtypes.html' : base.url;
    return { title: `${kind}.${memberName} — ${base.title}`, url, anchor };
}

/**
 * Generates a standard type method anchor string.
 *
 * Creates anchor strings for standard library type methods following
 * the Python documentation conventions (e.g., 'str.join', 'list.append').
 * Special handling for dunder methods which are anchored to object methods.
 *
 * @param kind - The type name (e.g., 'str', 'list')
 * @param member - The method name (may include call parentheses)
 * @returns Anchor string for the documentation, or undefined for unhandled cases
 *
 * @example
 * ```typescript
 * stdTypeMethodAnchor('str', 'join');    // Returns: "str.join"
 * stdTypeMethodAnchor('list', 'append'); // Returns: "list.append"
 * stdTypeMethodAnchor('str', '__len__'); // Returns: "object.__len__"
 * ```
 */
function stdTypeMethodAnchor(kind: string, member: string): string | undefined {
    // Common anchors for stdtypes methods are like 'str.join', 'list.append', 'dict.get', etc.
    // Guard against dunder here; dunder methods go to datamodel handled elsewhere.
    if (/^__.*__$/.test(member)) return `object.${member}`;
    const k = kind.toLowerCase();
    const m = member.replace(/\(.*\)$/, ''); // strip call parens if present in hover
    // Some attrs use anchors like 'dict-views' etc., which we don't attempt here.
    return `${k}.${m}`;
}

/**
 * Escapes special regex characters in a string.
 *
 * @param s - The string to escape
 * @returns The escaped string safe for use in regular expressions
 */
function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
