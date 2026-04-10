import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key, http_options={'api_version': 'v1'})

try:
    print("--- Liste des Modèles Gemini Disponibles (v1) ---")
    for m in client.models.list():
        print(m)
except Exception as e:
    print(f"Erreur : {e}")
