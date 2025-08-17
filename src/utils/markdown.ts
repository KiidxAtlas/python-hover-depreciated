// Markdown utility helpers
export function smartTruncateMarkdown(text: string, limit: number): string {
    if (limit <= 0 || text.length <= limit) return text;
    let cut = limit;
    let candidate = text.slice(0, cut);
    const window = 200;
    const searchStart = Math.max(0, cut - window);
    const tail = candidate.slice(searchStart);
    const paraIdx = tail.lastIndexOf('\n\n');
    if (paraIdx !== -1) cut = searchStart + paraIdx; else {
        const sentenceIdx = tail.lastIndexOf('. ');
        if (sentenceIdx !== -1) cut = searchStart + sentenceIdx + 1; else {
            const nlIdx = tail.lastIndexOf('\n');
            if (nlIdx !== -1) cut = searchStart + nlIdx;
        }
    }
    let out = text.slice(0, cut).trim();
    let closedFence = false;
    const fenceCount = (out.match(/```/g) || []).length;
    if (fenceCount % 2 !== 0) {
        if (!out.endsWith('\n')) out += '\n';
        out += '```\n';
        closedFence = true;
    }
    const inlineTicks = (out.match(/`/g) || []).length;
    if (inlineTicks % 2 !== 0) out += '`';
    const ellipsis = closedFence ? '\n\n...' : '...';
    return out + ellipsis;
}

export function ensureClosedFences(text: string): string {
    let out = text;
    const fenceCount = (out.match(/```/g) || []).length;
    if (fenceCount % 2 !== 0) {
        if (!out.endsWith('\n')) out += '\n';
        out += '```\n';
    }
    try {
        const withoutFences = out.replace(/```[\s\S]*?```/g, '');
        const inlineTicks = (withoutFences.match(/`/g) || []).length;
        if (inlineTicks % 2 !== 0) out += '`';
    } catch { }
    return out;
}
