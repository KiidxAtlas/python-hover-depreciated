import * as vscode from 'vscode';
import { MAP } from '../data/map';
import { Info } from '../types';

/**
 * Smart suggestion system for Python Hover extension
 *
 * Provides context-aware suggestions based on:
 * - Import statements in the file
 * - Variable assignments and type annotations
 * - Common Python patterns and idioms
 * - User's coding history and preferences
 *
 * @author Python Hover Extension
 * @since 2.1.8
 */

/**
 * Represents a smart suggestion for documentation
 */
export interface SmartSuggestion {
    /** The keyword or symbol being suggested */
    word: string;
    /** Confidence score (0-1) for the suggestion */
    confidence: number;
    /** Reason why this suggestion was made */
    reason: string;
    /** Documentation info for the suggestion */
    info: Info;
    /** Context where this suggestion applies */
    context: 'import' | 'assignment' | 'method' | 'keyword' | 'pattern';
}

/**
 * Import analysis result
 */
interface ImportAnalysis {
    modules: Set<string>;
    fromImports: Map<string, Set<string>>;
    aliases: Map<string, string>;
}

/**
 * Context analysis result
 */
interface ContextAnalysis {
    variables: Map<string, string>;
    functions: Set<string>;
    classes: Set<string>;
    patterns: Set<string>;
}

/**
 * Smart suggestion provider for Python documentation
 */
export class SmartSuggestionProvider {
    private static instance: SmartSuggestionProvider;
    private documentAnalysis: Map<string, { imports: ImportAnalysis; context: ContextAnalysis; timestamp: number }> = new Map();
    private userPatterns: Map<string, number> = new Map(); // Track user's common patterns
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

    static getInstance(): SmartSuggestionProvider {
        if (!SmartSuggestionProvider.instance) {
            SmartSuggestionProvider.instance = new SmartSuggestionProvider();
        }
        return SmartSuggestionProvider.instance;
    }

