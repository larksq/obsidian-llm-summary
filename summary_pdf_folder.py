import os
import argparse
import fitz  # PyMuPDF
from openai import OpenAI
import arxiv

# Initialize OpenAI API key
client = OpenAI()

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def summarize_pdf(pdf_content, arxiv_link=None):
    prompt = (
        "Critic and summarize the PDF file in the following structure and bullet points:\n\n"
        "Authors: \n"
        "Released Date: \n"
        "Arxiv: " + str(arxiv_link) + "\n\n"
        "## Contributions\n"
        "## Previous Methods and Their Limitations\n"
        "## Our Theory and Methods\n"
        "## Experiments Settings & Results\n\n"
        "PDF Content:\n" + pdf_content
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # You can use "gpt-3.5-turbo" or another appropriate model
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096  # Adjust as necessary based on PDF length and required summary detail
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Failed to summarize PDF: {e}")
        return None

def search_arxiv(title):
    search = arxiv.Search(
        query=title,
        max_results=1,
        sort_by=arxiv.SortCriterion.Relevance
    )
    results = list(search.results())
    if results:
        return results[0].entry_id
    else:
        return None

def save_summary_as_markdown(summary, output_path):
    with open(output_path, 'w', encoding='utf-8') as file:
        file.write(summary)

def main(input_dir, output_dir, openai_key):
    if openai_key is not None:
        # set environment variable of openai_key
        os.environ["OPENAI_API_KEY"] = openai_key

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(input_dir, filename)
            pdf_content = extract_text_from_pdf(pdf_path)
            if len(pdf_content) > 200000:
                print(f"WARNING file is too long, cropping to 200k, length: {len(pdf_content)}")
                pdf_content = pdf_content[:200000]
            arxiv_link = search_arxiv(os.path.splitext(filename)[0])
            summary = summarize_pdf(pdf_content, arxiv_link)
            if summary is None:
                print(f"Failed to summarize {filename}. Try again later.")
                continue
            output_filename = os.path.splitext(filename)[0] + ".md"
            output_path = os.path.join(output_dir, output_filename)
            save_summary_as_markdown(summary, output_path)
            print(f"Saved summary for {filename} to {output_path}")
            # delete this file
            if args.delete_pdf:
                os.remove(pdf_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summarize PDF files in a directory and save as Markdown.")
    parser.add_argument('--openai_key', type=str)
    parser.add_argument("--input_dir", type=str, default="../../../Files/PDFs", help="Path to the directory containing PDF files.")
    parser.add_argument("--output_dir", type=str, default="../../../Notes", help="Path to the directory to save Markdown summaries.")
    parser.add_argument("--delete_pdf", type=bool, default=False, help="Delete the PDF file after summarizing.")
    args = parser.parse_args()

    main(args.input_dir, args.output_dir, args.openai_key)
