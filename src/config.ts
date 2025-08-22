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
    prominentDisplay: boolean;
    exclusiveMode: boolean;
    offlineOnly: boolean;
    httpTimeoutMs: number;
    httpRetries: number;
    showActionLinks: boolean;
    // Enhanced features
    includeStringMethods: boolean;
    includeListMethods: boolean;
    includeDictMethods: boolean;
    includeSetMethods: boolean;
    includeModuleInfo: boolean;
    showSignatures: boolean;
    enhancedMethodResolution: boolean;
    showPracticalExamples: boolean;
    compactDisplay: boolean;  // New option for top-aligned, compact hover display
    // Link/markdown customization
    autoLinkPeps?: boolean;
    fixStandardTypeHierarchyLink?: boolean;
    repairTruncatedDocLinks?: boolean;
    // Export customization
    exportIncludeMetadata?: boolean;
    showKeyPoints?: boolean;
    showTinyExample?: boolean;
    limitGrammarLines?: number;
    grammarMaxChars?: number;
    showActionsInsertTemplates?: boolean;
};

/**
 * Validates and sanitizes user configuration values
 */
export function validateConfig(config: Partial<HoverConfig>): HoverConfig {
    // Ensure valid ranges for numeric values
    const maxContentLength = Math.max(100, Math.min(10000, config.maxContentLength ?? 1500));
    const cacheDays = Math.max(1, Math.min(365, config.cacheDays ?? 7));
    const limitGrammarLines = Math.max(1, Math.min(100, config.limitGrammarLines ?? 8));
    const grammarMaxChars = Math.max(100, Math.min(5000, config.grammarMaxChars ?? 600));
    const httpTimeoutMs = Math.max(1000, Math.min(60000, config.httpTimeoutMs ?? 6000));
    const httpRetries = Math.max(0, Math.min(10, config.httpRetries ?? 1));

    // Validate Python version format
    let pythonVersion = config.pythonVersion ?? '3';
    if (!/^\d+(?:\.\d+)?$/.test(pythonVersion.trim())) {
        pythonVersion = '3.12'; // Default to current stable version
    }

    // Validate locale format
    let docsLocale = config.docsLocale ?? 'en';
    if (!/^[a-z]{2}(?:_[A-Z]{2})?$/.test(docsLocale.trim())) {
        docsLocale = 'en';
    }

    // Validate openTarget enum
    const validTargets = ['auto', 'editor', 'external'] as const;
    const openTarget = validTargets.includes(config.openTarget as any) ? config.openTarget! : 'auto';

    return {
        useDomParser: config.useDomParser ?? true,
        openTarget,
        pythonVersion,
        docsLocale,
        cacheDays,
        showExamples: config.showExamples ?? true,
        maxContentLength,
        includeBuiltins: config.includeBuiltins ?? true,
        contextAware: config.contextAware ?? true,
        typeAwareHovers: config.typeAwareHovers ?? true,
        includeDataTypes: config.includeDataTypes ?? true,
        includeConstants: config.includeConstants ?? true,
        includeExceptions: config.includeExceptions ?? true,
        includeDocExamples: config.includeDocExamples ?? true,
        includeGrammar: config.includeGrammar ?? true,
        includeLists: config.includeLists ?? true,
        summaryOnly: config.summaryOnly ?? false,
        showSpecialMethodsSection: config.showSpecialMethodsSection ?? true,
        includeDunderMethods: config.includeDunderMethods ?? true,
        prominentDisplay: config.prominentDisplay ?? true,
        exclusiveMode: config.exclusiveMode ?? false,
        offlineOnly: config.offlineOnly ?? false,
        httpTimeoutMs,
        httpRetries,
        showActionLinks: config.showActionLinks ?? true,
        autoLinkPeps: config.autoLinkPeps ?? true,
        fixStandardTypeHierarchyLink: config.fixStandardTypeHierarchyLink ?? true,
        repairTruncatedDocLinks: config.repairTruncatedDocLinks ?? true,
        exportIncludeMetadata: config.exportIncludeMetadata ?? true,
        showKeyPoints: config.showKeyPoints ?? true,
        showTinyExample: config.showTinyExample ?? true,
        limitGrammarLines,
        grammarMaxChars,
        showActionsInsertTemplates: config.showActionsInsertTemplates ?? false,
        // Enhanced features
        includeStringMethods: config.includeStringMethods ?? true,
        includeListMethods: config.includeListMethods ?? true,
        includeDictMethods: config.includeDictMethods ?? true,
        includeSetMethods: config.includeSetMethods ?? true,
        includeModuleInfo: config.includeModuleInfo ?? true,
        showSignatures: config.showSignatures ?? true,
        enhancedMethodResolution: config.enhancedMethodResolution ?? true,
        showPracticalExamples: config.showPracticalExamples ?? true,
        compactDisplay: config.compactDisplay ?? true,
    };
}

