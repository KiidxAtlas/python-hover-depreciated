// Simple test to verify URL repair patterns
const testHtml = `
<a href="../library/stdtypes.html#str.find">str.find()</a>
<a href="13/reference/expressions">operators</a>
<a href="../library/functions.html#list">list</a>
`;

console.log("Original HTML:");
console.log(testHtml);

// Test the URL repair patterns from htmlToMarkdown.ts
function repairUrls(content, pythonVersion = "3") {
    // Handle bare paths like "13/reference/expressions"
    content = content.replace(
        /href="(\d+\/[^"]+)"/g,
        `href="https://docs.python.org/${pythonVersion}/$1"`
    );

    // Handle relative paths like "../library/stdtypes.html"
    content = content.replace(
        /href="\.\.\/([^"]+)"/g,
        `href="https://docs.python.org/${pythonVersion}/$1"`
    );

    return content;
}

const repairedHtml = repairUrls(testHtml);
console.log("\nAfter URL repair:");
console.log(repairedHtml);

// Now test markdown conversion basics
function htmlToMarkdown(html) {
    // Convert links to markdown
    return html.replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');
}

const markdown = htmlToMarkdown(repairedHtml);
console.log("\nFinal markdown:");
console.log(markdown);
