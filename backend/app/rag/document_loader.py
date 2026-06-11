from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from loguru import logger

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

def load_pdf(path):
    try:
        return splitter.split_documents(PyPDFLoader(path).load())
    except Exception as e:
        logger.error(f"Erro PDF {path}: {e}")
        return []

def load_text(path):
    try:
        return splitter.split_documents(TextLoader(path, encoding="utf-8").load())
    except Exception as e:
        logger.error(f"Erro TXT {path}: {e}")
        return []

def load_rsc(path):
    try:
        content = Path(path).read_text(encoding="utf-8")
        doc = Document(page_content=content, metadata={"source": path, "type": "mikrotik_script"})
        return splitter.split_documents([doc])
    except Exception as e:
        logger.error(f"Erro RSC {path}: {e}")
        return []

def load_directory(directory):
    all_docs = []
    path = Path(directory)
    for ext, fn in [("*.pdf", load_pdf), ("*.txt", load_text), ("*.md", load_text), ("*.rsc", load_rsc)]:
        for f in path.rglob(ext):
            logger.info(f"Carregando: {f}")
            all_docs.extend(fn(str(f)))
    logger.info(f"Total de chunks: {len(all_docs)}")
    return all_docs
