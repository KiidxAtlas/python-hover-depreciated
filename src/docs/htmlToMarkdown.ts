function strip(s: string) { return s.replace(/\s+/g, ' ').trim(); }
function decode(s: string) {
    return s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export function htmlToMarkdown(html: string, baseUrl: string): string {
    // Remove scripts/styles and noisy blocks early
    let noScripts = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        // Remove admonitions (note, warning, versionchanged, etc.)
        .replace(/<div[^>]*class="[^"]*admonition[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove sidebar/seealso blocks
        .replace(/<div[^>]*class="[^"]*(sidebar|seealso)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove footnote references and backrefs
        .replace(/<sup[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
        .replace(/<a[^>]*class="[^"]*footnote-reference[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
        .replace(/<a[^>]*class="[^"]*fn-backref[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

    let urlBase: string;
    if (baseUrl.includes('://')) urlBase = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    else urlBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    // Handle production lists (grammar definitions)
    noScripts = noScripts.replace(/<div[^>]*class="[^"]*productionlist[^"]*"[^>]*>[\s\S]*?<\/div>/gi, (m) => {
        const inner = m.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n');
        const text = decode(inner).split('\n').map(s => s.trim()).filter(Boolean).join('\n');
        return `\n\n\`\`\`text\n${text}\n\`\`\`\n\n`;
    });

    let md = noScripts
        // Convert Sphinx highlight blocks to fenced code
        .replace(/<div[^>]*class="[^"]*highlight[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gi, (_m, p1) => {
            const inner = decode((p1 as string).replace(/<[^>]+>/g, ''));
            const code = inner.replace(/\n{3,}/g, '\n\n').trim();
            return `\n\n\`\`\`python\n${code}\n\`\`\`\n\n`;
        })
        .replace(/<a[^>]*href="([^"]*?)(?:#([^"]*))?"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, anchor, text) => {
            if (!href || href.startsWith('#')) return strip(text);
            if (!href.startsWith('http') && !href.startsWith('//') && !href.startsWith('mailto:')) {
                let cleanHref = href as string;
                if ((href as string).startsWith('../')) {
                    cleanHref = (href as string).replace(/^\.\.\//, '');
                    const urlParts = baseUrl.split('/');
                    const parentUrl = urlParts.slice(0, -2).join('/');
                    const fullUrl = anchor ? `${parentUrl}/${cleanHref}#${anchor}` : `${parentUrl}/${cleanHref}`;
                    return `[${strip(text)}](${fullUrl})`;
                } else {
                    const fullUrl = anchor ? `${urlBase}/${cleanHref}#${anchor}` : `${urlBase}/${cleanHref}`;
                    return `[${strip(text)}](${fullUrl})`;
                }
            }
            if ((href as string).startsWith('http')) {
                const fullUrl = anchor ? `${href}#${anchor}` : href;
                return `[${strip(text)}](${fullUrl})`;
            }
            return strip(text);
        })
        .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, (_match, text) => strip(text || ''))
        .replace(/<link[^>]*>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<div[^>]*class="[^"]*headerlink[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<span[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
        .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, p1) => "\n```python\n" + decode(p1).trim() + "\n```\n")
        .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => "`" + decode(p1).trim() + "`")
        .replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, (_m, p1) => `**${strip(decode(p1))}**\n`)
        .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, (_m, p1) => `${strip(decode(p1))}\n\n`)
        .replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (_m, p1) => p1)
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, p1) => `- ${strip(decode(p1))}\n`)
        .replace(/<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi, (_m, p1) => p1 + "\n")
        .replace(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, _level, text) => `\n### ${strip(decode(text))}\n`)
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
        .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_m, p1) => `**${strip(decode(p1))}**`)
        .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
        .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_m, p1) => `*${strip(decode(p1))}*`)
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, p1) => strip(decode(p1)) + "\n\n")
        .replace(/<br\s*\/?>(?=\n?)/gi, "\n")
        .replace(/<[^>]+>/g, '')
        .replace(/¶/g, '')
        // Remove bracketed numeric footnotes left in text e.g., [5]
        .replace(/\s\[\d+\]/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s+\n/g, "\n\n");

    md = md.replace(/\n{3,}/g, "\n\n").trim();
    return md;
}
