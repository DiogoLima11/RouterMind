import routeros_api
from loguru import logger
from app.config.settings import get_settings

settings = get_settings()

class MikroTikConnection:
    def __init__(self):
        self.connection = None
        self.api = None

    def connect(self):
        try:
            self.connection = routeros_api.RouterOsApiPool(
                host=settings.mikrotik_host,
                username=settings.mikrotik_user,
                password=settings.mikrotik_password,
                port=settings.mikrotik_port,
                plaintext_login=True
            )
            self.api = self.connection.get_api()
            logger.info(f"Conectado ao MikroTik: {settings.mikrotik_host}:{settings.mikrotik_port}")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar no MikroTik: {e}")
            raise Exception(f"Erro de conexão: {str(e)}")

    def disconnect(self):
        try:
            if self.connection:
                self.connection.disconnect()
        except:
            pass

    def execute(self, path: str, command: str = "print", params: dict = None):
        try:
            resource = self.api.get_resource(path)
            if command == "print":
                return resource.get()
            elif command == "add":
                return [resource.add(**params)]
            elif command == "set":
                return [resource.set(**params)]
            elif command == "remove":
                return [resource.remove(id=params.get("id"))]
            else:
                return resource.call(command, params or {})
        except Exception as e:
            logger.error(f"Erro ao executar {path}/{command}: {e}")
            raise
