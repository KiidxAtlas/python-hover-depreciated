import * as vscode from 'vscode';
import { getConfig } from '../config';
import { Info } from '../types';
import { fetchText } from '../utils/http';

type IndexEntry = { key: string; info: Info };

const INDEX_CACHE_KEY = (ver: string) => `pyDocs:index:v1:${ver}`;

export async function buildDynamicIndex(context: vscode.ExtensionContext): Promise<Record<string, Info>> {
    const { pythonVersion, indexCacheDays } = getConfig();
    const loc = (getConfig().docsLocale && getConfig().docsLocale !== 'en') ? `/${getConfig().docsLocale}` : '';
    const base = `https://docs.python.org${loc}/${pythonVersion}`;
    const cacheKey = INDEX_CACHE_KEY(pythonVersion);
    const keepMs = indexCacheDays * 24 * 60 * 60 * 1000;

    const cached = context.globalState.get<{ ts: number; data: Record<string, Info> }>(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.ts) < keepMs) return cached.data;

    // Sources to crawl (shallow): Library and Reference index pages
    const urls = [
        `${base}/library/index.html`,
        `${base}/reference/index.html`,
        // Helpful additional sources
        `${base}/glossary.html`,
        'https://peps.python.org/'
    ];

    const map: Record<string, Info> = {};

    for (const url of urls) {
        try {
            const html = await fetchText(url);
            // Collect anchor links that look like reference targets for built-ins/keywords
            // e.g., <a href="functions.html#print">print()</a>
            const linkRe = /<a\s+href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/gi;
            let m: RegExpExecArray | null;
            while ((m = linkRe.exec(html))) {
                const href = m[1];
                const text = strip(clean(m[2]));
                if (!href || !text) continue;
                // keywords are plain words; built-ins often end with ()
                const key = text.replace(/\(\)$/, '').trim();
                if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
                // heuristics: only keep links into library/* or reference/* (and selected extras)
                if (!/(^|\/)library\/.+|(^|\/)reference\/.+|glossary\.html|^https?:\/\/peps\.python\.org\//.test(href)) continue;
                // split page and anchor
                const [page, frag] = href.split('#');
                const anchor = frag || '';
                // Skip generic index backlinks
                if (/index\.html$/.test(page)) continue;
                const info: Info = { title: text, url: page.replace(/^\//, ''), anchor };
                // prefer more specific anchors for existing keys; otherwise set
                if (!map[key] || (anchor && !map[key].anchor)) map[key] = info;
            }
        } catch {
            // best effort per page
        }
    }

    await context.globalState.update(cacheKey, { ts: now, data: map });
    return map;
}

export function strip(s: string) { return s.replace(/\s+/g, ' ').trim(); }
export function clean(s: string) { return s.replace(/<[^>]+>/g, ''); }
