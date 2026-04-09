from src.elevenlabs.wrapper import ElevenLabsManager

def main():
    print("--- Démonstration ElevenLabs ---")
    manager = ElevenLabsManager()
    
    # 1. Lister les voix (ElevenCreative / API)
    print("\n[ElevenCreative] Récupération des voix...")
    manager.list_voices()
    
    # 2. Exemple de génération (ElevenAPI)
    # text = "Ceci est un test de synthèse vocale avec ElevenLabs API."
    # manager.save_audio(text, "test_eleven.mp3")

    print("\nStructure prête. N'oubliez pas de configurer votre clé API dans le fichier .env")

if __name__ == "__main__":
    main()
