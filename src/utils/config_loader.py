import yaml
import os

def load_config(config_path="configs/config.yaml"):
    """Charge la configuration depuis le fichier YAML."""
    if not os.path.exists(config_path):
        print(f"⚠️ Fichier de config {config_path} introuvable. Utilisation des défauts.")
        return {}
    
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
