import subprocess
import sys
import os
import time
import webbrowser
import requests

def main():
    print("--- Lancement de l'Interface Premium VESPER ---")
    
    # Chemin vers le serveur
    server_path = os.path.join("src", "api", "server.py")
    
    # Lancement du serveur uvicorn en arrière-plan
    print("🚀 Démarrage du moteur IA (Backend)...")
    process = subprocess.Popen([sys.executable, "-m", "uvicorn", "src.api.server:app", "--reload"])
    
    # Attendre que le serveur démarre et soit prêt
    url = "http://localhost:8000"
    print("⏳ Attente du démarrage du serveur...")
    for i in range(30):  # Attendre jusqu'à 30 secondes
        try:
            response = requests.get(f"{url}/health", timeout=1)
            if response.status_code == 200:
                print("✅ Serveur prêt ! (Les clients cloud sont initialisés, les modèles se déclenchent à la première requête)")
                break
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    else:
        print("❌ Le serveur n'a pas démarré dans les délais. Ouvrez manuellement http://localhost:8000")
        return
    
    # Ouvrir le navigateur
    print(f"🌍 Ouverture de l'interface à l'adresse : {url}")
    webbrowser.open(url)
    
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\n👋 Fermeture de l'application.")
        process.terminate()

if __name__ == "__main__":
    main()
