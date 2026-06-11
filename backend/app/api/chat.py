from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.rag.chain import ask_question

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class QuestionRequest(BaseModel):
    question: str
    session_id: Optional[int] = None

class ExecuteRequest(BaseModel):
    command: str
    session_id: Optional[int] = None

@router.post("/ask")
async def ask(
    request: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.session_id:
        session = ChatSession(user_id=current_user.id, title=request.question[:50])
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session_id = request.session_id

    db.add(ChatMessage(session_id=session_id, role="user", content=request.question))
    db.commit()

    result = await ask_question(request.question)

    db.add(ChatMessage(session_id=session_id, role="assistant", content=result["answer"]))
    db.commit()

    return {
        "session_id": session_id,
        "answer": result["answer"],
        "sources": result["sources"],
        "context_used": result["context_used"],
        "execute_command": result.get("execute_command"),
        "requires_confirmation": result.get("requires_confirmation", False)
    }

@router.post("/execute")
async def execute_command(
    request: ExecuteRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Execucao de comandos - apenas administradores"""
    from app.mikrotik.commands import mikrotik_service
    from app.api.mikrotik import mikrotik_config

    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik nao configurado. Adicione um dispositivo primeiro.")

    result = mikrotik_service.execute_raw(request.command)

    # Salva no historico
    if request.session_id:
        msg = f"[EXECUTADO] {request.command}\nResultado: {result.get('result', result.get('message', ''))}"
        db.add(ChatMessage(session_id=request.session_id, role="assistant", content=msg, was_executed=True))
        db.commit()

    return result

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).all()

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Sessao apagada"}
