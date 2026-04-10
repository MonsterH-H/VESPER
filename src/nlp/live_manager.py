import asyncio
import base64
import os
from typing import Optional

from google import genai
from google.genai.types import LiveConnectConfig, Modality
from dotenv import load_dotenv

load_dotenv()

class GeminiLiveManager:
    """
    Gestionnaire Multimodal Live Gemini 3.1 (Audio-to-Audio).
    Solution Premium de 2026.
    """
    def __init__(self, model_id="gemini-3.1-flash-live-preview"):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY is required for Live Session")
        
        # v1beta est requis pour Gemini 3.1 Live
        self.client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        self.model_id = model_id
        self.config = LiveConnectConfig(
            response_modalities=[Modality.AUDIO], # On reçoit de l'audio direct
            system_instruction="Tu es 'Vesper', un assistant vocal d'élite. Tu parles directement à l'utilisateur. Tes réponses sont courtes, élégantes et percutantes."
        )

    async def start_session(
        self,
        input_audio_queue: asyncio.Queue[Optional[bytes]],
        output_audio_queue: asyncio.Queue[Optional[bytes]],
    ) -> None:
        """
        Gère la session bidirectionnelle entre le client et Gemini Live.
        """
        print(f"🎙️ [LIVE] Démarrage de la session avec {self.model_id}...")
        
        try:
            async with self.client.aio.live.connect(model=self.model_id, config=self.config) as session:
                
                # Co-routine pour envoyer l'audio entrant
                async def send_audio():
                    while True:
                        audio_chunk = await input_audio_queue.get()
                        if audio_chunk is None: break
                        await session.send(input=audio_chunk, end_of_turn=False)
                
                # Co-routine pour recevoir l'audio sortant
                async def receive_audio():
                    async for response in session.receive():
                        # On vérifie si on a de l'audio
                        if response.server_content and response.server_content.model_turn:
                             for part in response.server_content.model_turn.parts:
                                 if part.inline_data:
                                     # On envoie l'audio brut (PCM) à la queue de sortie
                                     await output_audio_queue.put(part.inline_data.data)
                
                # Lancement simultané
                await asyncio.gather(send_audio(), receive_audio())
                
        except Exception as e:
            print(f"❌ Erreur Live Session : {e}")
            await output_audio_queue.put(None)
