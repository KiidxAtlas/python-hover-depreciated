import * as vscode from 'vscode';
import { MAP } from './data/map';
import { Info } from './types';

// Best-effort type resolver without LS integration.
// Heuristics:
// - obj = ClassName(...)
// - obj: ClassName
// - for strings: obj = "...", f"...", r"..."
// - lists: obj = [ ... ]
// - dicts: obj = { ... }
// - sets: obj = {1,2} (ambiguous vs dict; we default to dict when unknown)
// - tuple: obj = (..., ...)
// Returns an Info pointing to the type page, and if attribute/method is provided, tries to anchor to that method section if stdtypes has a fragment.

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

function typeToInfo(t: string, memberName: string): Info | undefined {
    const l = t.toLowerCase();
    if (TYPE_KEYWORDS[l]) return methodAnchorFromStdType(TYPE_KEYWORDS[l], memberName);
    // For unknown classes, not enough info to map to docs.python.org reliably.
    return undefined;
}

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

function stdTypeMethodAnchor(kind: string, member: string): string | undefined {
    // Common anchors for stdtypes methods are like 'str.join', 'list.append', 'dict.get', etc.
    // Guard against dunder here; dunder methods go to datamodel handled elsewhere.
    if (/^__.*__$/.test(member)) return `object.${member}`;
    const k = kind.toLowerCase();
    const m = member.replace(/\(.*\)$/, ''); // strip call parens if present in hover
    // Some attrs use anchors like 'dict-views' etc., which we don't attempt here.
    return `${k}.${m}`;
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
