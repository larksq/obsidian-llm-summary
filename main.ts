import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';
import { OpenAI } from "openai";

interface MLSummarySettings {
	OpenAIAPIKey: string;
	newConceptPrompt: string;
	pdfFolder: string;
	summaryOutputFolder: string;
}

const DEFAULT_SETTINGS: MLSummarySettings = {
	OpenAIAPIKey: "",
	newConceptPrompt: "ML",
	pdfFolder: "Files/Raw PDFs",
	summaryOutputFolder: "Concepts"
}

export default class MLSummary extends Plugin {
	settings: MLSummarySettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('LLM Ready');

		this.addCommand({
			id: 'init-llm-summary-folders',
			name: 'Initialize Notes Folders',

			callback: () => {
				const { vault } = this.app;
				vault.createFolder('Topics');
				vault.createFolder('Notes');
				vault.createFolder('Notes/Read');
				vault.createFolder('Concepts');
				vault.createFolder('Attachments');
				vault.createFolder('Files');
				vault.createFolder('Files/PDFs');
				// TODO: also add a readme file for instructions
			}
		});

		this.addCommand({
			id: 'create-new-concept-from-selected',
			name: 'New concept from selected',
			editorCallback: async (editor, view) => {
				const selectedText = editor.getSelection();
				const { vault } = this.app;

				if (selectedText) {
					// Sanitize the selected text to create a valid file name
					const sanitizedFileName = selectedText.replace(/[<>:"\/\\|?*]/g, '').trim();
					if (sanitizedFileName) {
						// Initialize OpenAI configuration
						const openai = new OpenAI({
							apiKey: this.settings.OpenAIAPIKey,
							dangerouslyAllowBrowser: true,
						});

						new Notice(`Defining new concept: ${sanitizedFileName}`)

						const filePath = `Concepts/${sanitizedFileName}.md`;
						editor.replaceSelection(`[[${sanitizedFileName}]]`);
						statusBarItemEl.setText('Defining New Concept..');
						try {
							// Query OpenAI API to generate text based on selected text
							const response = await openai.chat.completions.create({
								messages: [{ role: 'user', content: `Define and explain this ${this.settings.newConceptPrompt} concept: ${selectedText}` }],
								model: 'gpt-4o-mini',
							});

							const generatedContent = response.choices[0]?.message?.content?.trim() || '';

							// Create a new file in the vault with the selected text as its name
							await vault.create(filePath, `This is a LLM Concept.\n\n${generatedContent}`);
							new Notice(`New created note at Concepts/${sanitizedFileName}`);
						} catch (error) {
							new Notice(`Error creating note: ${error.message}`);
						}
					} else {
						new Notice('Selected text is not valid for a file name');
					}
				} else {
					new Notice('No text selected');
				}
				statusBarItemEl.setText('LLM Ready');
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MLSummarySettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MLSummarySettingTab extends PluginSettingTab {
	plugin: MLSummary;

	constructor(app: App, plugin: MLSummary) {
		super(app, plugin);
		this.plugin = plugin;

		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key (Required)')
			.setDesc('Enter your OpenAI API Key (stored at local only).')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.OpenAIAPIKey)
				.onChange(async (value) => {
					this.plugin.settings.OpenAIAPIKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('New Concept Fields (Required)')
			.setDesc('Your expert fields for notes. Left empty to not specify (and got vague explains). Modify carefully.')
			.addText(text => text
				.setPlaceholder('ML')
				.setValue(this.plugin.settings.newConceptPrompt)
				.onChange(async (value) => {
					this.plugin.settings.newConceptPrompt = value;
					await this.plugin.saveSettings();
				}));
	}

	display(): void {
	}
}
