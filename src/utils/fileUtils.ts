import { Vault } from "obsidian";
// Node.js built-in module is external in esbuild config and available at runtime
// eslint-disable-next-line
import * as path from "path";

/**
 * Ensures a folder exists in the vault, creating it if necessary
 */
export async function ensureFolderExists(folderPath: string, vault: Vault): Promise<void> {
    const normalizedPath = folderPath.replace(/\/$/, ''); // Remove trailing slash

    // Check if folder already exists
    const folderExists = await vault.adapter.exists(normalizedPath);
    if (folderExists) {
        return;
    }

    // Create folder and any parent folders
    await vault.adapter.mkdir(normalizedPath);
}

/**
 * Gets the relative path from the vault root for use in markdown links
 */
export function getRelativePath(fullPath: string, vaultRoot: string): string {
    // If the path is already relative, return as-is
    if (!fullPath.startsWith(vaultRoot)) {
        return fullPath;
    }

    // Remove vault path prefix and normalize
    const relativePath = fullPath.replace(vaultRoot, '').replace(/^\//, '').replace(/\\/g, '/');
    return relativePath;
}

/**
 * Gets the full path for a file relative to the vault root
 */
export function getFullPath(relativePath: string, vaultRoot: string): string {
    const normalizedRelative = relativePath.replace(/^\//, '').replace(/\\/g, '/');
    return path.join(vaultRoot, normalizedRelative);
}

/**
 * Gets the vault root path
 */
export function getVaultRoot(vault: Vault): string {
    // Try to get vault path from adapter
    // For local file system adapters, basePath exists but TypeScript doesn't know about it
    const adapter = vault.adapter as { basePath?: string };
    if (adapter.basePath && typeof adapter.basePath === 'string') {
        return adapter.basePath;
    }

    // Fallback: try to get from the vault's config or use a workaround
    // In Obsidian, we can use the adapter's path resolution
    // For now, we'll need to pass the vault root from the plugin
    throw new Error('Cannot determine vault root path. Please ensure vault is using local file system.');
}

