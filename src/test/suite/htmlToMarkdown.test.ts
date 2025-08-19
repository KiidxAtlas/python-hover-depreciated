import * as assert from 'assert';
import { htmlToMarkdown } from '../../docs/htmlToMarkdown';

suite('htmlToMarkdown Test Suite', () => {
    test('should fix versioned URLs correctly', () => {
        const input = '<a href="13/reference/expressions.html">Expressions</a>';
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('https://docs.python.org/3/reference/expressions.html'));
        assert.ok(!result.includes('13/reference'));
        assert.ok(result.includes('[Expressions]'));
    });

    test('should handle relative paths', () => {
        const input = '<a href="../library/functions.html">Built-in Functions</a>';
        const baseUrl = 'https://docs.python.org/3/reference/page.html';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('https://docs.python.org/3/library/functions.html'));
        assert.ok(result.includes('[Built-in Functions]'));
    });

    test('should preserve absolute URLs', () => {
        const input = '<a href="https://docs.python.org/3/library/os.html">os module</a>';
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('https://docs.python.org/3/library/os.html'));
        assert.ok(result.includes('[os module]'));
    });

    test('should handle fragment-only links', () => {
        const input = '<a href="#anchor">Section</a>';
        const baseUrl = 'https://docs.python.org/3/reference/expressions.html';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('https://docs.python.org/3/reference/expressions.html#anchor'));
        assert.ok(result.includes('[Section]'));
    });

    test('should decode HTML entities', () => {
        const input = '<p>This &amp; that, &lt;example&gt; with &quot;quotes&quot;</p>';
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('This & that, <example> with "quotes"'));
    });

    test('should convert code blocks properly', () => {
        const input = '<pre><code>def example():\n    return 42</code></pre>';
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('```python'));
        assert.ok(result.includes('def example()'));
        assert.ok(result.includes('return 42'));
    });

    test('should handle mixed content with links and code', () => {
        const input = `
            <p>The <a href="13/library/os.html">os module</a> provides:</p>
            <pre><code>import os
os.getcwd()</code></pre>
        `;
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(result.includes('[os module](https://docs.python.org/3/library/os.html)'));
        assert.ok(result.includes('```python'));
        assert.ok(result.includes('import os'));
    });

    test('should handle empty input gracefully', () => {
        const result = htmlToMarkdown('', 'https://docs.python.org/3/');
        assert.strictEqual(result, '');
    });

    test('should handle malformed HTML gracefully', () => {
        const input = '<a href="test.html">Link<p>Text</a>';
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        // Should not throw and should produce some reasonable output
        assert.ok(typeof result === 'string');
        assert.ok(result.length > 0);
    });

    test('should strip navigation and unwanted elements', () => {
        const input = `
            <nav>Navigation</nav>
            <div class="admonition">Warning</div>
            <p>Actual content</p>
            <sup class="footnote">1</sup>
        `;
        const baseUrl = 'https://docs.python.org/3/';
        const result = htmlToMarkdown(input, baseUrl);

        assert.ok(!result.includes('Navigation'));
        assert.ok(!result.includes('Warning'));
        assert.ok(result.includes('Actual content'));
        assert.ok(!result.includes('footnote'));
    });
});
