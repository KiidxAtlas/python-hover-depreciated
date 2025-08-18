import * as assert from 'assert';
import * as vscode from 'vscode';
import { htmlToMarkdown } from '../../docs/htmlToMarkdown';

// Simple test placeholder
console.log('Extension tests - ready for development');
console.log('VS Code API available:', typeof vscode !== 'undefined');

// Basic assertion test
assert.ok(true, 'Basic test passes');

// Lightweight sanity checks for htmlToMarkdown link repairs
(() => {
    const base = 'https://docs.python.org/3.13/reference/compound_stmts.html#the-if-statement';
    const input1 = 'See https://docs. 3.13/reference/expressions for details.';
    const out1 = htmlToMarkdown(input1, base);
    assert.ok(out1.includes('https://docs.python.org/3.13/reference/expressions'), 'repairs whitespace-split docs URL');

    const input2 = 'Also see 3.12/reference/compound_stmts.html#the-if-statement';
    const out2 = htmlToMarkdown(input2, base);
    assert.ok(out2.includes('https://docs.python.org/3.12/reference/compound_stmts.html#the-if-statement'), 'prefixes bare versioned path with docs host');
})();
