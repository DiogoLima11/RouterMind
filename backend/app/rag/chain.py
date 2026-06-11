from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from loguru import logger
import re
import json

PROMPT_TEMPLATE = """Voce e um assistente especialista em redes MikroTik e RouterOS v7.
Responda sempre em portugues do Brasil, de forma clara e tecnica.

INSTRUCOES IMPORTANTES:
- Quando o usuario pedir para EXECUTAR, CONFIGURAR, ADICIONAR, REMOVER algo no MikroTik, voce DEVE incluir um bloco de execucao.
- Para comandos executaveis, use o formato especial:
```execute
  /ip/address/add address=192.168.3.1/24 interface=ether3
```
- Explique o que o comando faz ANTES do bloco
- Avise sobre riscos se necessario
- Para perguntas informativas, responda normalmente sem bloco execute

CONTEXTO:
{context}

PERGUNTA: {question}

RESPOSTA:"""

INTENT_PROMPT = """Analise a mensagem do usuario e determine se ele quer EXECUTAR algo no MikroTik.

Mensagem: {question}

Responda APENAS com JSON no formato:
{{"intent": "execute" ou "query", "summary": "resumo curto do que fazer"}}

Se o usuario usar palavras como: configure, adicione, remova, crie, aplique, execute, coloque, defina, habilite, desabilite = intent execute
Se o usuario usar palavras como: como, o que, explique, mostre, qual = intent query"""

async def detect_intent(question: str) -> dict:
    try:
        llm = ChatOllama(model="llama3.2", base_url="http://localhost:11434", temperature=0)
        prompt = PromptTemplate(template=INTENT_PROMPT, input_variables=["question"])
        chain = prompt | llm | StrOutputParser()
        result = chain.invoke({"question": question})
        
        clean = result.strip()
        match = re.search(r'\{.*?\}', clean, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {"intent": "query", "summary": ""}
    except:
        return {"intent": "query", "summary": ""}

def extract_execute_command(text: str) -> str | None:
    """Extrai comando do bloco ```execute```"""
    match = re.search(r'```execute\n(.+?)```', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

async def ask_question(question: str) -> dict:
    try:
        logger.info(f"Pergunta: {question}")
        from app.rag.vector_store import get_vector_store

        llm = ChatOllama(
            model="llama3.2",
            base_url="http://localhost:11434",
            temperature=0.1,
        )

        store = get_vector_store()
        retriever = store.as_retriever(search_kwargs={"k": 3})
        relevant_docs = retriever.invoke(question)
        context = "\n\n".join(doc.page_content for doc in relevant_docs) if relevant_docs else "Sem contexto adicional."

        prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])
        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"context": context, "question": question})

        # Detecta se tem comando executavel
        execute_command = extract_execute_command(response)
        
        # Limpa o bloco execute da resposta para exibicao
        clean_response = re.sub(r'```execute\n.+?```', '', response, flags=re.DOTALL).strip()

        logger.info("Resposta gerada!")
        return {
            "answer": clean_response,
            "sources": list(set([d.metadata.get("source", "base") for d in relevant_docs])),
            "context_used": len(relevant_docs) > 0,
            "execute_command": execute_command,
            "requires_confirmation": execute_command is not None
        }
    except Exception as e:
        logger.error(f"Erro: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "answer": f"Erro ao processar: {str(e)}",
            "sources": [],
            "context_used": False,
            "execute_command": None,
            "requires_confirmation": False
        }
