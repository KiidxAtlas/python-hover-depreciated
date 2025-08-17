import * as https from 'https';
import { getConfig } from '../config';

// Use globalThis.URL to avoid needing the 'url' module types
const URLCtor = (globalThis as any).URL as (new (input: string, base?: string) => URL) | undefined;

export function fetchText(url: string): Promise<string> {
    const { httpTimeoutMs, httpRetries } = getConfig();

    const attempt = (n: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res: any) => {
                const statusCode = res.statusCode ?? 0;
                if (statusCode >= 300 && statusCode < 400 && res.headers && res.headers.location) {
                    const next = URLCtor ? new URLCtor(res.headers.location as string, url).toString() : (res.headers.location as string);
                    resolve(fetchText(next));
                    return;
                }
                if (statusCode >= 400) {
                    reject(new Error(`Request failed. Status code: ${statusCode} for ${url}`));
                    return;
                }
                let data = '';
                res.on('data', (chunk: any) => (data += chunk.toString()));
                res.on('end', () => resolve(data));
            });

            req.setTimeout(Math.max(1000, httpTimeoutMs || 6000), () => {
                req.destroy(new Error(`Request timed out after ${httpTimeoutMs}ms for ${url}`));
            });

            req.on('error', (err: Error) => {
                if (n < (httpRetries ?? 1)) {
                    const backoff = Math.min(1500, 250 * Math.pow(2, n));
                    setTimeout(() => attempt(n + 1).then(resolve).catch(reject), backoff);
                } else {
                    reject(err);
                }
            });
        });
    };

    return attempt(0);
}
