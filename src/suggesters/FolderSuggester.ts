import { App, Scope } from "obsidian";

export class FolderSuggest {
	private app: App;
	private inputEl: HTMLInputElement;
	private scope: Scope;
	private suggestions: string[] = [];

	constructor(app: App, inputEl: HTMLInputElement) {
		this.app = app;
		this.inputEl = inputEl;
		this.scope = new Scope();

		// Get all folders in the vault
		this.suggestions = this.app.vault.getAllFolders()
			.map(folder => folder.path)
			.sort();

		// Add root folder option
		if (!this.suggestions.includes("")) {
			this.suggestions.unshift("");
		}

		// Attach suggestion functionality
		this.attachSuggestions();
	}

	private attachSuggestions(): void {
		let suggestionContainer: HTMLElement | null = null;
		let selectedIndex = -1;
		let isClickingSuggestion = false;
		let updatePositionHandler: (() => void) | null = null;

		const updatePosition = () => {
			if (!suggestionContainer) return;
			const inputRect = this.inputEl.getBoundingClientRect();
			suggestionContainer.style.top = `${inputRect.bottom + window.scrollY + 2}px`;
			suggestionContainer.style.left = `${inputRect.left + window.scrollX}px`;
			suggestionContainer.style.width = `${inputRect.width}px`;
		};

		const showSuggestions = (query: string = "") => {
			// Filter suggestions based on query
			const filtered = query
				? this.suggestions.filter(folder =>
					folder.toLowerCase().includes(query.toLowerCase())
				)
				: this.suggestions;

			// Remove existing suggestion container and event listeners
			if (suggestionContainer) {
				suggestionContainer.remove();
				suggestionContainer = null;
			}
			if (updatePositionHandler) {
				window.removeEventListener("scroll", updatePositionHandler, true);
				window.removeEventListener("resize", updatePositionHandler);
				updatePositionHandler = null;
			}

			if (filtered.length === 0) {
				return;
			}
			
			// Create suggestion dropdown positioned absolutely based on input position
			suggestionContainer = document.body.createDiv({ cls: "suggestion-container" });
			suggestionContainer.style.position = "fixed";
			suggestionContainer.style.zIndex = "10000";
			updatePosition();

			// Update position on scroll and resize
			updatePositionHandler = () => updatePosition();
			window.addEventListener("scroll", updatePositionHandler, true);
			window.addEventListener("resize", updatePositionHandler);

			const suggestionList = suggestionContainer.createDiv({ cls: "suggestion" });
			suggestionList.style.maxHeight = "200px";
			suggestionList.style.overflowY = "auto";
			suggestionList.style.backgroundColor = "var(--background-primary)";
			suggestionList.style.border = "1px solid var(--background-modifier-border)";
			suggestionList.style.borderRadius = "4px";
			suggestionList.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

			selectedIndex = -1;

			filtered.slice(0, 10).forEach((folder, index) => {
				const item = suggestionList.createDiv({
					cls: "suggestion-item",
					text: folder || "(root)"
				});
				item.style.padding = "4px 8px";
				item.style.cursor = "pointer";

				item.addEventListener("mouseenter", () => {
					// Remove previous selection
					suggestionList.querySelectorAll(".suggestion-item").forEach(el => {
						el.style.backgroundColor = "";
					});
					item.style.backgroundColor = "var(--background-modifier-hover)";
					selectedIndex = index;
				});

				item.addEventListener("mousedown", (e) => {
					e.preventDefault();
					isClickingSuggestion = true;
				});

				item.addEventListener("click", () => {
					isClickingSuggestion = true;
					this.inputEl.value = folder;
					this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
					if (suggestionContainer) {
						suggestionContainer.remove();
						suggestionContainer = null;
					}
					// Remove event listeners
					if (updatePositionHandler) {
						window.removeEventListener("scroll", updatePositionHandler, true);
						window.removeEventListener("resize", updatePositionHandler);
						updatePositionHandler = null;
					}
					setTimeout(() => {
						isClickingSuggestion = false;
						this.inputEl.focus();
					}, 0);
				});
			});
		};

		const hideSuggestions = () => {
			if (suggestionContainer && !isClickingSuggestion) {
				setTimeout(() => {
					if (suggestionContainer && !isClickingSuggestion) {
						suggestionContainer.remove();
						suggestionContainer = null;
						// Remove event listeners
						if (updatePositionHandler) {
							window.removeEventListener("scroll", updatePositionHandler, true);
							window.removeEventListener("resize", updatePositionHandler);
							updatePositionHandler = null;
						}
					}
				}, 150);
			}
		};

		// Show suggestions on input
		this.inputEl.addEventListener("input", (e) => {
			const query = (e.target as HTMLInputElement).value;
			showSuggestions(query);
		});

		// Show suggestions on focus
		this.inputEl.addEventListener("focus", () => {
			showSuggestions(this.inputEl.value);
		});

		// Hide suggestions on blur (with delay to allow clicks)
		this.inputEl.addEventListener("blur", () => {
			hideSuggestions();
		});

		// Handle keyboard navigation
		this.inputEl.addEventListener("keydown", (e) => {
			if (!suggestionContainer) return;

			const items = suggestionContainer.querySelectorAll(".suggestion-item") as NodeListOf<HTMLElement>;
			if (items.length === 0) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
				items[selectedIndex]?.scrollIntoView({ block: "nearest" });
				items.forEach((el, idx) => {
					el.style.backgroundColor = idx === selectedIndex ? "var(--background-modifier-hover)" : "";
				});
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				items.forEach((el, idx) => {
					el.style.backgroundColor = idx === selectedIndex ? "var(--background-modifier-hover)" : "";
				});
			} else if (e.key === "Enter" && selectedIndex >= 0) {
				e.preventDefault();
				const selectedItem = items[selectedIndex];
				if (selectedItem) {
					const folder = this.suggestions.find(f => 
						(f || "(root)") === selectedItem.textContent
					) || "";
					this.inputEl.value = folder;
					this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
					if (suggestionContainer) {
						suggestionContainer.remove();
						suggestionContainer = null;
					}
					// Remove event listeners
					if (updatePositionHandler) {
						window.removeEventListener("scroll", updatePositionHandler, true);
						window.removeEventListener("resize", updatePositionHandler);
						updatePositionHandler = null;
					}
				}
			} else if (e.key === "Escape") {
				hideSuggestions();
			}
		});
	}
}
