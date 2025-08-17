import { getConfig } from '../config';
import { fetchText } from '../utils/http';
import { htmlToMarkdown } from './htmlToMarkdown';

export async function getSectionMarkdown(baseUrl: string, page: string, anchor: string): Promise<string> {
    const full = `${baseUrl.replace(/\/$/, '')}/${page}`;
    const { summaryOnly, includeDocExamples, includeGrammar, includeLists } = getConfig();
    const html = await fetchText(full);

    let anchorPos = html.indexOf(`id="${anchor}"`);
    if (anchorPos === -1) anchorPos = html.indexOf(`id='${anchor}'`);
    if (anchorPos === -1) anchorPos = html.indexOf(`name="${anchor}"`);
    if (anchorPos === -1) throw new Error(`Anchor ${anchor} not found in ${full}`);

    const afterAnchor = html.slice(anchorPos);
    const headingMatch = afterAnchor.match(/<h([2-6])\b[^>]*>(.*?)<\/h\1>/i);

    let headingText = '';
    let headingEndPos = anchorPos;

    if (headingMatch && typeof headingMatch.index === 'number') {
        headingText = headingMatch[2].replace(/<[^>]+>/g, '').trim();
        // Clean heading like "8.8. Class definitions" and remove pilcrow if any
        headingText = headingText.replace(/\u00B6|¶/g, '').replace(/^\d+(?:\.\d+)*\.\s*/, '').trim();
        headingEndPos = anchorPos + headingMatch.index + headingMatch[0].length;
    }

    const afterHeading = html.slice(headingEndPos);
    const nextHeadingMatch = afterHeading.match(/<h[2-6]\b/i);
    const nextHeadingPos = nextHeadingMatch ? headingEndPos + nextHeadingMatch.index! : html.length;

    const maxSectionLength = 8000;
    const sectionHtml = html.slice(headingEndPos, Math.min(nextHeadingPos, headingEndPos + maxSectionLength));

    const paragraphs = [...sectionHtml.matchAll(/<p\b[^>]*>(.*?)<\/p>/gis)];
    const codeBlocks = includeDocExamples ? [...sectionHtml.matchAll(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis)] : [];
    const sphinxHighlights = includeDocExamples ? [...sectionHtml.matchAll(/<div[^>]*class="[^"]*highlight[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gis)] : [];
    const defLists = includeGrammar ? [...sectionHtml.matchAll(/<dl\b[^>]*>(.*?)<\/dl>/gis)] : [];
    const lists = includeLists ? [...sectionHtml.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gis)] : [];

    let contentText = '';

    // Prefer the first few lead paragraphs which usually summarize the concept
    const maxParagraphs = 6;
    for (let i = 0; i < Math.min(paragraphs.length, maxParagraphs); i++) {
        const paragraph = htmlToMarkdown(paragraphs[i][0], full).trim();
        if (paragraph && paragraph.length > 5 && !paragraph.includes('¶')) contentText += paragraph + '\n\n';
    }

    // Short definition lists are compact and informative
    if (!summaryOnly) {
        for (let i = 0; i < Math.min(defLists.length, 2) && contentText.length < 1000; i++) {
            const defList = htmlToMarkdown(defLists[i][0], full).trim();
            if (defList && defList.length > 20) contentText += defList + '\n\n';
        }
    }

    if (!summaryOnly && includeDocExamples) {
        // Prefer Sphinx highlight examples first, then generic code blocks
        const addCode = (raw: string) => {
            const codeExample = htmlToMarkdown(raw, full).trim();
            if (codeExample && codeExample.includes('```')) contentText += codeExample + '\n\n';
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
    if (!summaryOnly && contentText.length < 1200 && lists.length > 0) {
        const listMd = htmlToMarkdown(lists[0][0], full).trim();
        // Keep only the first ~10 bullets to avoid verbosity
        const limited = listMd.split('\n').slice(0, 12).join('\n');
        if (limited && limited.length > 50) contentText += limited + '\n\n';
    }

    if (contentText.length < 150) {
        const rawContent = htmlToMarkdown(sectionHtml.slice(0, 4000), full).trim();
        if (rawContent.length > contentText.length) contentText = rawContent;
    }

    if (contentText.length < 50) throw new Error(`Insufficient content extracted for anchor ${anchor}`);
    // Trim to a generous cap; outer composer can truncate further
    if (contentText.length > 2000) contentText = contentText.slice(0, 2000).trim() + '...';

    const titleLine = headingText ? `### ${headingText}\n\n` : '';
    return (titleLine + contentText).trim();
}
