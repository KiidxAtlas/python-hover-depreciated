import * as vscode from 'vscode';
import { DATA_TYPES, MAP } from './data/map';
import { Info } from './types';

export function getContextualInfo(doc: vscode.TextDocument, position: vscode.Position, word: string): Info | undefined {
    const line = doc.lineAt(position).text;
    const beforeWord = line.substring(0, position.character);
    const afterWord = line.substring(position.character + word.length);

    if (DATA_TYPES.includes(word)) {
        if (afterWord.trim().startsWith('(') || beforeWord.trim().endsWith('.')) return MAP[word];
        if (beforeWord.includes(':') || beforeWord.includes('isinstance') || beforeWord.includes('type')) return MAP[word];
    }

    if (['class', 'def', 'import', 'from'].includes(word)) {
        if (beforeWord.trim().endsWith('.')) return undefined;
    }

    if (word === 'await') {
        const fullText = doc.getText();
        const textBeforePosition = fullText.substring(0, doc.offsetAt(position));
        if (!textBeforePosition.includes('async def') && !textBeforePosition.includes('async with')) {
            const info = MAP[word];
            return info ? { ...info, title: info.title + ' (requires async context)' } : undefined;
        }
    }

    return MAP[word as keyof typeof MAP] || MAP[word.toLowerCase() as keyof typeof MAP];
}
