from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.auth.dependencies import require_admin, get_current_user
from app.database.connection import get_db
from app.models.mikrotik_config import MikroTikConfig
from app.models.user import User

router = APIRouter(prefix="/api/mikrotik", tags=["MikroTik"])

# Cache em memoria para conexao ativa
mikrotik_config = {
    "host": "", "user": "", "password": "",
    "port": 8728, "connected": False, "label": ""
}

class MikroTikConfigInput(BaseModel):
    host: str
    user: str
    password: str
    port: int = 8728
    label: str = "MikroTik Principal"

def get_service():
    from app.mikrotik.commands import MikroTikService
    return MikroTikService()

def safe_run(fn):
    try:
        return fn()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def load_config_from_db(db: Session):
    """Carrega configuracao do banco e atualiza cache"""
    cfg = db.query(MikroTikConfig).filter(MikroTikConfig.active == True).first()
    if cfg:
        mikrotik_config["host"]      = cfg.host
        mikrotik_config["user"]      = cfg.user
        mikrotik_config["password"]  = cfg.password
        mikrotik_config["port"]      = cfg.port
        mikrotik_config["label"]     = cfg.label
        mikrotik_config["connected"] = True
        from app.config.settings import get_settings
        s = get_settings()
        s.mikrotik_host     = cfg.host
        s.mikrotik_user     = cfg.user
        s.mikrotik_password = cfg.password
        s.mikrotik_port     = cfg.port
        return True
    return False

@router.get("/config")
def get_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Tenta carregar do banco se nao estiver em cache
    if not mikrotik_config["connected"]:
        load_config_from_db(db)
    return {
        "host":      mikrotik_config["host"],
        "user":      mikrotik_config["user"],
        "port":      mikrotik_config["port"],
        "label":     mikrotik_config["label"],
        "connected": mikrotik_config["connected"]
    }

@router.post("/config")
def save_config(config: MikroTikConfigInput, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    import routeros_api
    try:
        # Testa conexao
        conn = routeros_api.RouterOsApiPool(
            host=config.host, username=config.user,
            password=config.password, port=config.port,
            plaintext_login=True
        )
        api = conn.get_api()
        identity = api.get_resource("/system/identity").get()
        conn.disconnect()

        # Desativa configs anteriores
        db.query(MikroTikConfig).update({"active": False})

        # Salva nova config
        cfg = db.query(MikroTikConfig).filter(
            MikroTikConfig.host == config.host,
            MikroTikConfig.port == config.port
        ).first()

        if cfg:
            cfg.user     = config.user
            cfg.password = config.password
            cfg.label    = config.label
            cfg.active   = True
        else:
            cfg = MikroTikConfig(
                host=config.host, user=config.user,
                password=config.password, port=config.port,
                label=config.label, active=True
            )
            db.add(cfg)

        db.commit()

        # Atualiza cache
        mikrotik_config["host"]      = config.host
        mikrotik_config["user"]      = config.user
        mikrotik_config["password"]  = config.password
        mikrotik_config["port"]      = config.port
        mikrotik_config["label"]     = config.label
        mikrotik_config["connected"] = True

        from app.config.settings import get_settings
        s = get_settings()
        s.mikrotik_host     = config.host
        s.mikrotik_user     = config.user
        s.mikrotik_password = config.password
        s.mikrotik_port     = config.port

        return {
            "status":   "success",
            "message":  "Conectado e salvo com sucesso!",
            "identity": identity[0].get("name", "desconhecido")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro de conexão: {str(e)}")

@router.delete("/config")
def remove_config(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    db.query(MikroTikConfig).update({"active": False})
    db.commit()
    mikrotik_config["host"]      = ""
    mikrotik_config["user"]      = ""
    mikrotik_config["password"]  = ""
    mikrotik_config["connected"] = False
    return {"status": "success", "message": "MikroTik desconectado"}

@router.get("/saved")
def get_saved_configs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Lista todas as configs salvas"""
    configs = db.query(MikroTikConfig).all()
    return [{"id": c.id, "host": c.host, "port": c.port, "label": c.label, "active": c.active} for c in configs]

@router.put("/config/{config_id}/activate")
def activate_config(config_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Ativa uma config salva"""
    db.query(MikroTikConfig).update({"active": False})
    cfg = db.query(MikroTikConfig).filter(MikroTikConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config não encontrada")
    cfg.active = True
    db.commit()
    load_config_from_db(db)
    return {"status": "success", "message": f"Configuração '{cfg.label}' ativada"}

def ensure_config_loaded(db: Session):
    if not mikrotik_config["connected"]:
        load_config_from_db(db)

@router.get("/status")
def get_status(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_system_info)

@router.get("/identity")
def get_identity(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_identity)

@router.get("/interfaces")
def get_interfaces(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_interfaces)

@router.get("/firewall")
def get_firewall(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_firewall_rules)

@router.get("/addresses")
def get_addresses(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_ip_addresses)

@router.get("/logs")
def get_logs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_logs)

@router.post("/hardening")
def apply_hardening(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().apply_hardening)

@router.post("/backup")
def create_backup(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().create_backup)

@router.get("/status/view")
def get_status_view(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_system_info)

@router.get("/interfaces/view")
def get_interfaces_view(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_config_loaded(db)
    if not mikrotik_config["connected"]:
        raise HTTPException(status_code=400, detail="MikroTik não configurado")
    return safe_run(get_service().get_interfaces)
