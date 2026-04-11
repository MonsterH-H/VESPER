import os
import subprocess
import sys
import time
import webbrowser
import requests

def main():
    print("--- Lancement de l'Interface Premium VESPER ---")
    
    # Lancement du serveur uvicorn en arrière-plan
    # Recherche du python du venv
    venv_python = os.path.join("venv", "Scripts", "python.exe")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable
    
    process = subprocess.Popen([python_exe, "-m", "uvicorn", "src.api.server:app", "--reload"])
    
    # Attendre que le serveur démarre et soit prêt
    url = "http://127.0.0.1:8000"
    print("Attente du démarrage du serveur et chargement des modèles (warmup)...")
    for i in range(60):  # On attend jusqu'à 60 secondes pour le warmup
        try:
            # Augmentation du timeout à 5s car le warmup sollicite le CPU
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print("\n✅ Serveur opérationnel et modèles chargés !")
                break
        except (requests.exceptions.RequestException, Exception):
            # On affiche un indicateur de progression
            print(".", end="", flush=True)
        time.sleep(1)
    else:
        print("\nLe serveur est trop lent à démarrer. Essayez d'ouvrir manuellement http://localhost:8000")
        # On ne quitte pas, on laisse l'utilisateur décider
    
    print(f"\n🚀 Lancement de l'interface : {url}")
    
    # Ouvrir le navigateur
    webbrowser.open(url)
    
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\nFermeture de l'application.")
        process.terminate()

if __name__ == "__main__":
    main()
    