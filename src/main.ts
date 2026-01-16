import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, InstagramReelDownloaderSettings, InstagramReelDownloaderSettingTab } from "./settings";
import { isInstagramReelUrl, downloadReel, cleanInstagramUrl } from "./utils/downloader";

export default class InstagramReelDownloader extends Plugin {
	settings: InstagramReelDownloaderSettings;

	async onload() {
		await this.loadSettings();

		// Add command to download reel at cursor position
		this.addCommand({
			id: 'download-reel-at-cursor',
			name: 'Download instagram reel at cursor',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.downloadReelAtCursor(editor);
			}
		});

		// Add settings tab
		this.addSettingTab(new InstagramReelDownloaderSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<InstagramReelDownloaderSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Downloads an Instagram reel at the cursor position and replaces the URL with a markdown video link
	 */
	async downloadReelAtCursor(editor: Editor): Promise<void> {
		try {
			// Get cursor position first
			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);
			const cursorOffset = cursor.ch;

			// Find the full URL (with query parameters) at cursor position
			// Matches URLs with or without trailing slash before query parameters
			const instagramUrlPattern = /https?:\/\/(www\.)?instagram\.com\/(reels?|p)\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?/g;
			const matches = Array.from(line.matchAll(instagramUrlPattern));

			let originalUrl: string | null = null;
			let urlStart: number | null = null;
			let urlEnd: number | null = null;

			for (const match of matches) {
				if (match.index === undefined) continue;
				const matchStart = match.index;
				const matchEnd = matchStart + match[0].length;

				if (cursorOffset >= matchStart && cursorOffset <= matchEnd) {
					originalUrl = match[0];
					urlStart = matchStart;
					urlEnd = matchEnd;
					break;
				}
			}

			if (!originalUrl || urlStart === null || urlEnd === null) {
				new Notice('No instagram reel URL found at cursor position.');
				return;
			}

			// Clean the URL (remove query parameters) for downloading
			const cleanedUrl = cleanInstagramUrl(originalUrl);

			// Validate it's an Instagram reel URL
			if (!isInstagramReelUrl(cleanedUrl)) {
				new Notice('The URL at the cursor is not a valid instagram reel URL.');
				return;
			}

			// Show downloading notice
			new Notice('Downloading reel...');

			// Download the reel using cleaned URL
			const relativePath = await downloadReel(cleanedUrl, this.settings.downloadFolder, this.app.vault);

			// Extract only the filename (with extension) from relative path
			// relativePath might be like "Instagram Reels/DS7ltAlkVwU.mp4" or just "DS7ltAlkVwU.mp4"
			// We only want the filename part, not the folder path
			const fileName = relativePath.split('/').pop() || relativePath.split('\\').pop() || relativePath;

			// Ensure we have a valid filename with extension
			if (!fileName || !fileName.includes('.')) {
				throw new Error('Could not extract valid filename from downloaded file path.');
			}

			// Replace URL with Obsidian internal link format (only filename, no folder path)
			const markdownLink = `![[${fileName}]]`;

			editor.replaceRange(
				markdownLink,
				{ line: cursor.line, ch: urlStart },
				{ line: cursor.line, ch: urlEnd }
			);

			new Notice('Reel downloaded successfully!');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error: ${errorMessage}`);
		}
	}
}
