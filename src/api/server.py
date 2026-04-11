from contextlib import asynccontextmanager
from typing import Any, Dict, Optional, cast

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import sys
import asyncio
import base64
import json
import time

# Ajout du chemin src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.assistant.core import AssistantCore
from src.nlp.live_manager import GeminiLiveManager

assistant: Optional[AssistantCore] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global assistant
    print("Demarrage du serveur API...")
    assistant = AssistantCore()
    
    # Pré-chargement (Warmup) des clients cloud pour éviter la latence au 1er clic
    print("Warmup des modèles IA en cours...")
    _ = assistant.stt
    _ = assistant.llm
    print("Serveur prêt et modèles pré-chargés !")

    yield

app = FastAPI(lifespan=lifespan)

# Autoriser CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant: Optional[AssistantCore] = None

@app.get("/health")
async def health_check():
    """Endpoint de santé rapide - retourne immédiatement"""
    return {"status": "alive"}

@app.get("/status")
async def get_status() -> Dict[str, str]:
    """Endpoint status - vérifie l'état du serveur"""
    if assistant is None:
        return {"status": "initializing", "model": "unknown"}
    return {"status": "online", "model": assistant.config.get('llm', {}).get('model', 'unknown')}

@app.post("/interact")
async def interact(file: UploadFile = File(None)) -> Dict[str, Any]:
    if assistant is None:
        return {"success": False, "error": "Assistant not initialized", "user": "", "assistant": ""}

    try:
        start_time = time.time()
        print("Requête d'interaction reçue...")
        
        # Si un fichier est envoyé par le client (Browser), on l'utilise.
        # Sinon, on enregistre depuis le micro du serveur (Défaut CLI).
        if file:
            print(f"Réception audio du client ({file.filename})...")
            with open(assistant.temp_audio, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            print(f"Audio client sauvegardé ({len(content)} bytes)")
        else:
            print("Enregistrement depuis le micro serveur...")
            assistant.recorder.record_to_file(assistant.temp_audio, duration=8, silence_duration=1.2)
            print(f"Audio enregistré ({time.time()-start_time:.1f}s)")
        
        # Traitement intelligent (Gemini Audio Native ou Standard) via AssistantCore
        user_text, assistant_response = assistant.process_interaction(assistant.temp_audio)
        
        # Synthèse vocale pour le client (Base64 pour le Web)
        print("Synthèse vocale ElevenLabs...")
        audio_bytes: Optional[bytes] = assistant.tts.get_audio_bytes(assistant_response)
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
        
        print(f"Interaction complète en {time.time()-start_time:.2f}s!")
        return {
            "success": True,
            "user": user_text,
            "assistant": assistant_response,
            "audio": audio_base64,
            "history": assistant.llm.history[-10:] if hasattr(assistant.llm, 'history') else []
        }
    
    except Exception as e:
        error_msg = str(e)
        print(f"Erreur: {error_msg}")
        return {
            "success": False,
            "error": f"Erreur serveur: {error_msg}",
            "user": "",
            "assistant": ""
        }

@app.get("/api/models")
async def get_models() -> Dict[str, Any]:
    """Retourne les informations sur les modèles en usage"""
    if assistant is None:
        return {
            "models": {
                "stt": "openai/whisper-small",
                "llm": "microsoft/Phi-3-mini-4k-instruct",
                "llm_provider": "hf",
                "tts": "ElevenLabs",
                "voice": "Rachel"
            },
            "loaded": {"stt": False, "llm": False, "tts": False}
        }

    return {
        "models": {
            "stt": assistant.config.get('stt', {}).get('model', 'openai/whisper-small'),
            "llm": assistant.config.get('llm', {}).get('model', 'microsoft/Phi-3-mini-4k-instruct'),
            "llm_provider": assistant.config.get('llm', {}).get('provider', 'hf'),
            "tts": "ElevenLabs",
            "voice": assistant.config.get('tts', {}).get('elevenlabs', {}).get('voice_id', 'Rachel')
        },
        "loaded": assistant.loaded
    }

@app.get("/api/voices")
async def get_voices() -> Dict[str, Any]:
    """Récupère la liste des voix disponibles via ElevenLabs"""
    if assistant is None:
        return {"voices": []}
    return {"voices": cast(Any, assistant.tts.get_voices())}

@app.post("/api/settings")
async def update_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    """Met à jour la configuration du serveur"""
    if assistant is None:
        return {"success": False, "error": "Assistant not initialized"}

    try:
        assistant.update_config(settings)
        return {"success": True, "message": "Configuration mise à jour"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/config")
async def get_config() -> Dict[str, Any]:
    """Retourne la configuration actuelle"""
    if assistant is None:
        return {"audio": {}, "stt": {}, "llm": {}, "tts": {}}

    return {
        "audio": assistant.config.get('audio', {}),
        "stt": assistant.config.get('stt', {}),
        "llm": assistant.config.get('llm', {}),
        "tts": assistant.config.get('tts', {})
    }

@app.websocket("/ws/audio")
async def websocket_audio(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Client connecté en WebSocket temps-réel")
    
    live_manager = GeminiLiveManager()
    input_queue: asyncio.Queue[Optional[bytes]] = asyncio.Queue()
    output_queue: asyncio.Queue[Optional[bytes]] = asyncio.Queue()

    # Tâche : Recevoir l'audio du navigateur (Base64) et le mettre en queue
    async def receive_from_client():
        try:
            while True:
                data = await websocket.receive_text()
                # Parse JSON if needed or handle raw text
                msg = json.loads(data)
                if msg.get("type") == "audio" and msg.get("data"):
                    # On convertit le base64 en bytes PCM
                    audio_bytes = base64.b64decode(msg["data"])
                    await input_queue.put(audio_bytes)
                elif msg.get("type") == "end":
                    await input_queue.put(None)
                    break
        except WebSocketDisconnect:
            print("❌ Client déconnecté")
            await input_queue.put(None)

    # Tâche : Recevoir l'audio de Gemini (PCM brute) et l'envoyer au navigateur
    async def send_to_client():
        try:
            while True:
                audio_chunk = await output_queue.get()
                if audio_chunk is None:
                    break
                # On envoie l'audio encodé en base64 au navigateur
                await websocket.send_text(json.dumps({
                    "type": "audio",
                    "data": base64.b64encode(audio_chunk).decode('utf-8')
                }))
        except Exception as e:
            print(f"❌ Erreur envoi client : {e}")

    # Lancement du moteur de session
    try:
        await asyncio.gather(
            receive_from_client(),
            send_to_client(),
            live_manager.start_session(input_queue, output_queue)
        )
    except Exception as e:
        print(f"❌ Erreur WebSocket Loop : {e}")
    finally:
        print("🛑 Session WebSocket terminée.")

# Servir l'UI
app.mount("/", StaticFiles(directory="src/ui", html=True), name="ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
