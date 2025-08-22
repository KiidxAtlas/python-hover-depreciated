import * as assert from 'assert';
import { validateConfig } from '../../config';
import { CacheManager } from '../../utils/cache';

suite('Improvements Test Suite', () => {
    test('Configuration validation should handle invalid values', () => {
        const invalidConfig = {
            maxContentLength: -100,
            cacheDays: 1000,
            pythonVersion: 'invalid-version',
            docsLocale: 'invalid-locale',
            openTarget: 'invalid-target' as any,
            httpTimeoutMs: 100,
            httpRetries: 50
        };

        const validatedConfig = validateConfig(invalidConfig);

        // Test that invalid values are corrected
        assert.strictEqual(validatedConfig.maxContentLength >= 100, true, 'maxContentLength should be at least 100');
        assert.strictEqual(validatedConfig.cacheDays <= 365, true, 'cacheDays should be at most 365');
        assert.strictEqual(validatedConfig.pythonVersion, '3.12', 'Invalid pythonVersion should default to 3.12');
        assert.strictEqual(validatedConfig.docsLocale, 'en', 'Invalid docsLocale should default to en');
        assert.strictEqual(validatedConfig.openTarget, 'auto', 'Invalid openTarget should default to auto');
        assert.strictEqual(validatedConfig.httpTimeoutMs >= 1000, true, 'httpTimeoutMs should be at least 1000');
        assert.strictEqual(validatedConfig.httpRetries <= 10, true, 'httpRetries should be at most 10');
    });

    test('Configuration validation should preserve valid values', () => {
        const validConfig = {
            maxContentLength: 2000,
            cacheDays: 14,
            pythonVersion: '3.11',
            docsLocale: 'en_US',
            openTarget: 'editor' as const,
            httpTimeoutMs: 5000,
            httpRetries: 3
        };

        const validatedConfig = validateConfig(validConfig);

        // Test that valid values are preserved
        assert.strictEqual(validatedConfig.maxContentLength, 2000);
        assert.strictEqual(validatedConfig.cacheDays, 14);
        assert.strictEqual(validatedConfig.pythonVersion, '3.11');
        assert.strictEqual(validatedConfig.docsLocale, 'en_US');
        assert.strictEqual(validatedConfig.openTarget, 'editor');
        assert.strictEqual(validatedConfig.httpTimeoutMs, 5000);
        assert.strictEqual(validatedConfig.httpRetries, 3);
    });

    test('Cache manager should handle memory limits', () => {
        const cacheManager = CacheManager.getInstance();

        // Test memory stats are available
        const memoryStats = cacheManager.getMemoryStats();
        assert.strictEqual(typeof memoryStats.currentSize, 'number');
        assert.strictEqual(typeof memoryStats.maxSize, 'number');
        assert.strictEqual(typeof memoryStats.utilization, 'number');

        // Utilization should be between 0 and 1
        assert.strictEqual(memoryStats.utilization >= 0, true);
        assert.strictEqual(memoryStats.utilization <= 1, true);
    });

    test('Cache manager should handle large entries gracefully', () => {
        const cacheManager = CacheManager.getInstance();
        const initialStats = cacheManager.getMemoryStats();

        // Try to cache a large object
        const largeObject = { data: 'x'.repeat(10000) };

        try {
            cacheManager.set('large-test-key', largeObject, 60000);

            // Verify the entry was cached
            const retrieved = cacheManager.get('large-test-key');
            assert.deepStrictEqual(retrieved, largeObject);

            // Test passed - large entry handled correctly
        } catch (error) {
            // Should not throw errors for large entries
            assert.fail(`Cache should handle large entries gracefully: ${error}`);
        }
    });

    test('Configuration validation should provide sensible defaults', () => {
        const emptyConfig = {};
        const validatedConfig = validateConfig(emptyConfig);

        // Test that defaults are sensible
        assert.strictEqual(validatedConfig.useDomParser, true);
        assert.strictEqual(validatedConfig.contextAware, true);
        assert.strictEqual(validatedConfig.includeBuiltins, true);
        assert.strictEqual(validatedConfig.showExamples, true);
        assert.strictEqual(validatedConfig.maxContentLength >= 100, true);
        assert.strictEqual(validatedConfig.cacheDays >= 1, true);
        assert.strictEqual(validatedConfig.pythonVersion.match(/^\d+(\.\d+)?$/), validatedConfig.pythonVersion);
    });
});
