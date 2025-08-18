import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as vscode from 'vscode';

interface InventoryEntry {
    name: string;
    domain: string;
    role: string;
    uri: string;
    dispname: string;
}

const inventoryCache: Map<string, Map<string, string>> = new Map();

export async function fetchInventory(baseUrl: string): Promise<Map<string, string>> {
    if (inventoryCache.has(baseUrl)) {
        return inventoryCache.get(baseUrl)!;
    }

    const url = `${baseUrl}/objects.inv`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch inventory from ${url}`);
    }

    const buffer = await response.buffer();
    const decompressed = zlib.inflateSync(buffer).toString('utf-8');

    const inventory = parseInventory(decompressed, baseUrl);
    inventoryCache.set(baseUrl, inventory);

    return inventory;
}

function parseInventory(content: string, baseUrl: string): Map<string, string> {
    const lines = content.split('\n');
    const inventory = new Map<string, string>();

    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;

        const [name, domainRole, priority, uri, dispname] = line.split(' ');
        const [domain, role] = domainRole.split(':');

        const fullUri = `${baseUrl}/${uri.replace('$', name)}`;
        inventory.set(name, fullUri);
    }

    return inventory;
}

export async function resolveHover(word: string, document: vscode.TextDocument, position: vscode.Position, pythonHelper: any): Promise<vscode.Hover | null> {
    // Placeholder implementation for resolving hover content
    return null;
}
