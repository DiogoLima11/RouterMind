#!/bin/bash
echo "Encerrando sistema..."
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
echo "✓ Sistema encerrado!"
