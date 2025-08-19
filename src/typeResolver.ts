import * as vscode from 'vscode';
import { MAP } from './data/map';
import { Info } from './types';

/**
 * Best-effort type resolver without Language Server integration.
 *
 * This module provides heuristic-based type resolution for Python code by analyzing:
 * - Variable assignments: `obj = ClassName(...)`
 * - Type annotations: `obj: ClassName`
 * - String literals: `obj = "..."`, `f"..."`, `r"..."`
 * - Collection literals: `obj = [...]`, `obj = {...}`, `obj = (...)`
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
