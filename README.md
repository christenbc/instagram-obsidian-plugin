# Instagram Reel Downloader

Download Instagram reels directly into your Obsidian vault and embed them in your notes.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/christen.bc)

> If you find this plugin useful, please consider supporting my work. Your support helps me continue developing and improving this plugin and future projects.

## Features

-   **One-click download**: Place your cursor on an Instagram reel URL and download it instantly
-   **Automatic embedding**: Replaces the URL with an Obsidian video link (`![[filename.mp4]]`)
-   **Customizable storage**: Configure where downloaded reels are saved in your vault
-   **Smart URL detection**: Automatically detects Instagram reel URLs at your cursor position

## Prerequisites

This plugin requires **yt-dlp** to be installed on your system. The plugin is **desktop-only** and will not work on mobile devices.

### Installing yt-dlp

**macOS:**

```bash
brew install yt-dlp
```

**Linux:**

```bash
sudo pip install yt-dlp
```

**Windows:**

```bash
pip install yt-dlp
```

After installing yt-dlp, you may need to restart Obsidian for the plugin to detect it.

## Installation

### From Obsidian Community Plugins

1. Open **Settings → Community plugins**
2. Click **Browse** and search for "Instagram Reel Downloader"
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from GitHub
2. Extract the plugin folder to your vault's `.obsidian/plugins/` directory:
    ```
    <Vault>/.obsidian/plugins/instagram-reel-downloader/
    ```
3. Place `main.js`, `manifest.json`, and `styles.css` (if present) in the plugin folder
4. Reload Obsidian
5. Enable the plugin in **Settings → Community plugins**

## How to Use

1. **Paste an Instagram reel URL** into your note (e.g., `https://www.instagram.com/reel/ABC123xyz/`)

2. **Place your cursor** anywhere on the URL

3. **Run the command**:

    - Open the command palette (`Cmd/Ctrl + P`)
    - Type "Download instagram reel at cursor"
    - Press Enter

4. The plugin will:
    - Download the reel video to your configured folder
    - Replace the URL with an embedded video link: `![[filename.mp4]]`

The video will now be embedded in your note and playable directly in Obsidian.

## Configuration

Configure the plugin in **Settings → Instagram Reel Downloader**:

-   **Download folder**: Set the folder path (relative to vault root) where reels will be saved. Default is `Instagram Reels`.

## Troubleshooting

### "yt-dlp is not installed or not found in PATH"

-   Make sure yt-dlp is installed (see Prerequisites above)
-   Verify installation by running `yt-dlp --version` in your terminal
-   Restart Obsidian after installing yt-dlp
-   On macOS, ensure Homebrew paths are accessible to Obsidian

### "No instagram reel URL found at cursor position"

-   Make sure your cursor is positioned directly on the Instagram URL
-   The URL must be a valid Instagram reel or post URL format
-   Try selecting the entire URL if detection fails

### "This reel is private and cannot be downloaded"

-   Private reels require authentication and cannot be downloaded
-   Try downloading public reels instead

### "Download timed out"

-   Check your internet connection
-   The reel might be very large or the connection slow
-   Try again after a moment

### Video not playing in Obsidian

-   Ensure the file was downloaded successfully (check the download folder)
-   Verify the markdown link format is correct: `![[filename.mp4]]`
-   Some video formats may not be supported by Obsidian's built-in player

## Development

### Building from Source

1. Clone this repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Build the plugin:
    ```bash
    npm run build
    ```
4. For development with watch mode:
    ```bash
    npm run dev
    ```

### Project Structure

```
src/
  main.ts              # Plugin entry point and lifecycle
  settings.ts          # Settings interface and UI
  utils/
    downloader.ts      # yt-dlp integration and download logic
    fileUtils.ts       # File system utilities
```

## License

See LICENSE file for details.

## Support

If you encounter issues or have feature requests, please open an issue on GitHub.

## Credits

Created by [@christen_bc](https://github.com/christenbc/)
