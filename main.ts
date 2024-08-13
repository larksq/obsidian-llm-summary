import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';
import { OpenAI } from "openai";

interface MyPluginSettings {
	OpenAIAPIKey: string;
	newConceptPrompt: string;
	pdfFolder: string;
	summaryOutputFolder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	OpenAIAPIKey: "",
	newConceptPrompt: "ML",
	pdfFolder: "Files/Raw PDFs",
	summaryOutputFolder: "Concepts"
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('bot', 'About Thoth Note', (evt: MouseEvent) => {
		// 	new Notice("Not working due to CROS polocy, try the python script instead.");
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Thoth Ready');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'init-thoth-notes-folders',
			name: 'Initialize Thoth Notes folders',

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

							const generatedContent = response.choices[0].message.content.trim();

							// Create a new file in the vault with the selected text as its name
							await vault.create(filePath, `This is a Thoth Concept.\n\n${generatedContent}`);
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
				statusBarItemEl.setText('Thoth Ready');
			},
			hotkeys: [
				{
					modifiers: ["Ctrl", "Shift"],
					key: "N"
				}
			]
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;

		const {containerEl} = this;

		containerEl.empty();
		// const intro = containerEl.createEl("div");
		// intro.createEl(
		// 	"h2", {text: "Setup "}
		// );

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
