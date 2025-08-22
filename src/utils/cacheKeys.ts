/**
 * Centralized cache key management and constants
 */

// Cache key prefixes for different cache types
export const CACHE_PREFIXES = {
    DOCS: 'pyDocs:',
    HOT: 'hot:',
    SECTION: 'sec:',
    GENERAL: 'cache:',
    INDEX: 'pyHover:cacheIndex'
} as const;

// Cache version for invalidating old entries
export const CACHE_VERSION = 'v8';

/**
 * Generate a standardized cache key for documentation
 */
export function createDocsCacheKey(pythonVersion: string, url: string, anchor?: string): string {
    return `${CACHE_PREFIXES.DOCS}${CACHE_VERSION}:${pythonVersion}:${url}#${anchor || ''}`;
}

/**
 * Generate a standardized cache key for hot cache
 */
export function createHotCacheKey(pythonVersion: string, url: string, anchor?: string): string {
    return `${CACHE_PREFIXES.HOT}${CACHE_VERSION}:${pythonVersion}:${url}#${anchor || ''}`;
}

/**
 * Generate a standardized cache key for section cache
 */
export function createSectionCacheKey(baseUrl: string, url: string, anchor?: string): string {
    return `${CACHE_PREFIXES.SECTION}${CACHE_VERSION}:${baseUrl}:${url}#${anchor || ''}`;
}

/**
 * Check if a key matches any of the cache prefixes
 */
export function isCacheKey(key: string): boolean {
    return Object.values(CACHE_PREFIXES).some(prefix => key.startsWith(prefix));
}

/**
 * Get all cache keys that match a specific prefix
 */
export function getCacheKeysByPrefix(allKeys: readonly string[], prefix: string): string[] {
    return allKeys.filter(key => key.startsWith(prefix));
}

/**
 * Parse a cache key to extract its components
 */
export function parseCacheKey(key: string): { prefix: string; version?: string; components: string[] } | null {
    try {
        const parts = key.split(':');
        if (parts.length < 2) return null;

        const prefix = parts[0] + ':';
        const version = parts[1].startsWith('v') ? parts[1] : undefined;
        const components = version ? parts.slice(2) : parts.slice(1);

        return { prefix, version, components };
    } catch {
        return null;
    }
}

/**
 * Cache statistics interface
 */
export interface CacheStatistics {
    totalEntries: number;
    expiredEntries: number;
    totalSizeKB: number;
    entriesByType: Record<string, number>;
    oldestEntry?: Date;
    newestEntry?: Date;
}
