import os
from typing import Any, Dict, List

from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class STTManager:
    """Service Speech-to-Text utilisant HuggingFace Inference Client."""
    def __init__(self, model_id: str = "openai/whisper-small") -> None:
        self.token = os.getenv("HF_TOKEN")
        if not self.token:
            raise EnvironmentError("HF_TOKEN is required for remote STT")
        self.model_id = model_id
        self.client = InferenceClient(model=model_id, token=self.token)
        print(f"Initialisation STT cloud : {model_id} via InferenceClient")

    def transcribe(self, audio_file: str) -> str:
        print(f"Transcription de {audio_file} via InferenceClient...")
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file introuvable: {audio_file}")

        try:
            with open(audio_file, "rb") as f:
                audio_data = f.read()
            
            if len(audio_data) < 1000:
                raise ValueError("Audio trop court ou vide.")
                
            # automatic_speech_recognition est le task specifique pour Whisper
            result = self.client.automatic_speech_recognition(audio_data)
            
            if isinstance(result, dict):
                return (result.get("text") or "").strip()
            return str(result).strip()
            
        except Exception as e:
            error_details = getattr(e, 'response', None)
            if error_details and hasattr(error_details, 'text'):
                raise RuntimeError(f"STT InferenceClient error ({type(e).__name__}): {error_details.text}")
            raise RuntimeError(f"STT InferenceClient error ({type(e).__name__}): {str(e)}")
