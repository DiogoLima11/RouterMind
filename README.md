<div align="center">

# 🤖 RouterMind

### Automação de Redes MikroTik via Chatbot com Inteligência Artificial

Interface conversacional inteligente que integra **LLMs locais** com a técnica de
**RAG (Retrieval-Augmented Generation)** para automatizar configurações de rede,
aplicar políticas de segurança (*hardening*) e gerenciar rotinas de
*disaster recovery* em dispositivos **MikroTik RouterOS v7**.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-LLM_Local-000000?logo=ollama&logoColor=white)](https://ollama.com/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C)](https://www.langchain.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Fluxo RAG](#-fluxo-rag)
- [Segurança](#-segurança)
- [Testes](#-testes)
- [Roadmap](#-roadmap)
- [Documentação Acadêmica (TCC)](#-documentação-acadêmica-tcc)
- [Contribuição](#-contribuição)
- [Licença](#-licença)
- [Autor](#-autor)

---

## 📖 Sobre o Projeto

O **RouterMind** é um Trabalho de Conclusão de Curso (TCC) que propõe uma
solução para reduzir a barreira técnica na administração de equipamentos de rede
MikroTik. Por meio de uma interface de chat em linguagem natural, o sistema é capaz de:

1. **Responder perguntas técnicas** com base em uma base de conhecimento curada (RAG).
2. **Gerar comandos** RouterOS automaticamente a partir de uma intenção descrita em texto.
3. **Executar comandos** diretamente no roteador, sob controle de permissões.
4. **Aprender continuamente** com cada interação, realimentando a base de conhecimento.
5. **Garantir segurança e auditoria** com autenticação, controle de acesso e logs.

> ⚠️ **Aviso:** este projeto executa comandos em equipamentos de rede reais.
> Utilize sempre em ambiente de laboratório ou com backups válidos. O autor não se
> responsabiliza por configurações aplicadas em ambiente de produção.

---

## ✨ Funcionalidades

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | 🔐 **Autenticação** | Login com JWT, hash de senha (bcrypt), níveis *superadmin* e *usuário comum*, controle de permissões e logs de auditoria. |
| 2 | 💬 **Chatbot com IA (RAG)** | Interface conversacional, busca semântica na base de conhecimento, geração de respostas técnicas e sugestão de comandos. |
| 3 | ⚡ **Execução de Comandos** | Integração via API oficial RouterOS v7. Apenas *admin* executa; usuário comum apenas consulta. |
| 4 | 📚 **Base de Conhecimento** | Ingestão de PDF, TXT, Markdown, scripts `.rsc` e logs. Dados em SQLite e embeddings em base vetorial. |
| 5 | 🧠 **Aprendizado Contínuo** | Armazenamento de cada par pergunta/resposta e atualização automática da base RAG. |
| 6 | 🛡️ **Hardening** | Desativação de serviços inseguros, configuração de firewall, limitação de API, ajuste de DNS e gestão de usuários. |
| 7 | 💾 **Disaster Recovery** | Backup automático, restore, validação de integridade e rollback. |
| 8 | 🔒 **Segurança** | Criptografia de credenciais, logs de auditoria, isolamento de rede e sandbox para execução de scripts. |

---

## 🏗 Arquitetura

```
┌─────────────────┐      HTTP/REST       ┌──────────────────────────────┐
│                 │  ◄───────────────►   │          BACKEND (FastAPI)    │
│  FRONTEND       │                      │                              │
│  (React)        │                      │  ┌────────┐   ┌───────────┐  │
│                 │                      │  │  API   │──►│  Services │  │
└─────────────────┘                      │  └────────┘   └─────┬─────┘  │
                                         │                     │        │
                          ┌──────────────┼─────────────────────┼──────┐ │
                          │              │                     │      │ │
                    ┌─────▼─────┐  ┌─────▼──────┐       ┌──────▼────┐ │ │
                    │   AUTH    │  │    RAG     │       │  MIKROTIK │ │ │
                    │ (JWT/RBAC)│  │ (LangChain)│       │ (RouterOS)│ │ │
                    └─────┬─────┘  └─────┬──────┘       └──────┬────┘ │ │
                          │              │                     │      │ │
                    ┌─────▼─────┐  ┌─────▼──────┐       ┌──────▼────┐ │ │
                    │  SQLite   │  │ Vector DB  │       │  Roteador │ │ │
                    │ (dados)   │  │(embeddings)│       │  MikroTik │ │ │
                    └───────────┘  └─────┬──────┘       └───────────┘ │ │
                                         │                            │ │
                                   ┌─────▼──────┐                     │ │
                                   │   OLLAMA   │                     │ │
                                   │ (LLM local)│                     │ │
                                   └────────────┘─────────────────────┘ │
                                                                        │
                                         └──────────────────────────────┘
```

Diagramas detalhados (componentes, sequência, implantação) estão em [`tcc/arquitetura/`](tcc/arquitetura).

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Linguagem principal | **Python 3.11+** |
| Backend | **FastAPI** |
| Frontend | **React 18** |
| Banco de dados | **SQLite** |
| LLM | **Ollama** (modelo local, ex.: `llama3`, `mistral`) |
| Framework RAG | **LangChain** |
| Base vetorial | **ChromaDB** |
| Embeddings | `nomic-embed-text` (via Ollama) |
| Integração MikroTik | **API oficial RouterOS v7** (`librouteros`) |
| Autenticação | **JWT** + **bcrypt** |
| Testes | **pytest** |
| Containerização | **Docker / Docker Compose** |
| SO de referência | **Linux** (Zorin OS / Ubuntu Server) |

---

## 📁 Estrutura de Pastas

```
RouterMind/
├── backend/
│   ├── app/
│   │   ├── api/          # Rotas/endpoints FastAPI
│   │   ├── services/     # Regras de negócio
│   │   ├── models/       # Modelos de dados (ORM/Pydantic)
│   │   ├── rag/          # Pipeline RAG (ingestão, embeddings, retrieval)
│   │   ├── mikrotik/     # Cliente da API RouterOS
│   │   ├── auth/         # JWT, hashing, RBAC
│   │   ├── database/     # Conexão e migrações SQLite
│   │   ├── config/       # Variáveis e settings
│   │   └── utils/        # Funções auxiliares
│   ├── data/
│   │   ├── raw/          # Documentos brutos (PDF, TXT, MD, .rsc)
│   │   ├── processed/    # Documentos pré-processados/chunked
│   │   └── embeddings/   # Base vetorial persistida
│   └── tests/            # Testes automatizados
├── frontend/
│   ├── src/              # Código React
│   └── public/           # Assets estáticos
├── docs/                 # Documentação técnica
├── tcc/
│   ├── arquitetura/      # Diagramas
│   └── abnt/             # Documento ABNT
├── scripts/
│   ├── ingest_data.py    # Ingestão da base de conhecimento
│   ├── backup.py         # Rotina de backup
│   └── scheduler.py      # Agendamento de tarefas
├── docker/               # Dockerfiles e compose
└── README.md
```

---

## ✅ Pré-requisitos

- **Python** 3.11 ou superior
- **Node.js** 18+ e **npm** (para o frontend)
- **Ollama** instalado e em execução ([ollama.com](https://ollama.com))
- **Docker** e **Docker Compose** (opcional, para deploy)
- Um roteador **MikroTik com RouterOS v7** (físico ou CHR em VM) com a API habilitada

---

## 🚀 Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/DiogoLima11/RouterMind.git
cd RouterMind
```

### 2. Configurar o Ollama e baixar os modelos

```bash
# Instalar o Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Baixar o LLM e o modelo de embeddings
ollama pull llama3
ollama pull nomic-embed-text
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copiar e editar variáveis de ambiente
cp .env.example .env
nano .env
```

### 4. Frontend

```bash
cd ../frontend
npm install
```

### 5. Ingerir a base de conhecimento

```bash
cd ..
python scripts/ingest_data.py
```

### 6. Subir os serviços

```bash
# Backend (a partir de /backend, com o venv ativo)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (a partir de /frontend, em outro terminal)
npm run dev
```

> 💡 Alternativamente, suba tudo com `docker compose -f docker/docker-compose.yml up --build`.

---

## 💻 Como Usar

1. Acesse o frontend em `http://localhost:5173`.
2. Faça login (o usuário *superadmin* inicial é criado no primeiro boot — veja [`docs/`](docs)).
3. No chat, faça perguntas como:
   - *"Como bloquear o acesso à API externa no MikroTik?"*
   - *"Gere um script de hardening para RouterOS v7."*
   - *"Faça backup da configuração atual do roteador."*
4. Comandos sugeridos só são **executados** após confirmação e apenas por usuários *admin*.

---

## 🔄 Fluxo RAG

```
Usuário → Pergunta → Embedding → Busca Vetorial → Contexto → LLM → Resposta
                                                                      │
                                                                      ▼
                                                          Armazenamento + Reindexação
                                                          (Aprendizado Contínuo)
```

1. A pergunta do usuário é convertida em um vetor (*embedding*).
2. O vetor é comparado com os documentos da base vetorial (ChromaDB).
3. Os trechos mais relevantes formam o **contexto**.
4. O contexto + a pergunta são enviados ao **LLM via Ollama**.
5. A resposta é retornada e o par pergunta/resposta é armazenado para realimentar a base.

---

## 🔒 Segurança

- **Credenciais MikroTik criptografadas** antes de persistir.
- **JWT** com expiração curta e *refresh token*.
- **RBAC**: apenas *admin* executa comandos; usuário comum apenas consulta.
- **Logs de auditoria** de todas as ações sensíveis.
- **Sandbox** para validação de scripts antes da execução.
- Comunicação com o roteador isolada em camada de serviço.

Detalhes em [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 🧪 Testes

```bash
cd backend
source venv/bin/activate
pytest -v --cov=app
```

---

## 🗺 Roadmap

- [ ] Suporte a múltiplos roteadores simultâneos
- [ ] Painel de métricas e dashboards
- [ ] Exportação de relatórios de hardening em PDF
- [ ] Suporte a outros fabricantes (Cisco, Huawei)
- [ ] Modo offline completo

---

## 🎓 Documentação Acadêmica (TCC)

Este projeto é um Trabalho de Conclusão de Curso individual e de código aberto.
A documentação no padrão **ABNT** encontra-se em [`tcc/abnt/`](tcc/abnt) e os
diagramas de arquitetura em [`tcc/arquitetura/`](tcc/arquitetura).

Critérios de avaliação: complexidade técnica, documentação, testes, usabilidade e originalidade.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Leia o [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de abrir
um *Pull Request*. Por favor, respeite o [Código de Conduta](CODE_OF_CONDUCT.md).

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](LICENSE) para mais informações.

---

## 👤 Autor

**Diogo Lima** — GitHub [@DiogoLima11](https://github.com/DiogoLima11)

Trabalho de Conclusão de Curso individual.

> Complemente esta seção com: instituição, curso, orientador e contato.

---

<div align="center">

⭐ Se este projeto te ajudou, deixe uma estrela!

</div>
