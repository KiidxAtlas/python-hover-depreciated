// Quick debug test for the URL issue
const { getSectionMarkdown } = require('./out/docs/sections');

async function testIfStatement() {
    try {
        const baseUrl = 'https://docs.python.org/3';
        const url = 'reference/compound_stmts.html';
        const anchor = 'the-if-statement';

        console.log('Testing getSectionMarkdown with:');
        console.log('baseUrl:', baseUrl);
        console.log('url:', url);
        console.log('anchor:', anchor);

        const result = await getSectionMarkdown(baseUrl, url, anchor);
        console.log('Result:');
        console.log(result);

        // Check for the specific broken pattern
        if (result.includes('13/reference/expressions')) {
            console.log('\n❌ FOUND BROKEN URL PATTERN: 13/reference/expressions');
        } else {
            console.log('\n✅ No broken URL pattern found');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testIfStatement();
