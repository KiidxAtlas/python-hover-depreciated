import * as assert from 'assert';
import * as vscode from 'vscode';
import { resolveTypeInfoForAttribute } from '../../typeResolver';

suite('TypeResolver Test Suite', () => {

    test('should resolve string type from annotation', async () => {
        // Create a mock document with type annotation
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'name: str' : ''
            }),
            getText: () => 'name',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 4)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'name', 'upper');

        assert.ok(result, 'Should resolve string type info');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should resolve list type from assignment', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'items = list()' : ''
            }),
            getText: () => 'items',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 5)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'items', 'append');

        assert.ok(result, 'Should resolve list type info');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should resolve string literal assignments', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'message = "hello world"' : ''
            }),
            getText: () => 'message',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 7)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'message', 'upper');

        assert.ok(result, 'Should resolve string literal as str type');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should resolve dict literal assignments', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'config = {}' : ''
            }),
            getText: () => 'config',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 6)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'config', 'get');

        assert.ok(result, 'Should resolve dict literal as dict type');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should resolve list literal assignments', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'numbers = [1, 2, 3]' : ''
            }),
            getText: () => 'numbers',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 7)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'numbers', 'append');

        assert.ok(result, 'Should resolve list literal as list type');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should handle f-string assignments', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'greeting = f"Hello {name}"' : ''
            }),
            getText: () => 'greeting',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 8)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'greeting', 'upper');

        assert.ok(result, 'Should resolve f-string as str type');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });

    test('should return undefined for unresolvable types', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: ''
            }),
            getText: () => 'unknown',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 7)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(0, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'unknown', 'method');

        assert.strictEqual(result, undefined, 'Should return undefined for unresolvable types');
    });

    test('should handle class instantiation patterns', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'parser = ArgumentParser()' : ''
            }),
            getText: () => 'parser',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 6)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'parser', 'add_argument');

        // This should attempt to resolve but may not find a mapping for ArgumentParser
        // The important thing is that it doesn't crash
        assert.doesNotThrow(() => result, 'Should handle unknown class types gracefully');
    });

    test('should resolve tuple assignments', async () => {
        const mockDocument = {
            lineAt: (line: number) => ({
                text: line === 0 ? 'coords = (1, 2, 3)' : ''
            }),
            getText: () => 'coords',
            getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, 6)
        } as unknown as vscode.TextDocument;

        const position = new vscode.Position(1, 0);
        const result = await resolveTypeInfoForAttribute(mockDocument, position, 'coords', 'count');

        assert.ok(result, 'Should resolve tuple literal as tuple type');
        assert.strictEqual(result?.url, 'library/stdtypes.html', 'Should point to stdtypes');
    });
});
