import { getConfig } from '../config';
import { fetchText } from '../utils/http';
import { extractSectionHtmlDom } from './domExtractor';
import { htmlToMarkdown } from './htmlToMarkdown';

// In-memory session cache to avoid repeated conversions during a single VS Code session.
// Keeps recent entries for a short TTL (milliseconds).
const sessionCache = new Map<string, { ts: number; md: string }>();
const SESSION_TTL = 1000 * 60 * 5; // 5 minutes

function summarizeMarkdown(md: string, opts: { summaryOnly: boolean; includeDocExamples: boolean; includeLists: boolean; includeGrammar: boolean; maxLen?: number }): string {
    const maxLen = Math.max(300, Math.min(opts.maxLen || 1200, 2200));
    let lines = md.split(/\r?\n/);
    const out: string[] = [];
    let i = 0;
    // Keep the first heading if present
    if (lines.length && /^\s*#{1,6}\s+/.test(lines[0])) {
        out.push(lines[0].trim());
        i = 1;
        // skip any empty lines following
        while (i < lines.length && lines[i].trim() === '') i++;
    }
    let addedParas = 0;
    let addedCode = 0;
    let addedListItems = 0;
    const pushBlank = () => { if (out.length && out[out.length - 1] !== '') out.push(''); };
    const pushPara = (para: string) => { if (para.trim()) { out.push(para.trim()); out.push(''); } };

    // Pre-clean: drop orphan subheading-like single phrases and fix truncated trailing refs
    try {
        // Remove noisy single-phrase lines that add little value
        const noisyPhrases = [/^except clause$/i, /^the raise statement\.?$/i];
        md = md.split(/\r?\n/).filter(line => {
            const t = line.trim();
            if (!t) return true;
            if (t.startsWith('### ')) return true;
            // Keep lines that look like content or bullets
            if (/^[-*]\s+/.test(t) || /^```/.test(t)) return true;
            // Drop known noisy single-phrase lines
            if (noisyPhrases.some(re => re.test(t))) return false;
            // Drop very short 1–2 word orphan lines
            if (/^[A-Za-z][A-Za-z\s-]{0,24}$/.test(t) && t.split(/\s+/).length <= 3) return false;
            return true;
        }).join('\n');
        // Repair incomplete trailing sentence that ends with 'may be found in section'
        md = md.replace(/(additional information[^\n]*?exceptions[^\n]*?\))(?:,?\s*and[^\n]*?\(.*?raise.*?\))?[^\n]*?may be found in section\.?/ig,
            (m) => {
                // If both links are present, keep the sentence up to them and end with a period
                const hasRaise = /\(https?:\/\/[^)]*#raise\)/i.test(m);
                const hasExc = /\/executionmodel\.html#exceptions\)/i.test(m);
                if (hasRaise && hasExc) {
                    const trimmed = m.replace(/\s*,?\s*may be found in section\.?/i, '').trim();
                    return trimmed.endsWith('.') ? trimmed : trimmed + '.';
                }
                // Otherwise, just remove the dangling clause
                return m.replace(/\s*may be found in section\.?/i, '.');
            });
    } catch { /* best-effort */ }
    // Ensure we iterate over the cleaned content
    lines = md.split(/\r?\n/);

    // Consume tokens until limits reached
    while (i < lines.length && out.join('\n').length < maxLen) {
        // Code fence block
        if (!opts.summaryOnly && opts.includeDocExamples && /^```/.test(lines[i])) {
            const start = i;
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) i++;
            if (i < lines.length) i++; // include closing fence
            if (addedCode < 1) {
                const block = lines.slice(start, i).join('\n').trim();
                const { showTinyExample } = getConfig();
                const lineCount = block.split('\n').length;
                const withinTiny = showTinyExample ? (lineCount >= 2 && lineCount <= 9) : (lineCount > 2);
                if (withinTiny) {
                    pushBlank();
                    out.push(block);
                    out.push('');
                    addedCode++;
                }
            }
            continue;
        }
        // List items
        if (!opts.summaryOnly && opts.includeLists && /^\s*[-*]\s+/.test(lines[i])) {
            let start = i;
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && addedListItems < 8) {
                out.push(lines[i].trim());
                addedListItems++;
                i++;
            }
            out.push('');
            continue;
        }
        // Paragraphs
        if (lines[i].trim().length) {
            const start = i;
            const buf: string[] = [];
            while (i < lines.length && lines[i].trim().length) { buf.push(lines[i]); i++; }
            if (addedParas < (opts.summaryOnly ? 3 : 3)) {
                pushPara(buf.join(' ').replace(/\s+/g, ' '));
                addedParas++;
            }
            continue;
        }
        // Blank line
        i++;
    }
    // Trim trailing blanks
    while (out.length && out[out.length - 1] === '') out.pop();
    const result = out.join('\n');
    return result && result.length > 40 ? result : md;
}

