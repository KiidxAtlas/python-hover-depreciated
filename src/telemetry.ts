import * as vscode from 'vscode';
import { TelemetryData } from './types';

/**
 * Telemetry reporter for anonymous usage analytics
 */
export class TelemetryReporter {
    private static instance: TelemetryReporter;
    private events: TelemetryData[] = [];
    private readonly maxEvents = 100;

    static getInstance(): TelemetryReporter {
        if (!TelemetryReporter.instance) {
            TelemetryReporter.instance = new TelemetryReporter();
        }
        return TelemetryReporter.instance;
    }

    /**
     * Report a hover event
     */
    reportHoverEvent(keyword: string, success: boolean, errorType?: string, responseTime?: number): void {
        // Only collect anonymous usage data if user opts in
        if (!this.isEnabled()) return;

        const event: TelemetryData = {
            keyword,
            success,
            timestamp: Date.now(),
            errorType,
            responseTime
        };

        this.events.push(event);

        // Maintain max events limit
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Log locally for debugging (remove sensitive data)
        console.log('Python Hover Event:', {
            success,
            timestamp: event.timestamp,
            hasError: !!errorType,
            responseTime
        });
    }

    /**
     * Report an error event
     */
    reportError(error: Error, context?: { word?: string; position?: vscode.Position }): void {
        if (!this.isEnabled()) return;

        console.error('Python Hover Error:', {
            message: error.message,
            timestamp: Date.now(),
            hasContext: !!context
        });
    }

    /**
     * Get usage statistics
     */
    getStats(): {
        totalEvents: number;
        successRate: number;
        averageResponseTime: number;
        mostCommonKeywords: Array<{ keyword: string; count: number }>;
    } {
        if (!this.isEnabled() || this.events.length === 0) {
            return {
                totalEvents: 0,
                successRate: 0,
                averageResponseTime: 0,
                mostCommonKeywords: []
            };
        }

        const totalEvents = this.events.length;
        const successfulEvents = this.events.filter(e => e.success).length;
        const successRate = successfulEvents / totalEvents;

        const eventsWithResponseTime = this.events.filter(e => e.responseTime !== undefined);
        const averageResponseTime = eventsWithResponseTime.length > 0
            ? eventsWithResponseTime.reduce((sum, e) => sum + (e.responseTime || 0), 0) / eventsWithResponseTime.length
            : 0;

        // Count keyword frequency
        const keywordCounts = new Map<string, number>();
        for (const event of this.events) {
            const count = keywordCounts.get(event.keyword) || 0;
            keywordCounts.set(event.keyword, count + 1);
        }

        const mostCommonKeywords = Array.from(keywordCounts.entries())
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalEvents,
            successRate,
            averageResponseTime,
            mostCommonKeywords
        };
    }

    /**
     * Clear all collected telemetry data
     */
    clear(): void {
        this.events = [];
    }

    /**
     * Check if telemetry is enabled
     */
    private isEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('pythonHover');
        return config.get<boolean>('telemetry', false);
    }
}
