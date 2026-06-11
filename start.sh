#!/bin/bash

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       MikroTik AI Chatbot            ║"
echo "  ║       TCC 2026 - Ntech               ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# Mata processos anteriores
echo -e "${YELLOW}[1/4] Limpando processos anteriores...${NC}"
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 2
echo -e "${GREEN}  ✓ Pronto${NC}"

# Verifica Ollama
echo -e "${YELLOW}[2/4] Verificando Ollama...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Ollama online${NC}"
else
    echo -e "${YELLOW}  ⚡ Iniciando Ollama...${NC}"
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 4
    echo -e "${GREEN}  ✓ Ollama iniciado${NC}"
fi

# Inicia Backend
echo -e "${YELLOW}[3/4] Iniciando Backend (FastAPI)...${NC}"
cd "$BASE_DIR/backend"
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
sleep 6

if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend rodando em http://localhost:8000${NC}"
else
    echo -e "${RED}  ✗ Erro no backend:${NC}"
    tail -5 /tmp/backend.log
    exit 1
fi

# Inicia Frontend
echo -e "${YELLOW}[4/4] Iniciando Frontend (React)...${NC}"
cd "$BASE_DIR/frontend"
nohup npm start > /tmp/frontend.log 2>&1 &
sleep 8
echo -e "${GREEN}  ✓ Frontend rodando em http://localhost:3000${NC}"

# Resumo final
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Sistema iniciado com sucesso!${NC}"
echo ""
echo -e "  🌐 Acesse: ${BLUE}http://localhost:3000${NC}"
echo -e "  👤 Login:  ${YELLOW}admin${NC} / ${YELLOW}admin123${NC}"
echo -e "  📚 API:    ${BLUE}http://localhost:8000/docs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Para parar: ${RED}./stop.sh${NC}"
echo ""
