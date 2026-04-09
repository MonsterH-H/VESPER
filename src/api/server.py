from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
import sys
import time

# Ajout du chemin src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.assistant.core import AssistantCore

app = FastAPI()

# Autoriser CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant = None

@app.on_event("startup")
async def startup_event():
    global assistant
    print("⚡ Démarrage du serveur API...")
    assistant = AssistantCore()
    
    # Pré-chargement (Warmup) des clients cloud pour éviter la latence au 1er clic
    print("🔥 Warmup des modèles IA en cours...")
    _ = assistant.stt
    _ = assistant.llm
    print("✅ Serveur prêt et modèles pré-chargés !")

@app.get("/health")
async def health_check():
    """Endpoint de santé rapide - retourne immédiatement"""
    return {"status": "alive"}

@app.get("/status")
async def get_status():
    """Endpoint status - vérifie l'état du serveur"""
    if assistant is None:
        return {"status": "initializing", "model": "unknown"}
    return {"status": "online", "model": assistant.config.get('llm', {}).get('model')}

@app.post("/interact")
async def interact():
    try:
        start_time = time.time()
        print("🎤 Requête d'interaction reçue...")
        
        # Enregistrement audio intelligent (VAD)
        # S'arrête dès que l'utilisateur finit de parler (max 8s, silence 1.2s)
        assistant.recorder.record_to_file(assistant.temp_audio, duration=8, silence_duration=1.2)
        print(f"✅ Audio enregistré ({time.time()-start_time:.1f}s)")
        
        # Transcription STT
        print("🔄 Transcription en cours...")
        user_text = assistant.stt.transcribe(assistant.temp_audio)
        
        if not user_text or len(user_text.strip()) < 2:
            print("⚠️ Aucun son détecté ou trop court")
            return {"error": "Aucun son détecté. Parlez plus fort.", "user": "", "assistant": ""}
        
        print(f"👤 Texte détecté: {user_text}")
        
        # Génération LLM
        print("🧠 Génération de réponse...")
        assistant_response = assistant.llm.generate_response(user_text)
        print(f"🤖 Réponse générée: {assistant_response}")
        
        # TTS
        print("🔊 Synthèse vocale...")
        assistant.tts.speak(assistant_response)
        
        print(f"✅ Interaction complète en {time.time()-start_time:.2f}s!")
        return {
            "success": True,
            "user": user_text,
            "assistant": assistant_response,
            "history": assistant.llm.history[-10:] if hasattr(assistant.llm, 'history') else []
        }
    
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Erreur: {error_msg}")
        return {
            "success": False,
            "error": f"Erreur serveur: {error_msg}",
            "user": "",
            "assistant": ""
        }

@app.get("/api/models")
async def get_models():
    """Retourne les informations sur les modèles en usage"""
    return {
        "models": {
            "stt": assistant.config.get('stt', {}).get('model', 'openai/whisper-small'),
            "llm": assistant.config.get('llm', {}).get('model', 'microsoft/Phi-3-mini-4k-instruct'),
            "tts": "ElevenLabs",
            "voice": assistant.config.get('tts', {}).get('elevenlabs', {}).get('voice_id', 'Rachel')
        },
        "loaded": {
            "stt": assistant._stt is not None,
            "llm": assistant._llm is not None,
            "tts": assistant._tts is not None
        }
    }

@app.get("/api/voices")
async def get_voices():
    """Récupère la liste des voix disponibles via ElevenLabs"""
    if assistant is None:
        return {"voices": []}
    return {"voices": assistant.tts.get_voices()}

@app.post("/api/settings")
async def update_settings(settings: dict):
    """Met à jour la configuration du serveur"""
    try:
        assistant.update_config(settings)
        return {"success": True, "message": "Configuration mise à jour"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/config")
async def get_config():
    """Retourne la configuration actuelle"""
    return {
        "audio": assistant.config.get('audio', {}),
        "stt": assistant.config.get('stt', {}),
        "llm": assistant.config.get('llm', {}),
        "tts": assistant.config.get('tts', {})
    }

# Servir l'UI - doit être après les routes de l'API pour ne pas les masquer
app.mount("/", StaticFiles(directory="src/ui", html=True), name="ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
