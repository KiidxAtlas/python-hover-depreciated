import * as vscode from 'vscode';

export type HoverConfig = {
    useDomParser?: boolean;
    openTarget?: 'auto' | 'editor' | 'external';
    pythonVersion: string;
    docsLocale?: string;
    cacheDays: number;
    showExamples: boolean;
    maxContentLength: number;
    includeBuiltins: boolean;
    contextAware: boolean;
    typeAwareHovers?: boolean;
    includeDataTypes: boolean;
    includeConstants: boolean;
    includeExceptions: boolean;
    includeDocExamples: boolean;
    includeGrammar: boolean;
    includeLists: boolean;
    summaryOnly: boolean;
    showSpecialMethodsSection: boolean;
    includeDunderMethods: boolean;
    offlineOnly: boolean;
    httpTimeoutMs: number;
    httpRetries: number;
    showActionLinks: boolean;
    // dynamic indexing removed
    // Link/markdown customization
    autoLinkPeps?: boolean;
    fixStandardTypeHierarchyLink?: boolean;
    repairTruncatedDocLinks?: boolean;
    // Indexing sources customization
    // index sources removed
    // Export customization
    exportIncludeMetadata?: boolean;
    showKeyPoints?: boolean;
    showTinyExample?: boolean;
    limitGrammarLines?: number;
    grammarMaxChars?: number;
    showActionsInsertTemplates?: boolean;
};

export function getConfig(): HoverConfig {
    const cfg = vscode.workspace.getConfiguration('pythonHover');
    return {
        useDomParser: cfg.get<boolean>('useDomParser') ?? true,
        openTarget: (cfg.get<'auto' | 'editor' | 'external'>('openTarget') || 'auto'),
        pythonVersion: (cfg.get<string>('pythonVersion') || '3').trim(),
        docsLocale: (cfg.get<string>('docsLocale') || 'en').trim(),
        cacheDays: cfg.get<number>('cacheDays') ?? 7,
        showExamples: cfg.get<boolean>('showExamples') ?? true,
        maxContentLength: cfg.get<number>('maxContentLength') ?? 1500,
        includeBuiltins: cfg.get<boolean>('includeBuiltins') ?? true,
        contextAware: cfg.get<boolean>('contextAware') ?? true,
        typeAwareHovers: cfg.get<boolean>('typeAwareHovers') ?? true,
        includeDataTypes: cfg.get<boolean>('includeDataTypes') ?? true,
        includeConstants: cfg.get<boolean>('includeConstants') ?? true,
        includeExceptions: cfg.get<boolean>('includeExceptions') ?? true,
        includeDocExamples: cfg.get<boolean>('includeDocExamples') ?? true,
        includeGrammar: cfg.get<boolean>('includeGrammar') ?? true,
        includeLists: cfg.get<boolean>('includeLists') ?? true,
        summaryOnly: cfg.get<boolean>('summaryOnly') ?? false,
        showSpecialMethodsSection: cfg.get<boolean>('showSpecialMethodsSection') ?? true,
        includeDunderMethods: cfg.get<boolean>('includeDunderMethods') ?? true,
        offlineOnly: cfg.get<boolean>('offlineOnly') ?? false,
        httpTimeoutMs: cfg.get<number>('httpTimeoutMs') ?? 6000,
        httpRetries: cfg.get<number>('httpRetries') ?? 1,
        showActionLinks: cfg.get<boolean>('showActionLinks') ?? true,
        // indexing removed
        autoLinkPeps: cfg.get<boolean>('autoLinkPeps') ?? true,
        fixStandardTypeHierarchyLink: cfg.get<boolean>('fixStandardTypeHierarchyLink') ?? true,
        repairTruncatedDocLinks: cfg.get<boolean>('repairTruncatedDocLinks') ?? true,
        // indexing removed
        exportIncludeMetadata: cfg.get<boolean>('exportIncludeMetadata') ?? true,
        showKeyPoints: cfg.get<boolean>('showKeyPoints') ?? true,
        showTinyExample: cfg.get<boolean>('showTinyExample') ?? true,
        limitGrammarLines: cfg.get<number>('limitGrammarLines') ?? 8,
        grammarMaxChars: cfg.get<number>('grammarMaxChars') ?? 600,
        showActionsInsertTemplates: cfg.get<boolean>('showActions.insertTemplates') ?? false,
    };
}

export function getDocsBaseUrl(): string {
    const { pythonVersion, docsLocale } = getConfig();
    const loc = (docsLocale && docsLocale !== 'en') ? `/${docsLocale}` : '';
    return `https://docs.python.org${loc}/${pythonVersion}`;
}
