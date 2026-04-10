import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")
client = ElevenLabs(api_key=api_key)

try:
    voices = client.voices.get_all()
    print("--- Liste des Voix Disponibles ---")
    for v in voices.voices:
        print(f"ID: {v.voice_id} | Name: {v.name} | Category: {v.category}")
except Exception as e:
    print(f"Erreur : {e}")
