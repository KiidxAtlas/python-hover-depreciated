import * as https from 'https';
import { getConfig } from '../config';
import { isValidUrl, RateLimiter } from './security';

// Use globalThis.URL to avoid needing the 'url' module types
const URLCtor = (globalThis as any).URL as (new (input: string, base?: string) => URL) | undefined;

/**
 * HTTP retry options
 */
export interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    timeout: number;
    retryOnTimeout: boolean;
    retryOnConnectionError: boolean;
}

/**
 * Enhanced HTTP client with exponential backoff retry logic
 */
export class HttpClient {
    private static instance: HttpClient;
    private defaultOptions: RetryOptions;
    private rateLimiter: RateLimiter;

    private constructor() {
        this.defaultOptions = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            timeout: 6000,
            retryOnTimeout: true,
            retryOnConnectionError: true
        };
        
        // Initialize rate limiter: 100 requests per minute
        this.rateLimiter = new RateLimiter(100, 60000);
    }

    static getInstance(): HttpClient {
        if (!HttpClient.instance) {
            HttpClient.instance = new HttpClient();
        }
        return HttpClient.instance;
    }

    /**
     * Update default options from extension configuration
     */
    updateFromConfig(): void {
        const config = getConfig();
        this.defaultOptions.maxRetries = config.httpRetries;
        this.defaultOptions.timeout = config.httpTimeoutMs;
    }

    /**
     * Calculate exponential backoff delay with jitter
     */
    private calculateDelay(attempt: number, options: RetryOptions): number {
        const exponentialDelay = options.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        const delay = Math.min(exponentialDelay + jitter, options.maxDelay);
        return Math.floor(delay);
    }

    /**
     * Promise-based delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Determine if an error should trigger a retry
     */
    private shouldRetryError(error: Error, options: RetryOptions): boolean {
        const errorMessage = error.message.toLowerCase();
        const errorCode = (error as any).code;

        // Timeout errors
        if (options.retryOnTimeout && (
            errorMessage.includes('timeout') ||
            errorMessage.includes('timed out')
        )) {
            return true;
        }

        // Connection errors
        if (options.retryOnConnectionError && (
            errorMessage.includes('network') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('econnreset') ||
            errorMessage.includes('enotfound') ||
            errorMessage.includes('econnrefused') ||
            errorCode === 'ETIMEDOUT' ||
            errorCode === 'ECONNRESET' ||
            errorCode === 'ENOTFOUND' ||
            errorCode === 'ECONNREFUSED'
        )) {
            return true;
        }

        return false;
    }

    /**
     * Enhanced fetch with exponential backoff retry and security validation
     */
    async fetchWithRetry(url: string, retryOptions: Partial<RetryOptions> = {}): Promise<string> {
        // Security validation
        if (!isValidUrl(url)) {
            throw new Error(`Invalid or unsafe URL: ${url}`);
        }
        
        // Rate limiting
        const urlHost = new URL(url).hostname;
        if (!this.rateLimiter.isAllowed(urlHost)) {
            throw new Error(`Rate limit exceeded for ${urlHost}`);
        }
        
        const opts = { ...this.defaultOptions, ...retryOptions };
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                console.debug(`HTTP attempt ${attempt + 1}/${opts.maxRetries + 1} for ${url}`);

                const result = await this.fetchSingle(url, opts.timeout);
                console.debug(`HTTP success for ${url} on attempt ${attempt + 1}`);
                return result;

            } catch (error) {
                lastError = error as Error;

                // Check if we should retry this error
                const shouldRetry = this.shouldRetryError(lastError, opts) && attempt < opts.maxRetries;

                if (shouldRetry) {
                    const delay = this.calculateDelay(attempt, opts);
                    console.debug(`HTTP error for ${url}: ${lastError.message}, retrying in ${delay}ms...`);
                    await this.delay(delay);
                    continue;
                }

                // Don't retry or max attempts reached
                console.debug(`HTTP failed for ${url} after ${attempt + 1} attempts: ${lastError.message}`);
                throw lastError;
            }
        }

        throw lastError || new Error('Max retries exceeded');
    }

    /**
     * Single HTTP request with timeout
     */
    private fetchSingle(url: string, timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res: any) => {
                const statusCode = res.statusCode ?? 0;

                // Handle redirects
                if (statusCode >= 300 && statusCode < 400 && res.headers && res.headers.location) {
                    const next = URLCtor ? new URLCtor(res.headers.location as string, url).toString() : (res.headers.location as string);
                    this.fetchSingle(next, timeout).then(resolve).catch(reject);
                    return;
                }

                // Handle client/server errors
                if (statusCode >= 400) {
                    reject(new Error(`Request failed. Status code: ${statusCode} for ${url}`));
                    return;
                }

                let data = '';
                res.on('data', (chunk: any) => (data += chunk.toString()));
                res.on('end', () => resolve(data));
                res.on('error', reject);
            });

            req.setTimeout(Math.max(1000, timeout), () => {
                req.destroy(new Error(`Request timed out after ${timeout}ms for ${url}`));
            });

            req.on('error', reject);
        });
    }

    /**
     * Check if URL is reachable
     */
    async isReachable(url: string, timeout: number = 3000): Promise<boolean> {
        try {
            await this.fetchWithRetry(url, { maxRetries: 0, timeout });
            return true;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Global HTTP client instance
 */
export const httpClient = HttpClient.getInstance();

/**
 * Enhanced fetchText function with retry logic - backward compatible
 */
export function fetchText(url: string): Promise<string> {
    const { httpTimeoutMs, httpRetries } = getConfig();

    // Use the enhanced HTTP client
    httpClient.updateFromConfig();
    return httpClient.fetchWithRetry(url, {
        maxRetries: httpRetries,
        timeout: httpTimeoutMs
    });
}

/**
 * Convenience function for custom retry options
 */
export async function fetchTextWithRetry(url: string, retryOptions?: Partial<RetryOptions>): Promise<string> {
    httpClient.updateFromConfig();
    return httpClient.fetchWithRetry(url, retryOptions);
}
