import { Editor } from "obsidian";
// Node.js built-in modules are external in esbuild config and available at runtime
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import { ensureFolderExists, getFullPath, getRelativePath, getVaultRoot } from "./fileUtils";
import { Vault } from "obsidian";

const execAsync = promisify(exec);

/**
 * Cleans an Instagram URL by removing query parameters and trailing slashes
 */
export function cleanInstagramUrl(url: string): string {
    // Remove query parameters (everything after ?)
    const questionMarkIndex = url.indexOf('?');
    let cleaned = questionMarkIndex === -1 ? url : url.substring(0, questionMarkIndex);

    // Remove trailing slash if present
    cleaned = cleaned.replace(/\/$/, '');

    return cleaned;
}

/**
 * Detects if the cursor is positioned over a URL and extracts it (cleaned)
 */
export function detectUrlAtCursor(editor: Editor): string | null {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const cursorOffset = cursor.ch;

    // Regex pattern for Instagram URLs (reel or post) - includes query parameters for detection
    // Matches URLs with or without trailing slash before query parameters
    const instagramUrlPattern = /https?:\/\/(www\.)?instagram\.com\/(reels?|p)\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?/g;

    // Find all Instagram URLs in the line
    const matches = Array.from(line.matchAll(instagramUrlPattern));

    for (const match of matches) {
        if (match.index === undefined) continue;

        const urlStart = match.index;
        const urlEnd = urlStart + match[0].length;

        // Check if cursor is within this URL
        if (cursorOffset >= urlStart && cursorOffset <= urlEnd) {
            // Clean the URL before returning (remove query parameters)
            return cleanInstagramUrl(match[0]);
        }
    }

    return null;
}

/**
 * Validates if a URL is an Instagram reel URL
 */
export function isInstagramReelUrl(url: string): boolean {
    const instagramReelPattern = /https?:\/\/(www\.)?instagram\.com\/(reels?|p)\/[A-Za-z0-9_-]+/;
    return instagramReelPattern.test(url);
}

/**
 * Sanitizes a filename from a URL
 */
export function sanitizeFilename(url: string): string {
    // Extract the reel/post ID from the URL
    const match = url.match(/\/(reels?|p)\/([A-Za-z0-9_-]+)/);
    if (match && match[2]) {
        return `${match[2]}.mp4`;
    }

    // Fallback: use a hash or timestamp
    const timestamp = Date.now();
    return `reel_${timestamp}.mp4`;
}

/**
 * Finds the yt-dlp executable path
 * Checks common installation locations, especially for Homebrew on macOS
 */
async function findYtDlpPath(): Promise<string | null> {
    // Common paths where yt-dlp might be installed
    const commonPaths = [
        '/opt/homebrew/bin/yt-dlp',      // Homebrew on Apple Silicon
        '/usr/local/bin/yt-dlp',         // Homebrew on Intel Mac
        '/usr/bin/yt-dlp',               // System-wide installation
        'yt-dlp',                        // In PATH
    ];

    // First, try to find it using 'which' command (works if in PATH)
    try {
        const { stdout } = await execAsync('which yt-dlp');
        const path = stdout.trim();
        if (path && fs.existsSync(path)) {
            return path;
        }
    } catch {
        // which command failed, continue to check common paths
    }

    // Check common installation paths
    for (const testPath of commonPaths) {
        try {
            // For paths that might be in PATH, try executing directly
            if (testPath === 'yt-dlp') {
                await execAsync('yt-dlp --version');
                return 'yt-dlp';
            }

            // For absolute paths, check if file exists
            if (fs.existsSync(testPath)) {
                // Verify it's executable by trying to get version
                await execAsync(`"${testPath}" --version`);
                return testPath;
            }
        } catch {
            // Path doesn't exist or not executable, try next
            continue;
        }
    }

    return null;
}

/**
 * Checks if yt-dlp is available in the system
 */
export async function checkYtDlpAvailable(): Promise<boolean> {
    const path = await findYtDlpPath();
    return path !== null;
}

/**
 * Downloads an Instagram reel using yt-dlp command-line tool
 */
export async function downloadReel(
    url: string,
    downloadFolder: string,
    vault: Vault
): Promise<string> {
    // Ensure folder exists
    await ensureFolderExists(downloadFolder, vault);

    // Get vault root path
    // getVaultRoot throws if it can't determine the path, so if it returns, it's always a string
    const vaultRoot = getVaultRoot(vault);

    // Generate filename
    const filename = sanitizeFilename(url);
    const outputPath = getFullPath(`${downloadFolder}/${filename}`, vaultRoot);

    // Find yt-dlp executable path
    const ytDlpPath = await findYtDlpPath();
    if (!ytDlpPath) {
        throw new Error(
            'yt-dlp is not installed or not found in PATH. Please install it first:\n' +
            'macOS: brew install yt-dlp\n' +
            'Linux: sudo pip install yt-dlp\n' +
            'Windows: pip install yt-dlp\n\n' +
            'After installing, you may need to restart Obsidian.'
        );
    }

    // Build yt-dlp command
    // Use best video format available, prefer mp4
    // Escape the output path properly for shell
    const escapedOutputPath = outputPath.replace(/"/g, '\\"');
    const escapedYtDlpPath = ytDlpPath.replace(/"/g, '\\"');
    const command = `"${escapedYtDlpPath}" -f "best[ext=mp4]/best" -o "${escapedOutputPath}" "${url}"`;

    try {
        await execAsync(command, {
            timeout: 300000, // 5 minute timeout
        });

        // Check if file exists using relative path (vault.adapter.exists expects relative path)
        const relativeOutputPath = getRelativePath(outputPath, vaultRoot);
        const fileExists = await vault.adapter.exists(relativeOutputPath);

        if (!fileExists) {
            // Sometimes yt-dlp might add an extension or modify the filename
            // Try to find the actual downloaded file by checking the folder
            const folderPath = relativeOutputPath.split('/').slice(0, -1).join('/');
            const folderFiles = await vault.adapter.list(folderPath);
            const matchingFile = folderFiles.files?.find(f => f.includes(filename.replace('.mp4', '')));

            if (matchingFile) {
                return matchingFile;
            }

            throw new Error('Download completed but file not found');
        }

        return relativeOutputPath;
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            throw new Error(
                'yt-dlp command not found. Please install yt-dlp:\n' +
                'macOS: brew install yt-dlp\n' +
                'Linux: sudo pip install yt-dlp\n' +
                'Windows: pip install yt-dlp'
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('timeout')) {
            throw new Error('Download timed out. Please try again.');
        }

        if (error && typeof error === 'object' && 'stderr' in error && typeof error.stderr === 'string') {
            // Check for common yt-dlp errors
            if (error.stderr.includes('Private video')) {
                throw new Error('This reel is private and cannot be downloaded.');
            }
            if (error.stderr.includes('Video unavailable')) {
                throw new Error('This reel is unavailable.');
            }
            if (error.stderr.includes('Sign in')) {
                throw new Error('Instagram requires sign-in. Please sign in to Instagram in your browser first.');
            }
        }

        throw new Error(`Download failed: ${errorMessage}`);
    }
}

