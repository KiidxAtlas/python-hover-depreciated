import * as vscode from 'vscode';

export type Info = { title: string; url: string; anchor: string };

/**
 * Enhanced type definitions for better type safety
 */
export interface HoverInfo {
    title: string;
    url: string;
    anchor: string;
}

export interface CachedContent {
    ts: number;
    md: string;
}

export interface HoverContext {
    document: vscode.TextDocument;
    position: vscode.Position;
    word: string;
    range: vscode.Range;
}

export interface HoverConfig {
    contextAware: boolean;
    includeBuiltins: boolean;
    showExamples: boolean;
    maxContentLength: number;
    pythonVersion: string;
    cacheDays: number;
    includeDataTypes: boolean;
    includeConstants: boolean;
    includeExceptions: boolean;
    summaryOnly: boolean;
    showSpecialMethodsSection: boolean;
    includeDunderMethods: boolean;
    offlineOnly: boolean;
    showActionLinks: boolean;
    openTarget: 'editor' | 'external';
    typeAwareHovers: boolean;
    showActionsInsertTemplates: boolean;
    limitGrammarLines: number;
    grammarMaxChars: number;
}

export interface TelemetryData {
    keyword: string;
    success: boolean;
    timestamp: number;
    errorType?: string;
    responseTime?: number;
}

export interface CacheStats {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
}

export interface ErrorInfo {
    message: string;
    stack?: string;
    timestamp: number;
    context?: {
        word?: string;
        position?: vscode.Position;
        document?: string;
    };
}
