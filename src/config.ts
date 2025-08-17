import * as vscode from 'vscode';

export type HoverConfig = {
    pythonVersion: string;
    cacheDays: number;
    showExamples: boolean;
    maxContentLength: number;
    includeBuiltins: boolean;
    contextAware: boolean;
    includeDataTypes: boolean;
    includeConstants: boolean;
    includeDocExamples: boolean;
    includeGrammar: boolean;
    includeLists: boolean;
    summaryOnly: boolean;
    showSpecialMethodsSection: boolean;
    offlineOnly: boolean;
    httpTimeoutMs: number;
    httpRetries: number;
    showActionLinks: boolean;
};

export function getConfig(): HoverConfig {
    const cfg = vscode.workspace.getConfiguration('pythonHover');
    return {
        pythonVersion: (cfg.get<string>('pythonVersion') || '3').trim(),
        cacheDays: cfg.get<number>('cacheDays') ?? 7,
        showExamples: cfg.get<boolean>('showExamples') ?? true,
        maxContentLength: cfg.get<number>('maxContentLength') ?? 1500,
        includeBuiltins: cfg.get<boolean>('includeBuiltins') ?? true,
        contextAware: cfg.get<boolean>('contextAware') ?? true,
        includeDataTypes: cfg.get<boolean>('includeDataTypes') ?? true,
        includeConstants: cfg.get<boolean>('includeConstants') ?? true,
        includeDocExamples: cfg.get<boolean>('includeDocExamples') ?? true,
        includeGrammar: cfg.get<boolean>('includeGrammar') ?? true,
        includeLists: cfg.get<boolean>('includeLists') ?? true,
        summaryOnly: cfg.get<boolean>('summaryOnly') ?? false,
        showSpecialMethodsSection: cfg.get<boolean>('showSpecialMethodsSection') ?? true,
        offlineOnly: cfg.get<boolean>('offlineOnly') ?? false,
        httpTimeoutMs: cfg.get<number>('httpTimeoutMs') ?? 6000,
        httpRetries: cfg.get<number>('httpRetries') ?? 1,
        showActionLinks: cfg.get<boolean>('showActionLinks') ?? true,
    };
}
