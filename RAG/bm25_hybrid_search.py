"""# Hybrid Search using BM25 and FAISS"""

from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# Initialize HuggingFace embeddings (no API key required)
embedding = HuggingFaceEmbeddings()

doc_list = [
    "I like apples",
    "I like oranges",
    "Apples and oranges are fruits",
    "I like computers by Apple",
    "I love fruit juice"
]

# initialize the bm25 retriever and faiss retriever
bm25_retriever = BM25Retriever.from_texts(doc_list)
bm25_retriever.k = 2

bm25_retriever.get_relevant_documents("Apple")

bm25_retriever.get_relevant_documents("a green fruit")

bm25_retriever.dict

"""## Embeddings - Dense retrievers FAISS"""

faiss_vectorstore = FAISS.from_texts(doc_list, embedding)
faiss_retriever = faiss_vectorstore.as_retriever(search_kwargs={"k": 2})

faiss_retriever.get_relevant_documents("A green fruit")

"""## Ensemble Retriever"""

# initialize the ensemble retriever
ensemble_retriever = EnsembleRetriever(retrievers=[bm25_retriever, faiss_retriever],
                                       weights=[0.5, 0.5])

docs = ensemble_retriever.get_relevant_documents("A green fruit")
docs

docs = ensemble_retriever.get_relevant_documents("Apple Phones")
docs

