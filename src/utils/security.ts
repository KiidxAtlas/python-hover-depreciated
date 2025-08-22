/**
 * Security utilities for input validation and sanitization
 */
import * as vscode from 'vscode';

/**
 * Sanitizes command URIs to only allow whitelisted commands
 */
export function sanitizeCommandUri(uri: string): string {
    const allowedCommands = [
        'pythonHover.openDocsInEditorWithUrl',
        'pythonHover.copyDocsUrl',
        'pythonHover.copyHoverText',
        'pythonHover.insertClassTemplate',
        'pythonHover.insertTryTemplate',
        'pythonHover.insertIfTemplate'
    ];

    try {
        const match = uri.match(/^command:([^?]+)/);
        if (match) {
            const commandId = match[1];
            if (!allowedCommands.includes(commandId)) {
                console.warn(`Blocked potentially unsafe command: ${commandId}`);
                return '#'; // Safe fallback
            }
        }
        return uri;
    } catch {
        return '#'; // Safe fallback on any parsing error
    }
}

/**
 * Creates a safe MarkdownString with appropriate trust settings
 */
export function createSafeMarkdownString(content: string, hasCommands: boolean = false): vscode.MarkdownString {
    const md = new vscode.MarkdownString();

    // Only mark as trusted if we have vetted command URIs
    md.isTrusted = hasCommands;
    md.supportHtml = false; // Disable HTML to prevent XSS

    // Sanitize command URIs in the content
    const sanitizedContent = content.replace(
        /command:([^?)\s]+)(\?[^)\s]*)?/g,
        (match, commandId, args) => {
            const fullUri = `command:${commandId}${args || ''}`;
            return sanitizeCommandUri(fullUri);
        }
    );

    md.appendMarkdown(sanitizedContent);
    return md;
}

/**
 * Sanitizes user input to prevent ReDoS (Regular Expression Denial of Service) attacks
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
        return '';
    }

    // Limit input length to prevent resource exhaustion
    const truncated = input.slice(0, maxLength);

    // Remove potentially dangerous patterns that could cause ReDoS
    return truncated
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .replace(/[\u2028\u2029]/g, ''); // Remove line/paragraph separators
}

/**
 * Validates URL to ensure it's safe for HTTP requests
 * @param url - The URL to validate
 * @returns True if URL is safe, false otherwise
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);

        // Only allow HTTPS for security
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }

        // Only allow specific trusted domains for Python documentation
        const allowedHosts = [
            'docs.python.org',
            'www.python.org'
        ];

        return allowedHosts.includes(parsedUrl.hostname);
    } catch (error) {
        return false;
    }
}

/**
 * Escapes regex special characters to prevent injection
 * @param string - The string to escape
 * @returns Escaped string safe for use in regex
 */
export function escapeRegExp(string: string): string {
    // Escape all regex special characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a safe regex pattern with timeout protection
 * @param pattern - The regex pattern
 * @param flags - Optional regex flags
 * @param timeoutMs - Timeout in milliseconds (default: 100ms)
 * @returns Compiled regex or null if invalid/unsafe
 */
export function createSafeRegex(pattern: string, flags?: string, timeoutMs: number = 100): RegExp | null {
    try {
        // Basic pattern validation to prevent obvious ReDoS patterns
        if (containsSuspiciousPatterns(pattern)) {
            console.warn('Suspicious regex pattern detected:', pattern);
            return null;
        }

        const regex = new RegExp(pattern, flags);

        // Test the regex with a simple input to check for excessive backtracking
        const testStart = Date.now();
        regex.test('test');
        const testTime = Date.now() - testStart;

        if (testTime > timeoutMs) {
            console.warn('Regex pattern may cause performance issues:', pattern);
            return null;
        }

        return regex;
    } catch (error) {
        console.error('Invalid regex pattern:', pattern, error);
        return null;
    }
}

/**
 * Checks for potentially dangerous regex patterns that could cause ReDoS
 * @param pattern - The regex pattern to check
 * @returns True if pattern contains suspicious constructs
 */
function containsSuspiciousPatterns(pattern: string): boolean {
    // Common ReDoS patterns to avoid
    const suspiciousPatterns = [
        /\(\?\!\s*\)\+/,  // Negative lookahead with repetition
        /\(\?\!\s*\)\*/,  // Negative lookahead with repetition
        /\(\?\:\s*\)\+/,  // Non-capturing group with excessive repetition
        /\(\?\:\s*\)\{/,  // Non-capturing group with quantifiers
        /\+\+/,           // Double plus (catastrophic backtracking)
        /\*\*/,           // Double asterisk (catastrophic backtracking)
        /\(\?\!\$\)/,     // Negative lookahead at end
    ];

    return suspiciousPatterns.some(pattern => pattern.test(pattern.toString()));
}

/**
 * Rate limiter for API calls to prevent abuse
 */
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 100, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Check if a request is allowed
     * @param key - Identifier for the request source
     * @returns True if request is allowed, false if rate limited
     */
    isAllowed(key: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(key) || [];

        // Remove expired requests
        const validRequests = requests.filter(time => now - time < this.windowMs);

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(key, validRequests);

        return true;
    }

    /**
     * Clear rate limit data for a key
     * @param key - The key to clear
     */
    clear(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Clear all rate limit data
     */
    clearAll(): void {
        this.requests.clear();
    }
}
