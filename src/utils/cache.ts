import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Enhanced cache entry with expiration support
 */
export interface CacheEntry<T> {
    value: T;
    expires: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

/**
 * Improved LRU cache with TTL support and memory management
 */
export class LRUCache<K, V> {
    private maxSize: number;
    private cache: Map<K, V>;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    keys(): IterableIterator<K> {
        return this.cache.keys();
    }

    values(): IterableIterator<V> {
        return this.cache.values();
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    entries(): IterableIterator<[K, V]> {
        return this.cache.entries();
    }
}

/**
 * Enhanced cache manager with disk persistence and cache warming
 */
export class CacheManager {
    private static instance: CacheManager;
    private cache: LRUCache<string, CacheEntry<any>>;
    private stats: { hits: number; misses: number };
    private maxSize: number;
    private diskCacheEnabled: boolean;
    private diskCachePath: string;
    private warmupPromise: Promise<void> | null = null;

    private constructor() {
        this.maxSize = 100;
        this.cache = new LRUCache<string, CacheEntry<any>>(this.maxSize);
        this.stats = { hits: 0, misses: 0 };
        this.diskCacheEnabled = true;
        this.diskCachePath = '';
    }

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * Initialize cache with extension context for disk persistence
     */
    initialize(context: vscode.ExtensionContext): void {
        this.diskCachePath = path.join(context.globalStorageUri.fsPath, 'documentationCache');
        this.ensureDiskCacheDirectory();
        this.startCacheWarming();
    }

    /**
     * Ensure disk cache directory exists
     */
    private ensureDiskCacheDirectory(): void {
        if (!this.diskCacheEnabled) return;

        try {
            if (!fs.existsSync(this.diskCachePath)) {
                fs.mkdirSync(this.diskCachePath, { recursive: true });
            }
        } catch (error) {
            console.warn('Failed to create disk cache directory:', error);
            this.diskCacheEnabled = false;
        }
    }

    /**
     * Start cache warming with frequently used keywords
     */
    private startCacheWarming(): void {
        if (this.warmupPromise) return;

        this.warmupPromise = this.warmFrequentlyUsedKeys();
    }

    /**
     * Warm cache with frequently used Python keywords
     */
    private async warmFrequentlyUsedKeys(): Promise<void> {
        const frequentKeywords = [
            'class', 'def', 'if', 'for', 'while', 'try', 'except',
            'import', 'from', 'with', 'async', 'await', 'str', 'list',
            'dict', 'tuple', 'set', 'int', 'float', 'bool'
        ];

        for (const keyword of frequentKeywords) {
            try {
                await this.loadFromDisk(keyword);
            } catch (error) {
                // Ignore errors during warming
                console.debug('Cache warming failed for:', keyword, error);
            }
        }
    }

    /**
     * Set cache entry with TTL
     */
    set<T>(key: string, value: T, ttl: number = 3600000): void {
        const expires = Date.now() + ttl;
        const entry: CacheEntry<T> = { value, expires };

        this.cache.set(key, entry);

        // Save to disk asynchronously
        if (this.diskCacheEnabled) {
            this.saveToDisk(key, entry).catch(error => {
                console.debug('Failed to save to disk cache:', error);
            });
        }
    }

    /**
     * Get cache entry with TTL check
     */
    get<T>(key: string): T | undefined {
        // Check memory cache first
        const entry = this.cache.get(key);
        if (entry) {
            if (Date.now() < entry.expires) {
                this.stats.hits++;
                return entry.value;
            } else {
                // Expired entry
                this.cache.delete(key);
                this.deleteFromDisk(key);
            }
        }

        // Check disk cache
        if (this.diskCacheEnabled) {
            try {
                const diskEntry = this.loadFromDiskSync(key);
                if (diskEntry && Date.now() < diskEntry.expires) {
                    // Load into memory cache
                    this.cache.set(key, diskEntry);
                    this.stats.hits++;
                    return diskEntry.value;
                } else if (diskEntry) {
                    // Expired disk entry
                    this.deleteFromDisk(key);
                }
            } catch (error) {
                console.debug('Failed to load from disk cache:', error);
            }
        }

        this.stats.misses++;
        return undefined;
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry && Date.now() < entry.expires) {
            return true;
        }

        // Check disk cache
        if (this.diskCacheEnabled) {
            try {
                const diskEntry = this.loadFromDiskSync(key);
                return diskEntry !== null && Date.now() < diskEntry.expires;
            } catch (error) {
                return false;
            }
        }

        return false;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };

        if (this.diskCacheEnabled) {
            this.clearDiskCache();
        }
    }

    /**
     * Set maximum cache size
     */
    setMaxSize(size: number): void {
        this.maxSize = size;
        this.cache = new LRUCache<string, CacheEntry<any>>(size);
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size(),
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Save entry to disk cache
     */
    private async saveToDisk<T>(key: string, entry: CacheEntry<T>): Promise<void> {
        if (!this.diskCacheEnabled) return;

        const sanitizedKey = this.sanitizeFileName(key);
        const filePath = path.join(this.diskCachePath, `${sanitizedKey}.json`);

        try {
            const data = JSON.stringify(entry);
            await fs.promises.writeFile(filePath, data, 'utf8');
        } catch (error) {
            console.debug('Failed to save to disk:', error);
        }
    }

    /**
     * Load entry from disk cache synchronously
     */
    private loadFromDiskSync(key: string): CacheEntry<any> | null {
        if (!this.diskCacheEnabled) return null;

        const sanitizedKey = this.sanitizeFileName(key);
        const filePath = path.join(this.diskCachePath, `${sanitizedKey}.json`);

        try {
            if (!fs.existsSync(filePath)) return null;

            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    /**
     * Load entry from disk cache asynchronously
     */
    private async loadFromDisk(key: string): Promise<CacheEntry<any> | null> {
        if (!this.diskCacheEnabled) return null;

        const sanitizedKey = this.sanitizeFileName(key);
        const filePath = path.join(this.diskCachePath, `${sanitizedKey}.json`);

        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    /**
     * Delete entry from disk cache
     */
    private deleteFromDisk(key: string): void {
        if (!this.diskCacheEnabled) return;

        const sanitizedKey = this.sanitizeFileName(key);
        const filePath = path.join(this.diskCachePath, `${sanitizedKey}.json`);

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.debug('Failed to delete from disk:', error);
        }
    }

    /**
     * Clear all disk cache files
     */
    private clearDiskCache(): void {
        if (!this.diskCacheEnabled) return;

        try {
            const files = fs.readdirSync(this.diskCachePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(this.diskCachePath, file));
                }
            }
        } catch (error) {
            console.debug('Failed to clear disk cache:', error);
        }
    }

    /**
     * Sanitize filename for disk storage
     */
    private sanitizeFileName(key: string): string {
        return key.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    /**
     * Cleanup expired entries (run periodically)
     */
    cleanupExpired(): void {
        const now = Date.now();

        // Clean memory cache
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now >= entry.expires) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
            this.deleteFromDisk(key);
        }
    }

    /**
     * Preload frequently used cache entries
     */
    async preloadFrequentEntries(): Promise<void> {
        await this.warmupPromise;
    }
}

// Export a default cache manager instance
export const cacheManager = CacheManager.getInstance();
