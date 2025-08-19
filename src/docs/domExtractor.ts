import { CheerioAPI, load } from 'cheerio';

export function extractSectionHtmlDom(fullHtml: string, pageUrl: string, anchor: string): string {
    const $: CheerioAPI = load(fullHtml);
    // Locate the node with id=anchor, prefer headings/sections first
    let node = $(`[id="${anchor}"]`).first();
    if (!node || node.length === 0) {
        // Try name attributes or anchor links
        node = $(`[name="${anchor}"]`).first();
        if (!node || node.length === 0) throw new Error(`Anchor ${anchor} not found`);
    }

    // Special handling for definition list items (dt/dd pairs) - common in Python builtin docs
    if (node.is('dt')) {
        const frag: string[] = [];
        // Add the dt element itself
        frag.push($.html(node) || '');

        // Find the corresponding dd element(s) - they immediately follow the dt
        let cur = node.next();
        while (cur && cur.length && cur.is('dd')) {
            frag.push($.html(cur) || '');
            cur = cur.next();
        }

        // Wrap in a dl container to maintain proper structure
        const container = load(`<dl>${frag.join('')}</dl>`);
        sanitizeAndRewrite(container, pageUrl);
        return container.html() || '';
    }

    // If the anchor is on a <section> (as in Sphinx docs), extract that section only.
    // Otherwise, prefer the closest section ancestor that contains the anchor.
    let section = node.is('section') ? node : node.closest('section');
    if (section && section.length) {
        // Use the section HTML directly to avoid bleeding into sibling sections like "while", "for", etc.
        const sectionHtml = $.html(section);
        // Wrap in a container for uniform post-processing below
        const container = load(`<div>${sectionHtml}</div>`);
        sanitizeAndRewrite(container, pageUrl);
        // Return the inner HTML of the wrapper div
        return container('div').html() || '';
    }

    // Fallback: if no section wrapper exists, use heading-based accumulation starting from the nearest heading.
    let start = node;
    let startLevel = 7;
    if (/^h[1-6]$/i.test(start.prop('tagName') || '')) {
        startLevel = Number((start.prop('tagName') as string).substring(1));
    } else {
        const h = start.closest('h1, h2, h3, h4, h5, h6');
        if (h && h.length) { start = h as any; startLevel = Number((h.prop('tagName') as string).substring(1)); }
    }
    const frag: string[] = [];
    let cur: any = start;
    frag.push($.html(cur) || '');
    cur = cur.next();
    const MAX_NODES = 400; // guardrail
    let count = 0;
    while (cur && cur.length && count < MAX_NODES) {
        const tag = (cur.prop('tagName') || '').toString().toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
            const lvl = Number(tag.substring(1));
            if (lvl <= startLevel) break;
        }
        frag.push($.html(cur) || '');
        cur = cur.next();
        count++;
    }

    const container = load(`<div>${frag.join('')}</div>`);
    sanitizeAndRewrite(container, pageUrl);
    return container('div').html() || '';
}

function sanitizeAndRewrite(container: CheerioAPI, pageUrl: string) {
    const $$ = container;
    // Rewrite links to absolute and drop dangerous attributes
    $$('a').each((_, el) => {
        const href = $$(el).attr('href') || '';
        if (!href) return;
        try {
            const abs = new URL(href, pageUrl).toString();
            $$(el).attr('href', abs);
        } catch { /* keep as-is */ }
        // Clean attributes
        $$(el).removeAttr('onclick').removeAttr('onmouseover').removeAttr('target');
    });
    // Strip scripts, styles, and unsafe attributes
    $$('script, style').remove();
    $$('*').each((_, el) => {
        const allowedAttrs = new Set(['href', 'id', 'class']);
        const attribs: any = (el as any).attribs || {};
        for (const key of Object.keys(attribs)) {
            if (!allowedAttrs.has(key)) $$(el).removeAttr(key);
        }
    });
    // Keep only safe tags
    const allowedTags = new Set(['div', 'section', 'p', 'a', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'pre', 'code', 'em', 'strong', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    $$('*').each((_, el) => {
        const tag = (el as any).tagName?.toLowerCase() || '';
        if (!allowedTags.has(tag)) {
            // unwrap: replace the element with its children
            $$(el).replaceWith($$(el).contents());
        }
    });
}
