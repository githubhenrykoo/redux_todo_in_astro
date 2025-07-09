from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
import nltk
from nltk.tokenize import word_tokenize

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

def create_basic_retriever():
    """Create a basic BM25 retriever with sample texts."""
    return BM25Retriever.from_texts(["foo", "bar", "world", "hello", "foo bar"])

def create_document_retriever(k=4):
    """Create a BM25 retriever with Document objects."""
    return BM25Retriever.from_documents(
        [
            Document(page_content="foo"),
            Document(page_content="bar"),
            Document(page_content="world"),
            Document(page_content="hello"),
            Document(page_content="foo bar"),
        ],
        k=k
    )

def create_tokenized_retriever(k=2):
    """Create a BM25 retriever with word tokenization preprocessing."""
    return BM25Retriever.from_documents(
        [
            Document(page_content="foo"),
            Document(page_content="bar"),
            Document(page_content="world"),
            Document(page_content="hello"),
            Document(page_content="foo bar"),
        ],
        k=k,
        preprocess_func=word_tokenize
    )

if __name__ == "__main__":
    # Example usage
    print("Basic Retriever Test:")
    retriever = create_basic_retriever()
    result = retriever.invoke("foo")
    print([doc.page_content for doc in result])

    print("\nDocument Retriever Test:")
    doc_retriever = create_document_retriever(k=2)
    result = doc_retriever.invoke("bar")
    print([doc.page_content for doc in result])

    print("\nTokenized Retriever Test:")
    tokenized_retriever = create_tokenized_retriever()
    result = tokenized_retriever.invoke("bar")
    print([doc.page_content for doc in result])
