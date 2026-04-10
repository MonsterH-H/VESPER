import os
import requests
from dotenv import load_dotenv

load_dotenv()

class STTManager:
    """Service Speech-to-Text utilisant HuggingFace Inference API."""
    def __init__(self, model_id="openai/whisper-small"):
        self.token = os.getenv("HF_TOKEN")
        if not self.token:
            raise EnvironmentError("HF_TOKEN is required for remote STT")
        self.model_id = model_id
        base_url = os.getenv("HF_API_BASE_URL", "https://router.huggingface.co")
        self.endpoint = f"{base_url}/models/{model_id}"
        print(f"👂 Initialisation STT cloud : {model_id} via {base_url}")

    def transcribe(self, audio_file):
        print(f"🔍 Transcription de {audio_file} via HuggingFace API...")
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file introuvable: {audio_file}")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json"
        }
        with open(audio_file, "rb") as f:
            response = requests.post(self.endpoint, headers=headers, files={"file": f}, timeout=60)

        if response.status_code != 200:
            raise RuntimeError(
                f"STT API error {response.status_code} for endpoint {self.endpoint}: {response.text}"
            )

        result = response.json()
        
        # Gestion des formats de réponse variés
        if isinstance(result, list) and len(result) > 0:
            text = result[0].get("text") or result[0].get("generated_text") or ""
        elif isinstance(result, dict):
            text = result.get("text") or result.get("generated_text") or ""
        else:
            text = ""
            
        return text.strip()
