import { App, PluginSettingTab, Setting } from "obsidian";
import InstagramReelDownloader from "./main";
import { FolderSuggest } from "./suggesters/FolderSuggester";

export interface InstagramReelDownloaderSettings {
	downloadFolder: string;
}

export const DEFAULT_SETTINGS: InstagramReelDownloaderSettings = {
	downloadFolder: 'Instagram Reels'
}

export class InstagramReelDownloaderSettingTab extends PluginSettingTab {
	plugin: InstagramReelDownloader;

	constructor(app: App, plugin: InstagramReelDownloader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Download folder')
			.setDesc('Folder path where instagram reels will be saved (relative to vault root)')
			.addSearch(cb => {
				try {
					new FolderSuggest(this.app, cb.inputEl);
				} catch (e) {
					console.error(e);
				}
				cb.setPlaceholder('Instagram reels')
					.setValue(this.plugin.settings.downloadFolder)
					.onChange(async (value) => {
						if (value.trim()) {
							this.plugin.settings.downloadFolder = value.trim();
						} else {
							this.plugin.settings.downloadFolder = DEFAULT_SETTINGS.downloadFolder;
						}
						await this.plugin.saveSettings();
					});
			});
	}
}
