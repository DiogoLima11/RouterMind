import chromadb
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from app.config.settings import get_settings

settings = get_settings()

def get_embeddings():
    return OllamaEmbeddings(
        model=settings.embedding_model,
        base_url=settings.ollama_base_url
    )

def get_vector_store() -> Chroma:
    return Chroma(
        collection_name="mikrotik_knowledge",
        embedding_function=get_embeddings(),
        persist_directory=settings.chroma_persist_dir
    )

def add_documents(documents: list) -> int:
    store = get_vector_store()
    store.add_documents(documents)
    return len(documents)

def similarity_search(query: str, k: int = 5) -> list:
    store = get_vector_store()
    return store.similarity_search(query, k=k)
