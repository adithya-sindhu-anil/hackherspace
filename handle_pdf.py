import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

load_dotenv(dotenv_path=".env")

llm = ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model="llama3-70b-8192")


def extract_pdf(path: str):
    loader = PyPDFLoader(path)
    document = loader.load()
    number_of_pages = len(document)
    data = {
        "number of pages": number_of_pages,
        "sample content": document[0].page_content,
    }
    return data


def summarize(text: str):
    template = PromptTemplate.from_template(
        """
        You are text summarizer. Given the context of some educational material
        Summarize the relevant portions into a single flash card.
        Contain the flash card content in single para.
        Don't go outside the scope of the PDF.
        The context is:
        {context}
        """
    )
    chain = template | llm
    response = chain.invoke({"context": text})
    return response.content


def main(path: str):
    document = extract_pdf(path)
    flash_card_text = summarize(document["sample content"])
    return flash_card_text