// Test the compiled htmlToMarkdown function
const { htmlToMarkdown } = require('./out/docs/htmlToMarkdown');

const testHtml = `
<a href="13/reference/expressions">operators</a>
<a href="../library/stdtypes.html#str.find">str.find()</a>
`;

const baseUrl = "https://docs.python.org/3/";

console.log("Testing compiled htmlToMarkdown function:");
console.log("Input HTML:", testHtml.trim());

const result = htmlToMarkdown(testHtml, baseUrl);
console.log("\nOutput markdown:");
console.log(result);

// Check if the 13/ was properly replaced with 3/
if (result.includes('docs.python.org/3/reference/expressions')) {
    console.log("\n✅ SUCCESS: URL fix is working correctly!");
} else {
    console.log("\n❌ FAILED: URL fix is not working");
    console.log("Expected: docs.python.org/3/reference/expressions");
    console.log("Actual result contains:", result);
}
