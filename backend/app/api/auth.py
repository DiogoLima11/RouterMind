from fastapi import APIRouter, Depends, HTTPException # pyright: ignore[reportMissingImports]
from fastapi.security import OAuth2PasswordRequestForm # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from pydantic import BaseModel # pyright: ignore[reportMissingImports]
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.auth.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.user

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

@router.post("/register", status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(user)
    db.commit()
    return {"message": "Usuário criado com sucesso"}

@router.post("/register/user", status_code=201)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registro de usuario comum - sem permissao de admin"""
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=UserRole.user
    )
    db.add(user)
    db.commit()
    return {"message": "Usuário criado com sucesso"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_access_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}
