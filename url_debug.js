// Test what the correct URL should be
const testUrls = [
    "13/reference/expressions", // This should become "3/reference/expressions"
    "../library/stdtypes.html#str.find", // This should become "3/library/stdtypes.html#str.find"
    "library/functions.html#list" // This should become "3/library/functions.html#list"
];

function repairUrls(content, pythonVersion = "3") {
    console.log(`Repairing URLs for Python version: ${pythonVersion}`);

    // Handle paths that start with a version number (like "13/reference/expressions")
    // These need to have the version number replaced, not prepended
    content = content.replace(
        /href="(\d+)\/([^"]+)"/g,
        (match, oldVersion, path) => {
            console.log(`  Found versioned path: ${oldVersion}/${path} -> replacing with ${pythonVersion}/${path}`);
            return `href="https://docs.python.org/${pythonVersion}/${path}"`;
        }
    );

    // Handle relative paths like "../library/stdtypes.html"
    content = content.replace(
        /href="\.\.\/([^"]+)"/g,
        (match, path) => {
            console.log(`  Found relative path: ../${path} -> ${pythonVersion}/${path}`);
            return `href="https://docs.python.org/${pythonVersion}/${path}"`;
        }
    );

    // Handle bare paths (no ../ prefix, no version prefix)
    content = content.replace(
        /href="((?!https?:\/\/)(?!\d+\/)(?!\.\.\/)[^"]+)"/g,
        (match, path) => {
            console.log(`  Found bare path: ${path} -> ${pythonVersion}/${path}`);
            return `href="https://docs.python.org/${pythonVersion}/${path}"`;
        }
    );

    return content;
}

testUrls.forEach(url => {
    const html = `<a href="${url}">test</a>`;
    console.log(`\nTesting: ${url}`);
    const repaired = repairUrls(html);
    console.log(`Result: ${repaired}`);
});