    /**
     * Get smart suggestions for the current context
     *
     * @param document - The VS Code document
     * @param position - Current cursor position
     * @param word - The word at cursor (if any)
     * @returns Array of smart suggestions sorted by relevance
     */
    async getSmartSuggestions(
        document: vscode.TextDocument,
        position: vscode.Position,
        word?: string
    ): Promise<SmartSuggestion[]> {
        const suggestions: SmartSuggestion[] = [];

        // Get or update document analysis
        const analysis = await this.getDocumentAnalysis(document);

        // Generate suggestions based on different contexts
        suggestions.push(...this.getImportBasedSuggestions(analysis.imports, word));
        suggestions.push(...this.getContextBasedSuggestions(analysis.context, position, word));
        suggestions.push(...this.getPatternBasedSuggestions(document, position, word));
        suggestions.push(...this.getUserPatternSuggestions(word));

        // Sort by confidence and return top suggestions
        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10); // Limit to top 10
    }

    /**
     * Analyze document imports and cache the results
     */
    private async getDocumentAnalysis(document: vscode.TextDocument): Promise<{ imports: ImportAnalysis; context: ContextAnalysis }> {
        const uri = document.uri.toString();
        const cached = this.documentAnalysis.get(uri);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return { imports: cached.imports, context: cached.context };
        }

        const imports = this.analyzeImports(document);
        const context = this.analyzeContext(document);

        this.documentAnalysis.set(uri, {
            imports,
            context,
            timestamp: Date.now()
        });

        return { imports, context };
    }

    /**
     * Analyze import statements in the document
     */
    private analyzeImports(document: vscode.TextDocument): ImportAnalysis {
        const imports: ImportAnalysis = {
            modules: new Set(),
            fromImports: new Map(),
            aliases: new Map()
        };

        const text = document.getText();
        const lines = text.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // import module [as alias]
            const importMatch = trimmed.match(/^import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*(?:as\s+([a-zA-Z_][a-zA-Z0-9_]*))?/);
            if (importMatch) {
                const module = importMatch[1];
                const alias = importMatch[2];
                imports.modules.add(module);
                if (alias) {
                    imports.aliases.set(alias, module);
                }
                continue;
            }

            // from module import name [as alias]
            const fromMatch = trimmed.match(/^from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(.+)/);
            if (fromMatch) {
                const module = fromMatch[1];
                const importList = fromMatch[2];

                if (!imports.fromImports.has(module)) {
                    imports.fromImports.set(module, new Set());
                }

                // Parse import list
                const names = importList.split(',').map(name => name.trim());
                for (const name of names) {
                    const asMatch = name.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:as\s+([a-zA-Z_][a-zA-Z0-9_]*))?/);
                    if (asMatch) {
                        const importName = asMatch[1];
                        const alias = asMatch[2];
                        imports.fromImports.get(module)!.add(importName);
                        if (alias) {
                            imports.aliases.set(alias, `${module}.${importName}`);
                        }
                    }
                }
            }
        }

        return imports;
    }

    /**
     * Analyze code context in the document
     */
    private analyzeContext(document: vscode.TextDocument): ContextAnalysis {
        const context: ContextAnalysis = {
            variables: new Map(),
            functions: new Set(),
            classes: new Set(),
            patterns: new Set()
        };

        const text = document.getText();
        const lines = text.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Variable assignments with type hints
            const typeHintMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (typeHintMatch) {
                context.variables.set(typeHintMatch[1], typeHintMatch[2]);
                continue;
            }

            // Function definitions
            const funcMatch = trimmed.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (funcMatch) {
                context.functions.add(funcMatch[1]);
                continue;
            }

            // Class definitions
            const classMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch) {
                context.classes.add(classMatch[1]);
                continue;
            }

            // Common patterns
            if (trimmed.includes('if __name__ == "__main__"')) {
                context.patterns.add('main_guard');
            }
            if (trimmed.includes('with open(')) {
                context.patterns.add('file_handling');
            }
            if (trimmed.includes('try:')) {
                context.patterns.add('exception_handling');
            }
        }

        return context;
    }

    /**
     * Generate suggestions based on imports
     */
    private getImportBasedSuggestions(imports: ImportAnalysis, word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        // Suggest based on imported modules
        for (const module of imports.modules) {
            const moduleInfo = this.getModuleInfo(module);
            if (moduleInfo && (!word || module.includes(word))) {
                suggestions.push({
                    word: module,
                    confidence: 0.8,
                    reason: `Module imported in this file`,
                    info: moduleInfo,
                    context: 'import'
                });
            }
        }

        // Suggest based on from imports
        for (const [module, names] of imports.fromImports) {
            for (const name of names) {
                const info = this.getSymbolInfo(module, name);
                if (info && (!word || name.includes(word))) {
                    suggestions.push({
                        word: name,
                        confidence: 0.9,
                        reason: `Imported from ${module}`,
                        info,
                        context: 'import'
                    });
                }
            }
        }

        return suggestions;
    }

    /**
     * Generate suggestions based on code context
     */
    private getContextBasedSuggestions(context: ContextAnalysis, position: vscode.Position, word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        // Suggest based on variable types
        for (const [varName, typeName] of context.variables) {
            const typeInfo = MAP[typeName.toLowerCase() as keyof typeof MAP];
            if (typeInfo && (!word || varName.includes(word))) {
                suggestions.push({
                    word: varName,
                    confidence: 0.7,
                    reason: `Variable of type ${typeName}`,
                    info: typeInfo,
                    context: 'assignment'
                });
            }
        }

        // Suggest based on patterns
        if (context.patterns.has('exception_handling')) {
            const exceptionKeywords = ['try', 'except', 'finally', 'raise'];
            for (const keyword of exceptionKeywords) {
                const info = MAP[keyword as keyof typeof MAP];
                if (info && (!word || keyword.includes(word))) {
                    suggestions.push({
                        word: keyword,
                        confidence: 0.6,
                        reason: 'Exception handling pattern detected',
                        info,
                        context: 'pattern'
                    });
                }
            }
        }

        return suggestions;
    }

    /**
     * Generate suggestions based on common patterns
     */
    private getPatternBasedSuggestions(document: vscode.TextDocument, position: vscode.Position, word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];
        const line = document.lineAt(position).text;
        const beforeCursor = line.substring(0, position.character);

        // Context-sensitive suggestions
        if (beforeCursor.includes('.')) {
            // Method completion context
            const methodSuggestions = this.getMethodSuggestions(beforeCursor, word);
            suggestions.push(...methodSuggestions);
        }

        if (beforeCursor.trim().startsWith('from ') || beforeCursor.trim().startsWith('import ')) {
            // Import context
            const importSuggestions = this.getImportSuggestions(word);
            suggestions.push(...importSuggestions);
        }

        return suggestions;
    }

    /**
     * Generate suggestions based on user patterns
     */
    private getUserPatternSuggestions(word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        // Get most frequently used patterns
        const sortedPatterns = Array.from(this.userPatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [pattern, frequency] of sortedPatterns) {
            const info = MAP[pattern as keyof typeof MAP];
            if (info && (!word || pattern.includes(word))) {
                const confidence = Math.min(0.5 + (frequency / 100), 0.9);
                suggestions.push({
                    word: pattern,
                    confidence,
                    reason: `Frequently used (${frequency} times)`,
                    info,
                    context: 'pattern'
                });
            }
        }

        return suggestions;
    }

    /**
     * Get method suggestions for object.method patterns
     */
    private getMethodSuggestions(beforeCursor: string, word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        // Common string methods
        if (beforeCursor.includes('"') || beforeCursor.includes("'")) {
            const stringMethods = ['upper', 'lower', 'strip', 'split', 'join', 'replace'];
            for (const method of stringMethods) {
                if (!word || method.includes(word)) {
                    const info = MAP.str;
                    if (info) {
                        suggestions.push({
                            word: method,
                            confidence: 0.7,
                            reason: 'Common string method',
                            info: { ...info, title: `str.${method}`, anchor: `str.${method}` },
                            context: 'method'
                        });
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Get import suggestions
     */
    private getImportSuggestions(word?: string): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];
        const commonImports = ['os', 'sys', 'json', 'datetime', 'collections', 'itertools', 'functools'];

        for (const module of commonImports) {
            if (!word || module.includes(word)) {
                const info = this.getModuleInfo(module);
                if (info) {
                    suggestions.push({
                        word: module,
                        confidence: 0.6,
                        reason: 'Common Python module',
                        info,
                        context: 'import'
                    });
                }
            }
        }

        return suggestions;
    }

    /**
     * Get module information
     */
    private getModuleInfo(module: string): Info | undefined {
        // Map common modules to their documentation
        const moduleMap: Record<string, Info> = {
            'os': { title: 'os — Miscellaneous operating system interfaces', url: 'library/os.html', anchor: 'module-os' },
            'sys': { title: 'sys — System-specific parameters and functions', url: 'library/sys.html', anchor: 'module-sys' },
            'json': { title: 'json — JSON encoder and decoder', url: 'library/json.html', anchor: 'module-json' },
            'datetime': { title: 'datetime — Basic date and time types', url: 'library/datetime.html', anchor: 'module-datetime' },
            'collections': { title: 'collections — Container datatypes', url: 'library/collections.html', anchor: 'module-collections' },
            'itertools': { title: 'itertools — Functions creating iterators', url: 'library/itertools.html', anchor: 'module-itertools' },
            'functools': { title: 'functools — Higher-order functions', url: 'library/functools.html', anchor: 'module-functools' }
        };

        return moduleMap[module];
    }

    /**
     * Get symbol information from module
     */
    private getSymbolInfo(module: string, symbol: string): Info | undefined {
        // This could be expanded with more comprehensive mapping
        const info = MAP[symbol.toLowerCase() as keyof typeof MAP];
        if (info) {
            return {
                ...info,
                title: `${module}.${symbol} — ${info.title}`
            };
        }
        return undefined;
    }

    /**
     * Track user pattern usage
     */
    trackUserPattern(word: string): void {
        const current = this.userPatterns.get(word) || 0;
        this.userPatterns.set(word, current + 1);
    }

    /**
     * Clear cached analysis for a document
     */
    clearDocumentCache(document: vscode.TextDocument): void {
        this.documentAnalysis.delete(document.uri.toString());
    }
}

/**
 * Global smart suggestion provider instance
 */
export const smartSuggestionProvider = SmartSuggestionProvider.getInstance();
