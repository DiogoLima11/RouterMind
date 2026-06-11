import sys
sys.path.insert(0, "/home/***REMOVED***/projetos/tcc-mk/mikrotik-ai-chatbot/backend")

from app.rag.document_loader import load_directory
from app.rag.vector_store import add_documents
from loguru import logger

if __name__ == "__main__":
    logger.info("Iniciando ingestao de documentos...")
    docs = load_directory("data/raw")
    if not docs:
        logger.warning("Nenhum documento encontrado!")
    else:
        count = add_documents(docs)
        logger.success(f"Total de chunks adicionados: {count}")
