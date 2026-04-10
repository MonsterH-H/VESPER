import os
from typing import Any, Dict, List, Optional
from elevenlabs import ElevenLabs, play, save
from dotenv import load_dotenv

load_dotenv()

class ElevenLabsManager:
    """Service Text-to-Speech Premium avec ElevenLabs."""
    def __init__(self, voice_id: str = "Rachel") -> None:
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.client = ElevenLabs(api_key=self.api_key)
        self.voice_id = voice_id

    def get_voices(self) -> List[Dict[str, str]]:
        """Récupère la liste des voix disponibles."""
        try:
            voices = self.client.voices.get_all()
            return [{"id": v.voice_id, "name": v.name, "category": v.category} for v in voices.voices]
        except Exception as e:
            print(f"❌ Erreur récupération voix : {e}")
            return [{"id": "Rachel", "name": "Rachel (Défaut)", "category": "premade"}]

    def speak(self, text: str, play_on_server: bool = False) -> Any:
        """Génère et joue l'audio. play_on_server=True pour le mode CLI."""
        print(f"🗣️ Vocalisation : {text[:50]}...")
        try:
            audio = self.client.text_to_speech.convert(
                text=text,
                voice_id=self.voice_id,
                model_id="eleven_multilingual_v2"
            )
            if play_on_server:
                play(audio)
            return audio
        except Exception as e:
            print(f"❌ Erreur ElevenLabs : {e}")
            return None

    def get_audio_bytes(self, text: str) -> Optional[bytes]:
        """Génère l'audio et retourne les bytes pour le streaming Web."""
        try:
            return self._generate_with_fallback(text)
        except Exception as e:
            print(f"❌ Erreur ElevenLabs Bytes : {e}")
            return None

    def _generate_with_fallback(self, text: str, voice_id: Optional[str] = None) -> Optional[bytes]:
        """Tente de générer l'audio avec un repli automatique si la voix échoue."""
        target_voice = voice_id or self.voice_id
        try:
            audio_gen = self.client.text_to_speech.convert(
                text=text,
                voice_id=target_voice,
                model_id="eleven_multilingual_v2"
            )
            return b"".join(list(audio_gen))
        except Exception as e:
            # Si la voix n'est pas trouvée ou interdite (402/404), on cherche une voix de secours
            if "voice_not_found" in str(e) or "payment_required" in str(e):
                print(f"⚠️ Voix '{target_voice}' indisponible. Recherche d'une voix de secours...")
                available_voices = self.get_voices()
                # On prend la première voix 'premade' disponible
                fallback = next((v['id'] for v in available_voices if v['category'] == 'premade'), None)
                if fallback and fallback != target_voice:
                    print(f"🔄 Repli sur la voix : {fallback}")
                    return self._generate_with_fallback(text, voice_id=fallback)
            raise e

    def speak_to_file(self, text: str, filename: str) -> str:
        """Génère et sauvegarde l'audio."""
        print(f"💾 Sauvegarde vocale : {filename}")
        audio_gen = self.client.text_to_speech.convert(
            text=text,
            voice_id=self.voice_id,
            model_id="eleven_multilingual_v2"
        )
        save(audio_gen, filename)
        return filename
