// Test URL constructor behavior
console.log("Testing URL constructor behavior:");

const baseUrl = "https://docs.python.org/3/";
const testHrefs = [
    "13/reference/expressions",
    "../library/stdtypes.html#str.find"
];

testHrefs.forEach(href => {
    console.log(`\nTesting href: "${href}"`);
    try {
        const resolved = new URL(href, baseUrl).toString();
        console.log(`  ✅ URL constructor succeeded: ${resolved}`);
    } catch (e) {
        console.log(`  ❌ URL constructor failed: ${e.message}`);
        console.log(`  -> This would trigger the fallback logic`);
    }
});
