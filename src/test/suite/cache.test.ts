import * as assert from 'assert';
import { CacheManager } from '../../utils/cache';

suite('CacheManager Test Suite', () => {
    let cacheManager: CacheManager;

    setup(() => {
        cacheManager = CacheManager.getInstance();
        cacheManager.clear();
    });

    test('should store and retrieve values', () => {
        const key = 'test-key';
        const value = { data: 'test-value' };
        const ttl = 5000; // 5 seconds

        cacheManager.set(key, value, ttl);
        const retrieved = cacheManager.get(key);

        assert.deepStrictEqual(retrieved, value);
    });

    test('should return undefined for non-existent keys', () => {
        const result = cacheManager.get('non-existent');
        assert.strictEqual(result, undefined);
    });

    test('should expire values after TTL', async () => {
        const key = 'expiring-key';
        const value = 'expiring-value';
        const ttl = 100; // 100ms

        cacheManager.set(key, value, ttl);

        // Should exist immediately
        assert.strictEqual(cacheManager.get(key), value);

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 150));

        // Should be expired
        assert.strictEqual(cacheManager.get(key), undefined);
    });

    test('should implement LRU eviction', () => {
        // Set max size to 2 for testing
        cacheManager.setMaxSize(2);

        cacheManager.set('key1', 'value1', 5000);
        cacheManager.set('key2', 'value2', 5000);
        cacheManager.set('key3', 'value3', 5000); // Should evict key1

        assert.strictEqual(cacheManager.get('key1'), undefined);
        assert.strictEqual(cacheManager.get('key2'), 'value2');
        assert.strictEqual(cacheManager.get('key3'), 'value3');
    });

    test('should track hit and miss statistics', () => {
        cacheManager.set('hit-key', 'hit-value', 5000);

        // Generate hits and misses
        cacheManager.get('hit-key'); // hit
        cacheManager.get('hit-key'); // hit
        cacheManager.get('miss-key'); // miss

        const stats = cacheManager.getStats();
        assert.strictEqual(stats.hits, 2);
        assert.strictEqual(stats.misses, 1);
        assert.strictEqual(stats.hitRate, 2 / 3);
    });

    test('should cleanup expired entries', async () => {
        cacheManager.set('short-lived', 'value', 50); // 50ms
        cacheManager.set('long-lived', 'value', 5000); // 5s

        await new Promise(resolve => setTimeout(resolve, 100));

        const removed = cacheManager.cleanup();
        assert.strictEqual(removed, 1);
        assert.strictEqual(cacheManager.get('short-lived'), undefined);
        assert.strictEqual(cacheManager.get('long-lived'), 'value');
    });

    test('should handle has() method correctly', () => {
        const key = 'has-key';

        assert.strictEqual(cacheManager.has(key), false);

        cacheManager.set(key, 'value', 5000);
        assert.strictEqual(cacheManager.has(key), true);

        cacheManager.delete(key);
        assert.strictEqual(cacheManager.has(key), false);
    });

    test('should clear all entries', () => {
        cacheManager.set('key1', 'value1', 5000);
        cacheManager.set('key2', 'value2', 5000);

        cacheManager.clear();

        assert.strictEqual(cacheManager.get('key1'), undefined);
        assert.strictEqual(cacheManager.get('key2'), undefined);

        const stats = cacheManager.getStats();
        assert.strictEqual(stats.size, 0);
        assert.strictEqual(stats.hits, 0);
        assert.strictEqual(stats.misses, 0);
    });
});
