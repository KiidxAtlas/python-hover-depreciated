import * as assert from 'assert';
import * as vscode from 'vscode';
import { getContextualInfo } from '../../context';
import { MAP } from '../../data/map';

suite('Context Test Suite', () => {

    test('should return data type info when used as constructor', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'result = str(42)'
            }),
            getText: () => '',
            offsetAt: () => 9
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 9); // Position at 'str'
        const result = getContextualInfo(mockDocument, position, 'str');

        assert.ok(result, 'Should return info for str constructor');
        assert.strictEqual(result?.title, MAP.str.title, 'Should return str type info');
    });

    test('should return data type info when used in type annotation', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'name: str = "hello"'
            }),
            getText: () => '',
            offsetAt: () => 6
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 6); // Position at 'str'
        const result = getContextualInfo(mockDocument, position, 'str');

        assert.ok(result, 'Should return info for str annotation');
        assert.strictEqual(result?.title, MAP.str.title, 'Should return str type info');
    });

    test('should return data type info when used in isinstance', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'if isinstance(value, str):'
            }),
            getText: () => '',
            offsetAt: () => 21
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 21); // Position at 'str'
        const result = getContextualInfo(mockDocument, position, 'str');

        assert.ok(result, 'Should return info for str in isinstance');
        assert.strictEqual(result?.title, MAP.str.title, 'Should return str type info');
    });

    test('should not return keyword info when used as attribute', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'obj.class = "something"'
            }),
            getText: () => '',
            offsetAt: () => 4
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 4); // Position at 'class'
        const result = getContextualInfo(mockDocument, position, 'class');

        assert.strictEqual(result, undefined, 'Should not return keyword info when used as attribute');
    });

    test('should handle await with async context', () => {
        const fullText = `async def fetch_data():
    result = await fetch()`;

        const mockDocument = {
            lineAt: (line: number) => ({
                text: '    result = await fetch()'
            }),
            getText: () => fullText,
            offsetAt: () => fullText.indexOf('await')
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 13); // Position at 'await'
        const result = getContextualInfo(mockDocument, position, 'await');

        assert.ok(result, 'Should return info for await in async context');
        assert.strictEqual(result?.title, MAP.await.title, 'Should return normal await info');
    });

    test('should handle await without async context', () => {
        const fullText = `def fetch_data():
    result = await fetch()`;

        const mockDocument = {
            lineAt: (line: number) => ({
                text: '    result = await fetch()'
            }),
            getText: () => fullText,
            offsetAt: () => fullText.indexOf('await')
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 13); // Position at 'await'
        const result = getContextualInfo(mockDocument, position, 'await');

        assert.ok(result, 'Should return info for await without async context');
        assert.ok(result?.title.includes('(requires async context)'), 'Should indicate async context requirement');
    });

    test('should return undefined for unknown words', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'unknown_keyword = 42'
            }),
            getText: () => '',
            offsetAt: () => 0
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 0);
        const result = getContextualInfo(mockDocument, position, 'unknown_keyword');

        assert.strictEqual(result, undefined, 'Should return undefined for unknown words');
    });

    test('should handle edge cases with empty lines', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: ''
            }),
            getText: () => '',
            offsetAt: () => 0
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 0);
        const result = getContextualInfo(mockDocument, position, 'class');

        // Should return the default MAP entry for 'class'
        assert.ok(result, 'Should handle empty lines gracefully');
        assert.strictEqual(result?.title, MAP.class.title, 'Should return class info');
    });

    test('should handle list data type detection', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'items = list()'
            }),
            getText: () => '',
            offsetAt: () => 8
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 8); // Position at 'list'
        const result = getContextualInfo(mockDocument, position, 'list');

        assert.ok(result, 'Should return info for list constructor');
        assert.strictEqual(result?.title, MAP.list.title, 'Should return list type info');
    });

    test('should handle dict data type detection', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'config = dict(key="value")'
            }),
            getText: () => '',
            offsetAt: () => 9
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 9); // Position at 'dict'
        const result = getContextualInfo(mockDocument, position, 'dict');

        assert.ok(result, 'Should return info for dict constructor');
        assert.strictEqual(result?.title, MAP.dict.title, 'Should return dict type info');
    });

    test('should handle case insensitive lookup', () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: 'CLASS MyClass:'
            }),
            getText: () => '',
            offsetAt: () => 0
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 0);
        const result = getContextualInfo(mockDocument, position, 'CLASS');

        assert.ok(result, 'Should handle case insensitive lookup');
        assert.strictEqual(result?.title, MAP.class.title, 'Should return class info for uppercase CLASS');
    });
});
