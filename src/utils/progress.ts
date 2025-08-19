import * as vscode from 'vscode';

/**
 * Progress options for different types of operations
 */
export interface ProgressOptions {
    title: string;
    location: vscode.ProgressLocation;
    cancellable?: boolean;
    details?: string;
}

/**
 * Progress manager for handling loading states
 */
export class ProgressManager {
    private static instance: ProgressManager;
    private activeProgress: Map<string, { progress: vscode.Progress<{ message?: string; increment?: number }>; token: vscode.CancellationToken }> = new Map();

    private constructor() { }

    static getInstance(): ProgressManager {
        if (!ProgressManager.instance) {
            ProgressManager.instance = new ProgressManager();
        }
        return ProgressManager.instance;
    }

    /**
     * Show progress for documentation fetching
     */
    async withDocumentationProgress<T>(
        operation: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
        title: string = 'Fetching documentation...'
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title,
            cancellable: true
        }, operation);
    }

    /**
     * Show progress for cache operations
     */
    async withCacheProgress<T>(
        operation: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
        title: string = 'Managing cache...'
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable: false
        }, operation);
    }

    /**
     * Show progress in status bar
     */
    async withStatusBarProgress<T>(
        operation: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
        title: string = 'Processing...'
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title
        }, operation);
    }

    /**
     * Create a custom progress indicator that can be controlled manually
     */
    async createProgress(id: string, options: ProgressOptions): Promise<void> {
        return await vscode.window.withProgress(
            {
                location: options.location,
                title: options.title,
                cancellable: options.cancellable || false
            },
            async (progress, token) => {
                this.activeProgress.set(id, { progress, token });

                // Wait for manual completion
                return new Promise<void>((progressResolve) => {
                    const checkCompletion = () => {
                        if (!this.activeProgress.has(id)) {
                            progressResolve();
                        } else {
                            setTimeout(checkCompletion, 100);
                        }
                    };
                    checkCompletion();
                });
            }
        );
    }

    /**
     * Update progress message
     */
    updateProgress(id: string, message: string, increment?: number): void {
        const activeProgress = this.activeProgress.get(id);
        if (activeProgress) {
            activeProgress.progress.report({ message, increment });
        }
    }

    /**
     * Complete progress
     */
    completeProgress(id: string): void {
        this.activeProgress.delete(id);
    }

    /**
     * Check if operation was cancelled
     */
    isCancelled(id: string): boolean {
        const activeProgress = this.activeProgress.get(id);
        return activeProgress?.token.isCancellationRequested || false;
    }
}

/**
 * Global progress manager instance
 */
export const progressManager = ProgressManager.getInstance();

/**
 * Decorator for adding progress to async functions
 */
export function withProgress(title: string, location: vscode.ProgressLocation = vscode.ProgressLocation.Window) {
    return function <T extends (...args: any[]) => Promise<any>>(
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<T>
    ) {
        const originalMethod = descriptor.value!;

        descriptor.value = function (this: any, ...args: any[]) {
            return vscode.window.withProgress(
                {
                    location,
                    title,
                    cancellable: true
                },
                async (progress, token) => {
                    if (token.isCancellationRequested) {
                        throw new Error('Operation cancelled');
                    }
                    return originalMethod.apply(this, args);
                }
            );
        } as T;

        return descriptor;
    };
}

/**
 * Enhanced hover provider with progress indicators
 */
export class ProgressAwareHoverProvider {
    private pendingHovers: Map<string, Promise<vscode.Hover | null>> = new Map();

    /**
     * Provide hover with progress indication for slow operations
     */
    async provideHoverWithProgress(
        document: vscode.TextDocument,
        position: vscode.Position,
        hoverProvider: (doc: vscode.TextDocument, pos: vscode.Position) => Promise<vscode.Hover | null>
    ): Promise<vscode.Hover | null> {
        const key = `${document.uri.toString()}:${position.line}:${position.character}`;

        // Return existing promise if already in progress
        if (this.pendingHovers.has(key)) {
            return this.pendingHovers.get(key)!;
        }

        const hoverPromise = this.executeHoverWithProgress(document, position, hoverProvider);
        this.pendingHovers.set(key, hoverPromise);

        try {
            return await hoverPromise;
        } finally {
            this.pendingHovers.delete(key);
        }
    }

    /**
     * Execute hover with progress indication
     */
    private async executeHoverWithProgress(
        document: vscode.TextDocument,
        position: vscode.Position,
        hoverProvider: (doc: vscode.TextDocument, pos: vscode.Position) => Promise<vscode.Hover | null>
    ): Promise<vscode.Hover | null> {
        const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
        const word = range ? document.getText(range) : '';

        // For quick operations, don't show progress
        const quickStart = Date.now();
        const timeoutPromise = new Promise<'timeout'>((resolve) => {
            setTimeout(() => resolve('timeout'), 500); // 500ms threshold
        });

        const hoverPromise = hoverProvider(document, position);
        const raceResult = await Promise.race([hoverPromise, timeoutPromise]);

        // If operation completed quickly, return result
        if (raceResult !== 'timeout') {
            return raceResult;
        }

        // Show progress for slow operations
        return progressManager.withDocumentationProgress(
            async (progress, token) => {
                progress.report({ message: `Fetching documentation for '${word}'...` });

                const result = await hoverPromise;

                if (token.isCancellationRequested) {
                    throw new Error('Hover operation cancelled');
                }

                return result;
            },
            `Python Documentation: ${word}`
        );
    }
}

/**
 * Status bar progress indicator
 */
export class StatusBarProgress {
    private statusBarItem: vscode.StatusBarItem;
    private isVisible: boolean = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.text = '$(sync~spin) Fetching docs...';
    }

    /**
     * Show progress in status bar
     */
    show(message: string = 'Loading...'): void {
        this.statusBarItem.text = `$(sync~spin) ${message}`;
        this.statusBarItem.show();
        this.isVisible = true;
    }

    /**
     * Update progress message
     */
    update(message: string): void {
        if (this.isVisible) {
            this.statusBarItem.text = `$(sync~spin) ${message}`;
        }
    }

    /**
     * Hide progress indicator
     */
    hide(): void {
        this.statusBarItem.hide();
        this.isVisible = false;
    }

    /**
     * Dispose of status bar item
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}

/**
 * Global status bar progress instance
 */
export const statusBarProgress = new StatusBarProgress();
