import os
from elevenlabs import ElevenLabs, play, save
from dotenv import load_dotenv

load_dotenv()

class ElevenLabsManager:
    """Service Text-to-Speech Premium avec ElevenLabs."""
    def __init__(self, voice_id="Rachel"):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.client = ElevenLabs(api_key=self.api_key)
        self.voice_id = voice_id

    def speak(self, text):
        """Génère et joue l'audio directement."""
        print(f"🗣️ Vocalisation : {text[:50]}...")
        try:
            audio = self.client.generate(
                text=text,
                voice=self.voice_id,
                model="eleven_multilingual_v2"
            )
            play(audio)
        except Exception as e:
            print(f"❌ Erreur ElevenLabs : {e}")

    def speak_to_file(self, text, filename):
        """Génère et sauvegarde l'audio."""
        print(f"💾 Sauvegarde vocale : {filename}")
        audio = self.client.generate(
            text=text,
            voice=self.voice_id,
            model="eleven_multilingual_v2"
        )
        save(audio, filename)
        return filename
