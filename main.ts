import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, addIcon } from 'obsidian';
import { OpenAI } from "openai";
import { PDFDocument } from 'pdf-lib';

// Define a constant for the OpenAI API key
const OPENAI_API_KEY = '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';

// Initialize OpenAI configuration
const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
	dangerouslyAllowBrowser: true,
});

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('bot', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

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
				vault.createFolder('Concepts');
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
						const filePath = `Concepts/${sanitizedFileName}.md`;
						editor.replaceSelection(`[[${sanitizedFileName}]]`);
						statusBarItemEl.setText('Defining New Concept..');
						try {
							// Query OpenAI API to generate text based on selected text
							const response = await openai.chat.completions.create({
								messages: [{ role: 'user', content: `Define and explain this ML concept: ${selectedText}` }],
								model: 'gpt-4o-mini',
							});

							const generatedContent = response.choices[0].message.content.trim();

							// Create a new file in the vault with the selected text as its name
							await vault.create(filePath, `This is a Thoth Concept.\n\n${generatedContent}`);
							new Notice(`Created new concept note: ${sanitizedFileName}`);
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
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
