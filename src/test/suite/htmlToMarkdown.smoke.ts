import { strict as assert } from 'assert';
import { htmlToMarkdown } from '../../docs/htmlToMarkdown';

const base = 'https://docs.python.org/3/reference/expressions.html';

function run() {
    // Verify phrase linking for "The standard type hierarchy"
    const html = '<p>See section The standard type hierarchy for the list of built-in types.</p>';
    const md = htmlToMarkdown(html, base);
    assert(md.includes(']('));
    assert(/\[(The\s+standard\s+type\s+hierarchy)\]\(https:\/\/docs\.python\.org\/3\/reference\/datamodel\.html#types\)/.test(md), md);

    // Verify broken docs host repair
    const html2 = '<p>Refer to <a href="https://docs.python.org/3/reference/datamodel.html#types">types</a>.</p>';
    const md2 = htmlToMarkdown(html2, base);
    assert(md2.includes('https://docs.python.org/3/reference/datamodel.html#types'));

    // Verify that PEP references are auto-linked
    const md3 = htmlToMarkdown('<p>Style guide: PEP 8.</p>', base);
    assert(md3.includes('https://peps.python.org/pep-0008/'));

    console.log('htmlToMarkdown smoke tests passed');
}

run();
