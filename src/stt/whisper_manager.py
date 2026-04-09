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
        self.endpoint = f"https://api-inference.huggingface.co/models/{model_id}"
        print(f"👂 Initialisation STT cloud : {model_id}")

    def transcribe(self, audio_file):
        print(f"🔍 Transcription de {audio_file} via HuggingFace API...")
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file introuvable: {audio_file}")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json"
        }
        with open(audio_file, "rb") as f:
            response = requests.post(self.endpoint, headers=headers, data=f)

        if response.status_code != 200:
            raise RuntimeError(f"STT API error {response.status_code}: {response.text}")

        result = response.json()
        text = result.get("text") or result.get("generated_text") or ""
        return text.strip()
