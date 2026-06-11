from app.mikrotik.connection import MikroTikConnection
from loguru import logger

class MikroTikService:

    def _run(self, fn):
        mk = MikroTikConnection()
        mk.connect()
        try:
            return fn(mk)
        finally:
            mk.disconnect()

    def get_system_info(self) -> dict:
        def fn(mk):
            result = mk.execute("/system/resource")
            return result[0] if result else {}
        return self._run(fn)

    def get_identity(self) -> dict:
        def fn(mk):
            result = mk.execute("/system/identity")
            return result[0] if result else {}
        return self._run(fn)

    def get_interfaces(self) -> list:
        def fn(mk):
            return mk.execute("/interface")
        return self._run(fn)

    def get_firewall_rules(self) -> list:
        def fn(mk):
            return mk.execute("/ip/firewall/filter")
        return self._run(fn)

    def get_ip_addresses(self) -> list:
        def fn(mk):
            return mk.execute("/ip/address")
        return self._run(fn)

    def get_logs(self) -> list:
        def fn(mk):
            return mk.execute("/log")
        return self._run(fn)

    def execute_raw(self, command: str) -> dict:
        """Executa comando RouterOS via API - busca por nome e executa"""
        import shlex
        mk = MikroTikConnection()
        mk.connect()
        try:
            logger.info(f"Executando comando: {command}")
            
            try:
                tokens = shlex.split(command.strip())
            except:
                tokens = command.strip().split()

            # Parse inteligente do comando RouterOS
            # Suporta varios formatos:
            # /interface set ether1 comment="WAN"
            # /ip/interface/set/ether1 comment="WAN"  
            # /ip firewall filter add chain=input action=drop
            first = tokens[0]
            all_parts = first.strip("/").split("/")
            
            # Junta tokens sem = ate encontrar um com =
            extra_parts = []
            param_start = 1
            for i, tok in enumerate(tokens[1:], 1):
                if "=" in tok:
                    param_start = i
                    break
                extra_parts.append(tok)
                param_start = i + 1

            all_parts += extra_parts

            # Identifica action (add/set/remove/print/enable/disable)
            ACTIONS = {"add", "set", "remove", "print", "get", "enable", "disable", "comment", "list", "export", "save"}
            action = None
            action_idx = None
            for i, p in enumerate(all_parts):
                if p.lower() in ACTIONS:
                    action = p.lower()
                    action_idx = i
                    break

            if action is None:
                return {"status": "error", "message": f"Acao nao reconhecida no comando: {command}"}

            path_parts = all_parts[:action_idx]
            positional_parts = all_parts[action_idx+1:]
            path = "/" + "/".join(path_parts)
            positional = positional_parts[0] if positional_parts else None

            # Parse parametros
            params = {}
            for token in tokens[param_start:]:
                if "=" in token:
                    k, v = token.split("=", 1)
                    params[k.strip()] = v.strip().strip('"').strip("'")

            # Corrige paths comuns que a IA gera errado
            PATH_MAP = {
                "/ip/interface": "/interface",
                "/ip/interface/wireless": "/interface/wireless",
                "/ip/interface/bridge": "/interface/bridge",
                "/ip/interface/vlan": "/interface/vlan",
                "/ip/interface/ethernet": "/interface/ethernet",
                "/system/dns": "/ip/dns",
                "/system/dns/set": "/ip/dns",
                "/ip/dns/set": "/ip/dns",
                "/system/ntp": "/system/ntp/client",
                "/system/clock": "/system/clock",
            }
            path = PATH_MAP.get(path, path)

            # Corrige parametros incorretos gerados pela IA
            PARAM_FIX = {
                "/ip/dns": {
                    "primary": None,
                    "secondary": None,
                    "servers": None,
                },
            }
            
            # Caso especial: DNS com primary/secondary -> servers
            if path == "/ip/dns" and ("primary" in params or "secondary" in params):
                servers = []
                if "primary" in params:
                    servers.append(params.pop("primary"))
                if "secondary" in params:
                    servers.append(params.pop("secondary"))
                params["servers"] = ",".join(servers)

            logger.info(f"Path: {path} | Action: {action} | Positional: {positional} | Params: {params}")

            resource = mk.api.get_resource(path)

            # Converte "comment" para "set comment="
            if action == "comment":
                action = "set"
                # O positional vira o nome da interface
                # e o primeiro param vira comment
                if positional and not params.get("comment"):
                    # Busca proximo token como comentario
                    for k, v in list(params.items()):
                        if k not in ("id", "numbers"):
                            params["comment"] = v
                            del params[k]
                            break

            # Converte "comment" para "set comment="
            if action == "comment":
                action = "set"
                # O positional vira o nome da interface
                # e o primeiro param vira comment
                if positional and not params.get("comment"):
                    # Busca proximo token como comentario
                    for k, v in list(params.items()):
                        if k not in ("id", "numbers"):
                            params["comment"] = v
                            del params[k]
                            break

            if action in ("print", "get", "list"):
                result = resource.get()
                return {"status": "success", "result": str(result)}

            # Busca item pelo nome se tem positional
            if positional:
                items = resource.get()
                item = next((i for i in items if i.get("name") == positional or i.get("id") == positional), None)
                if item:
                    params["id"] = item["id"]
                    logger.info(f"Item encontrado: {item.get('name')} id={item['id']}")

            if action == "add":
                result = resource.add(**params)
            elif action == "set":
                result = resource.set(**params)
            elif action == "remove":
                id_val = params.get("id") or params.get(".id")
                result = resource.remove(id=id_val)
            elif action == "enable":
                result = resource.call("enable", params)
            elif action == "disable":
                result = resource.call("disable", params)
            else:
                result = resource.call(action, params)

            return {"status": "success", "result": str(result) if result else "Comando executado com sucesso!"}

        except Exception as e:
            logger.error(f"Erro ao executar: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            mk.disconnect()


    def apply_hardening(self) -> dict:
        results = {}
        mk = MikroTikConnection()
        mk.connect()
        try:
            for service in ["telnet", "ftp", "www", "api-ssl"]:
                try:
                    mk.execute("/ip/service", "set", {"numbers": service, "disabled": "yes"})
                except:
                    pass
            results["services"] = "Servicos inseguros desabilitados"
            try:
                mk.execute("/system/note", "set", {
                    "show-at-login": "yes",
                    "note": "Acesso autorizado apenas. Atividade monitorada."
                })
                results["banner"] = "Banner configurado"
            except:
                pass
        except Exception as e:
            results["error"] = str(e)
        finally:
            mk.disconnect()
        return results

    def create_backup(self, name: str = "auto-backup") -> dict:
        def fn(mk):
            mk.execute("/system/backup", "save", {"name": name})
            return {"status": "success", "backup_name": name}
        try:
            return self._run(fn)
        except Exception as e:
            return {"status": "error", "message": str(e)}

mikrotik_service = MikroTikService()
