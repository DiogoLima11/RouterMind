import sys
sys.path.append("../backend")

from app.rag.document_loader import load_directory # pyright: ignore[reportMissingImports]
from app.rag.vector_store import add_documents # pyright: ignore[reportMissingImports]
from loguru import logger # pyright: ignore[reportMissingImports]

def main():
    logger.info("Iniciando ingestão de documentos...")
    docs = load_directory("../backend/data/raw")
    
    if not docs:
        logger.warning("Nenhum documento encontrado!")
        return
    
    count = add_documents(docs)
    logger.success(f"{count} chunks adicionados à base vetorial!")

if __name__ == "__main__":
    main()