export function getConfig(): HoverConfig {
    const cfg = vscode.workspace.getConfiguration('pythonHover');

    // Use the validation function for consistent configuration handling
    return validateConfig({
        useDomParser: cfg.get<boolean>('useDomParser'),
        openTarget: cfg.get<'auto' | 'editor' | 'external'>('openTarget'),
        pythonVersion: cfg.get<string>('pythonVersion'),
        docsLocale: cfg.get<string>('docsLocale'),
        cacheDays: cfg.get<number>('cacheDays'),
        showExamples: cfg.get<boolean>('showExamples'),
        maxContentLength: cfg.get<number>('maxContentLength'),
        includeBuiltins: cfg.get<boolean>('includeBuiltins'),
        contextAware: cfg.get<boolean>('contextAware'),
        typeAwareHovers: cfg.get<boolean>('typeAwareHovers'),
        includeDataTypes: cfg.get<boolean>('includeDataTypes'),
        includeConstants: cfg.get<boolean>('includeConstants'),
        includeExceptions: cfg.get<boolean>('includeExceptions'),
        includeDocExamples: cfg.get<boolean>('includeDocExamples'),
        includeGrammar: cfg.get<boolean>('includeGrammar'),
        includeLists: cfg.get<boolean>('includeLists'),
        summaryOnly: cfg.get<boolean>('summaryOnly'),
        showSpecialMethodsSection: cfg.get<boolean>('showSpecialMethodsSection'),
        includeDunderMethods: cfg.get<boolean>('includeDunderMethods'),
        prominentDisplay: cfg.get<boolean>('prominentDisplay'),
        exclusiveMode: cfg.get<boolean>('exclusiveMode'),
        offlineOnly: cfg.get<boolean>('offlineOnly'),
        httpTimeoutMs: cfg.get<number>('httpTimeoutMs'),
        httpRetries: cfg.get<number>('httpRetries'),
        showActionLinks: cfg.get<boolean>('showActionLinks'),
        autoLinkPeps: cfg.get<boolean>('autoLinkPeps'),
        fixStandardTypeHierarchyLink: cfg.get<boolean>('fixStandardTypeHierarchyLink'),
        repairTruncatedDocLinks: cfg.get<boolean>('repairTruncatedDocLinks'),
        exportIncludeMetadata: cfg.get<boolean>('exportIncludeMetadata'),
        showKeyPoints: cfg.get<boolean>('showKeyPoints'),
        showTinyExample: cfg.get<boolean>('showTinyExample'),
        limitGrammarLines: cfg.get<number>('limitGrammarLines'),
        grammarMaxChars: cfg.get<number>('grammarMaxChars'),
        showActionsInsertTemplates: cfg.get<boolean>('showActions.insertTemplates'),
        // Enhanced features
        includeStringMethods: cfg.get<boolean>('includeStringMethods'),
        includeListMethods: cfg.get<boolean>('includeListMethods'),
        includeDictMethods: cfg.get<boolean>('includeDictMethods'),
        includeSetMethods: cfg.get<boolean>('includeSetMethods'),
        includeModuleInfo: cfg.get<boolean>('includeModuleInfo'),
        showSignatures: cfg.get<boolean>('showSignatures'),
        enhancedMethodResolution: cfg.get<boolean>('enhancedMethodResolution'),
        showPracticalExamples: cfg.get<boolean>('showPracticalExamples'),
        compactDisplay: cfg.get<boolean>('compactDisplay'),
    });
}

export function getDocsBaseUrl(): string {
    const { pythonVersion, docsLocale } = getConfig();
    const loc = (docsLocale && docsLocale !== 'en') ? `/${docsLocale}` : '';
    return `https://docs.python.org${loc}/${pythonVersion}`;
}
