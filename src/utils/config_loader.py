import yaml
import os
from typing import Any, Dict

def load_config(config_path: str = "configs/config.yaml") -> Dict[str, Any]:
    """Charge la configuration depuis le fichier YAML."""
    if not os.path.exists(config_path):
        print(f"⚠️ Fichier de config {config_path} introuvable. Utilisation des défauts.")
        return {}
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
        return data if isinstance(data, dict) else {}

def save_config(config_data: Dict[str, Any], config_path: str = "configs/config.yaml") -> None:
    """Sauvegarde la configuration dans le fichier YAML."""
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(config_data, f, default_flow_style=False, allow_unicode=True)
    print(f"💾 Configuration sauvegardée dans {config_path}")
