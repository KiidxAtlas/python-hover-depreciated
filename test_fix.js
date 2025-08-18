// Test the specific fix for versioned hrefs
const testCases = [
    "13/reference/expressions",
    "3.12/library/functions.html#print",
    "library/stdtypes.html#str.find",
    "../reference/datamodel.html"
];

function testVersionedPath(href, baseUrl = "https://docs.python.org/3/") {
    console.log(`\nTesting href: "${href}"`);

    // Extract version from baseUrl
    const versionMatch = baseUrl.match(/docs\.python\.org\/(\d+(?:\.\d+)?)/i);
    const ver = versionMatch ? versionMatch[1] : '3';
    console.log(`Base version: ${ver}`);

    // Check if this is a versioned path
    if (/^\d+(?:\.\d+)?\//.test(href)) {
        console.log("  -> This is a versioned path");
        // Replace the version number in the href instead of prepending
        const pathWithoutVersion = href.replace(/^\d+(?:\.\d+)?\//, '');
        const result = `https://docs.python.org/${ver}/${pathWithoutVersion}`;
        console.log(`  -> Result: ${result}`);
        return result;
    } else {
        console.log("  -> Not a versioned path");
        return href;
    }
}

testCases.forEach(href => testVersionedPath(href));