export async function getSectionMarkdown(baseUrl: string, page: string, anchor: string): Promise<string> {
    const full = `${baseUrl.replace(/\/$/, '')}/${page}`;
    const { summaryOnly, includeDocExamples, includeGrammar, includeLists, useDomParser, showKeyPoints } = getConfig();

    const cacheKey = `sec:v8:${baseUrl}:${page}#${anchor}`;
    const now = Date.now();
    const cached = sessionCache.get(cacheKey);
    if (cached && (now - cached.ts) < SESSION_TTL) return cached.md;

    const html = await fetchText(full);

    // DOM-based path: extract sanitized HTML and convert minimally to markdown lines.
    if (useDomParser) {
        const sectionHtml = extractSectionHtmlDom(html, full, anchor);
        // Convert with minimal processing: preserve anchors via markdown links by mapping <a>.
        // Use a trivial conversion: keep anchors and basic tags for MarkdownString with supportHtml.
        // We still return markdown since hover.ts appends markdown.
        const mdFull = htmlToMarkdown(sectionHtml, full);
        const md = summarizeMarkdown(mdFull, { summaryOnly, includeDocExamples, includeLists, includeGrammar, maxLen: 1200 });
        if (md && md.length > 0) {
            sessionCache.set(cacheKey, { ts: now, md });
            return md;
        }
        // Fall through to legacy if DOM path yields empty
    }

    // Find anchor position robustly but without scanning the whole document repeatedly.
    // Robust anchor detection: find an actual tag that contains the id attribute.
    let anchorPos = -1;
    try {
        // Prefer heading tags with the id
        const headingRe = new RegExp(`<h([1-6])\\b[^>]*\\bid=["']${anchor}["'][^>]*>`, 'i');
        const headingMatch = html.match(headingRe);
        if (headingMatch && typeof headingMatch.index === 'number') {
            anchorPos = headingMatch.index;
        } else {
            // Fallback: find any tag with id="anchor" or name="anchor"
            const tagRe = new RegExp(`<([a-z0-9]+)\\b[^>]*\\b(?:id|name)=["']${anchor}["'][^>]*>`, 'i');
            const tagMatch = html.match(tagRe);
            if (tagMatch && typeof tagMatch.index === 'number') anchorPos = tagMatch.index;
            else {
                // final fallback: search for the anchor fragment near hashes
                const frag = html.indexOf(`#${anchor}">`);
                if (frag !== -1) anchorPos = frag;
            }
        }
    } catch {
        anchorPos = -1;
    }
    if (anchorPos === -1) throw new Error(`Anchor ${anchor} not found in ${full}`);

    // Heuristic: include a little pre-anchor context to capture lead-in sentences that are often
    // placed just before the anchor id (e.g. a short intro sentence or cross-reference).
    const PRE_CONTEXT = 1800;
    const preStart = Math.max(0, anchorPos - PRE_CONTEXT);

    // Look for the heading that follows the anchor (if any) and compute section bounds.
    const afterAnchor = html.slice(anchorPos);
    const headingMatch = afterAnchor.match(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/i);

    let headingText = '';
    let headingEndPos = anchorPos;

    if (headingMatch && typeof headingMatch.index === 'number') {
        headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();
        headingText = headingText.replace(/\u00B6|\u00b6/g, '').replace(/^\d+(?:\.\d+)*\.\s*/, '').trim();
        headingEndPos = anchorPos + headingMatch.index + headingMatch[0].length;
    }

    // Find next same-or-higher level heading to bound the section
    const afterHeading = html.slice(headingEndPos);
    const nextHeadingMatch = afterHeading.match(/<h[1-6]\b/i);
    const nextHeadingPos = nextHeadingMatch ? headingEndPos + nextHeadingMatch.index! : html.length;

    // Limit how much HTML we process (keep it small for performance)
    const maxSectionLength = 8000;
    let sectionStart = Math.max(preStart, headingEndPos - 100);
    // Adjust start to the nearest sensible tag boundary to avoid slicing in the middle of a tag/text
    try {
        const lookback = 400;
        const probeStart = Math.max(0, sectionStart - lookback);
        const probe = html.slice(probeStart, sectionStart + 50);
        const tagMatch = probe.match(/<(p|h[1-6]|div|section)\b[^>]*>/gi);
        if (tagMatch) {
            // find index of last occurrence of one of these tags in probe and map to absolute
            const lastTag = tagMatch[tagMatch.length - 1];
            const lastIndex = probe.lastIndexOf(lastTag);
            if (lastIndex >= 0) sectionStart = probeStart + lastIndex;
        }
    } catch { }

    // Safety: make sure we are not starting inside an open tag or attribute value
    // (which previously caused href attributes to be sliced and lose the rest of the URL).
    try {
        const lastClose = html.lastIndexOf('>', Math.max(0, sectionStart - 1));
        if (lastClose !== -1) {
            const safeStart = Math.min(html.length, lastClose + 1);
            // Don't move earlier than preStart
            sectionStart = Math.max(preStart, safeStart);
        }
    } catch { }

    // Compute a conservative section end, then expand to the next tag boundary so we
    // don't cut HTML attributes (like href="...#anchor") in half which breaks link extraction.
    const tentativeEnd = Math.min(nextHeadingPos, headingEndPos + maxSectionLength);
    let sectionEnd = tentativeEnd;
    try {
        // Find the next '>' after tentativeEnd so the last tag is closed. Only allow a small expansion
        // (e.g., 4096 chars) to avoid reading too far.
        const nextClose = html.indexOf('>', tentativeEnd);
        if (nextClose !== -1 && nextClose - tentativeEnd < 4096) sectionEnd = nextClose + 1;
    } catch { }

    // Extra safety: if our sectionEnd falls inside an href attribute value, extend it to include
    // the full quoted href value. This prevents producing truncated hrefs like "https://docs.".
    try {
        const safeLimit = Math.min(html.length, tentativeEnd + 8192);
        // look backwards from tentativeEnd to find the last href attribute start
        const lastHrefDouble = html.lastIndexOf('href="', tentativeEnd);
        const lastHrefSingle = html.lastIndexOf("href='", tentativeEnd);
        const lastHref = Math.max(lastHrefDouble, lastHrefSingle);
        if (lastHref > -1 && lastHref >= sectionStart) {
            // determine the quote char used and find its closing quote after tentativeEnd
            const quoteChar = html[lastHref + 5]; // should be ' or "
            const closing = html.indexOf(quoteChar, tentativeEnd + 1);
            if (closing !== -1 && closing < safeLimit) {
                sectionEnd = Math.max(sectionEnd, closing + 1);
            }
        }
    } catch { }

    // Additional href protection: scan the slice boundary for any incomplete href values
    // and extend to complete them. This catches cases where multiple href attributes
    // might be cut across the boundary.
    try {
        const boundaryCheck = html.slice(Math.max(0, tentativeEnd - 200), Math.min(html.length, tentativeEnd + 200));
        const hrefPattern = /href\s*=\s*["'][^"']*$/gi;
        let match;
        while ((match = hrefPattern.exec(boundaryCheck)) !== null) {
            const matchPos = Math.max(0, tentativeEnd - 200) + match.index;
            if (matchPos >= sectionStart && matchPos <= tentativeEnd + 50) {
                // Found an incomplete href at the boundary, find its completion
                const quoteChar = match[0].includes('"') ? '"' : "'";
                const afterMatch = html.slice(matchPos + match[0].length);
                const closeIdx = afterMatch.indexOf(quoteChar);
                if (closeIdx !== -1 && closeIdx < 1000) {
                    sectionEnd = Math.max(sectionEnd, matchPos + match[0].length + closeIdx + 1);
                }
            }
        }
    } catch { }

    const sectionHtml = html.slice(sectionStart, sectionEnd);

    // For 'function-definitions', prefer extracting the full nearest container (section/div)
    // wrapping the heading, to avoid losing key context and anchors.
    let containerHtml = sectionHtml;
    try {
        if (/function-definitions/i.test(anchor)) {
            // Find the nearest opening <section> or <div> before headingEndPos and its matching close
            const before = html.slice(0, headingEndPos);
            const lastSectionOpen = Math.max(before.lastIndexOf('<section'), before.lastIndexOf('<div'));
            if (lastSectionOpen !== -1) {
                const afterFromOpen = html.slice(lastSectionOpen);
                const closeIdx = afterFromOpen.search(/<\/(section|div)>/i);
                if (closeIdx !== -1) {
                    const endAbs = lastSectionOpen + closeIdx + 9; // length of </section> or </div>
                    const boundedEnd = Math.min(endAbs, lastSectionOpen + 16000, html.length);
                    containerHtml = html.slice(lastSectionOpen, boundedEnd);
                }
            }
        } else if (/^object\.__.*__$/i.test(anchor)) {
            // For specific dunder anchors, narrow to the definition block (<dt>/<dd>) for that method
            const dtIdx = html.lastIndexOf(`<dt`, headingEndPos);
            if (dtIdx !== -1) {
                const tail = html.slice(dtIdx);
                const endIdx = tail.search(/<\/dd>/i);
                if (endIdx > -1) {
                    containerHtml = html.slice(dtIdx, dtIdx + endIdx + 5);
                }
            }
        }
    } catch { }

    // Also try to capture module/page summary (first paragraph of the page) if it's helpful
    let moduleIntroHtml = '';
    try {
        const firstPmatch = html.match(/<p\b[^>]*>(.*?)<\/p>/i);
        if (firstPmatch && firstPmatch[0]) moduleIntroHtml = firstPmatch[0];
    } catch { /* best-effort */ }

    // If this is a known noisy anchor (grammar-heavy), prefer the module intro paragraph instead.
    // This addresses pages where the anchor points into grammar productions that produce noisy fragments.
    try {
        if (/function-definitions|function-definitions/i.test(anchor) && moduleIntroHtml) {
            const intro = htmlToMarkdown(moduleIntroHtml, full).trim();
            if (intro && intro.length > 40) {
                const titleLine = headingText ? `### ${headingText}\n\n` : '';
                const out = (titleLine + intro).trim();
                sessionCache.set(cacheKey, { ts: now, md: out });
                return out;
            }
        }
    } catch { }

    // Prefer content within the same containerHtml (bounded) to avoid bleeding into neighboring sections
    const paragraphs = [...containerHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gis)];
    const codeBlocks = includeDocExamples ? [...containerHtml.matchAll(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gis)] : [];
    const sphinxHighlights = includeDocExamples ? [...containerHtml.matchAll(/<div[^>]*class="[^"]*highlight[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gis)] : [];
    const defLists = includeGrammar ? [...containerHtml.matchAll(/<dl\b[^>]*>([\s\S]*?)<\/dl>/gis)] : [];
    const lists = includeLists ? [...containerHtml.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gis)] : [];

    let contentText = '';

    // If this anchor looks like the function definitions area, avoid pulling grammar-heavy definition lists
    // which tend to introduce EBNF and broken cross-refs. We'll rely on the lead paragraphs instead.
    const isNoisyGrammarAnchor = /function-definitions/i.test(anchor);
    try {
        if (!isNoisyGrammarAnchor && /function|funcdef|function-definitions|function-def/i.test(anchor) && defLists.length > 0) {
            const defMd = htmlToMarkdown(defLists[0][0], full).trim();
            if (defMd && defMd.length > 40) {
                const titleLine = headingText ? `### ${headingText}\n\n` : '';
                const result = (titleLine + defMd).trim();
                sessionCache.set(cacheKey, { ts: now, md: result });
                return result;
            }
        }
    } catch { /* best-effort */ }

    // Prefer the first few lead paragraphs of the section; if empty, fall back to module intro
    const maxParagraphs = 4;
    for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
        const paragraph = htmlToMarkdown(paragraphs[i][0], full).trim();
        if (paragraph && paragraph.length > 5 && !paragraph.includes('\u00b6')) contentText += paragraph + '\n\n';
    }

    if (!contentText && moduleIntroHtml) {
        const intro = htmlToMarkdown(moduleIntroHtml, full).trim();
        if (intro && intro.length > 20) contentText += intro + '\n\n';
    }

    let grammarContent = '';

    // Short definition lists are compact and informative; skip for noisy anchors
    if (!summaryOnly && !isNoisyGrammarAnchor) {
        for (let i = 0; i < Math.min(defLists.length, 2) && contentText.length < 1000; i++) {
            const defList = htmlToMarkdown(defLists[i][0], full).trim();
            if (defList && defList.length > 20) grammarContent += defList + '\n\n';
        }
    }

    // Append grammar content at the end
    if (grammarContent) {
        contentText += '\n\n' + grammarContent;
    }

    if (!summaryOnly && includeDocExamples) {
        // Prefer Sphinx highlight examples first, then generic code blocks
        const addCode = (raw: string) => {
            const codeExample = htmlToMarkdown(raw, full).trim();
            if (codeExample && codeExample.includes('```') && !contentText.includes(codeExample)) contentText += codeExample + '\n\n';
        };
        let added = 0;
        for (let i = 0; i < sphinxHighlights.length && added < 2 && contentText.length < 1200; i++) {
            addCode(sphinxHighlights[i][0]);
            added++;
        }
        for (let i = 0; i < codeBlocks.length && added < 2 && contentText.length < 1200; i++) {
            addCode(codeBlocks[i][0]);
            added++;
        }
    }

    // If we still have room, include a compact bullet list if present (often summaries)
    if (!summaryOnly && !isNoisyGrammarAnchor && contentText.length < 1200 && lists.length > 0) {
        const listMd = htmlToMarkdown(lists[0][0], full).trim();
        // Keep only the first ~10 bullets to avoid verbosity
        const limited = listMd.split('\n').slice(0, 12).join('\n');
        if (limited && limited.length > 50) contentText += limited + '\n\n';
    }

    // Relevance pass: run on the converted markdown (not raw HTML) to avoid grabbing partial HTML fragments.
    if (!isNoisyGrammarAnchor && contentText.length < 1400) {
        try {
            const sectionText = htmlToMarkdown(sectionHtml, full);
            const relevanceKeywords = ['class', 'inherit', 'inheritance', 'metaclass', 'metaclasses', 'suite', 'attribute', '__dict__', 'created', 'namespace', 'binding', 'def', 'function', 'parameter'];
            const sentencesFound: string[] = [];
            for (const kw of relevanceKeywords) {
                const re = new RegExp(`[^.?!\\n]*\\b${kw}\\b[^.?!\\n]*[.?!]`, 'gi');
                let m: RegExpExecArray | null;
                while ((m = re.exec(sectionText))) {
                    // Sanitize: remove markdown link URLs (keep labels) and drop obvious grammar tokens
                    let sentence = m[0].trim();
                    sentence = sentence.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1');
                    if (/::=|\bNEWLINE\b/.test(sentence)) continue;
                    if (sentence.length > 30 && !contentText.includes(sentence) && !sentencesFound.includes(sentence)) {
                        sentencesFound.push(sentence);
                        if (contentText.length + sentencesFound.join(' ').length > 1200) break;
                    }
                }
                if (contentText.length + sentencesFound.join(' ').length > 1200) break;
            }
            if (sentencesFound.length) contentText += '\n\n' + sentencesFound.join(' ');
        } catch { /* best-effort; ignore */ }
    }

    // If nothing meaningful was found within the section slice, try a slightly larger window
    if (contentText.length < 150) {
        // Convert the full sectionHtml (already bounded) rather than an arbitrary partial slice.
        // This prevents cutting hrefs or attributes which would make links non-clickable.
        const rawContent = htmlToMarkdown(sectionHtml, full).trim();
        if (rawContent.length > contentText.length) contentText = rawContent;
    }

    if (contentText.length < 50) throw new Error(`Insufficient content extracted for anchor ${anchor}`);
    // Trim to a generous cap; outer composer can truncate further
    if (contentText.length > 2000) contentText = contentText.slice(0, 2000).trim() + '...';

    const titleLine = headingText ? `### ${headingText}\n\n` : '';
    // Heuristic key points: turn 1-3 concise sentences from the first paragraph into bullets (configurable)
    let result = (titleLine + contentText).trim();
    if (showKeyPoints) {
        try {
            const firstPara = contentText.split(/\n\n+/)[0] || '';
            const sentences = firstPara.split(/(?<=[.!?])\s+/).filter(s => s.length >= 30 && s.length <= 160).slice(0, 3);
            if (sentences.length) {
                const bullets = sentences.map(s => `- ${s.replace(/\s+/g, ' ').trim()}`).join('\n');
                const rest = contentText.slice(firstPara.length).trim();
                result = [titleLine.trim(), bullets, rest].filter(Boolean).join('\n\n');
            }
        } catch { /* best-effort */ }
    }

    // store in session cache for quick repeated access
    sessionCache.set(cacheKey, { ts: now, md: result });
    return result;
}

// Allow callers (e.g., debug command) to invalidate the session cache to force fresh parsing
export function invalidateSectionSessionCache(baseUrl?: string, page?: string, anchor?: string) {
    try {
        if (baseUrl && page && anchor) {
            const key = `sec:${baseUrl}:${page}#${anchor}`;
            sessionCache.delete(key);
            return;
        }
        if (baseUrl && page) {
            const prefix = `sec:${baseUrl}:${page}#`;
            for (const k of sessionCache.keys()) if (k.startsWith(prefix)) sessionCache.delete(k);
            return;
        }
        // Clear all as a fallback
        sessionCache.clear();
    } catch { /* no-op */ }
}
