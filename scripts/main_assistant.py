import sys
import os

# Ajustement pour l'import des modules locaux
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.assistant.core import AssistantCore

def main():
    """Point d'entrée principal de l'application."""
    try:
        assistant = AssistantCore()
        assistant.start()
    except Exception as e:
        print(f"💥 Erreur critique au démarrage : {e}")

if __name__ == "__main__":
    main()
