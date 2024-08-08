# Thoth Notes Plugin

Thoth Notes is an Obsidian plugin designed to enhance your note-taking experience by automating the creation and summarization of notes directly from PDF files stored in your vault. With a focus on academic papers, this plugin offers a simple and efficient way to summarize complex documents into a structured format.

# Features

	•	Summarize PDF Files: Automatically generate summaries for PDF files in your vault using OpenAI’s GPT-3.5-turbo model. The summaries are structured in markdown with sections for Problems to Solve, Previous Methods and Their Limitations, Our Theory and Methods, and Experiments to Back Our Theory.
	•	Create New Concept Notes: Create new notes from selected text with a single command. The plugin will generate a markdown file with the selected text as the title.

# Installation

	1.	Clone the repository or download the plugin files.
	2.	Place the plugin folder into your Obsidian plugins directory, usually located at VaultFolder/.obsidian/plugins/.
	3.	Enable the plugin in Obsidian by navigating to Settings > Community Plugins and toggling on Thoth Notes.
  4.  Run `npm run dev` to start.
  5.  Fill-in the OpenAI API Key to the setting popup.
  6.  Run Obsidian command '**Initialize Thoth Notes folders**' to setup default folders.

# Usage

Request an API Key:

To use the summarization feature, you’ll need an OpenAI API key. Replace the placeholder in the code with your actual API key.

Summarize PDF Files

	- Prepare an environment with openai package by `pip install openai`
  - Run `python summary_pdf_folder.py {pdf_folder} {output_folder} {openai_api_key}`

This command will search for all PDF files in your vault, summarize them, and insert the result into the output folder. The summary will be formatted with the following sections:

	- Problems to Solve
	- Previous Methods and Their Limitations
	- Our Theory and Methods and How We Solve Them
	- Experiments to Back Our Theory

Create New Concept Notes

	- Command: New concept from selected
	- Hotkey: Ctrl + Shift + N

Select any text in your note, and this command will create a new markdown file in the Concepts folder with the selected text as the file name. The file will include the selected text as the title and a placeholder for content.
