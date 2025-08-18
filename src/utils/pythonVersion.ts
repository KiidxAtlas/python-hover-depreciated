
// Simplified version that doesn't interact with Python extension settings
// to avoid potential conflicts with Pylance/Python extension
export async function detectInterpreterVersion(): Promise<string | undefined> {
    try {
        // Just return undefined for now - let the extension use the default version setting
        // This avoids any potential conflicts with Pylance/Python extension
        return undefined;
    } catch { }
    return undefined;
}
