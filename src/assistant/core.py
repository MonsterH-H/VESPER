import os
import time
from typing import Any, Dict, Optional

from src.utils.config_loader import load_config, save_config
from src.audio.recorder import AudioRecorder
from src.stt.whisper_manager import STTManager
from src.nlp.hf_manager import HFLLMManager
from src.nlp.gemini_manager import GeminiLLMManager
from src.nlp.mistral_manager import MistralLLMManager
from src.elevenlabs.wrapper import ElevenLabsManager

class AssistantCore:
    """
    Orchestrateur central piloté par configuration.
    Fait le lien entre le micro, Whisper, HuggingFace et ElevenLabs.
    Utilise lazy loading pour les modèles lourds.
    """
    def __init__(self):
        # 1. Charger la config
        self.config: Dict[str, Any] = load_config()
        
        print("🔧 Initialisation rapide du système...")
        
        # Audio (léger)
        audio_cfg = self.config.get('audio', {})
        self.recorder: AudioRecorder = AudioRecorder(
            samplerate=audio_cfg.get('samplerate', 16000),
            channels=audio_cfg.get('channels', 1)
        )
        self.default_duration: int = audio_cfg.get('default_duration', 5)
        
        # Services lourds : lazy loading
        self._stt: Optional[STTManager] = None
        self._llm: Optional[Any] = None
        self._tts: Optional[ElevenLabsManager] = None
        
        # Chemins
        self.temp_audio = "data/raw/input.wav"
        os.makedirs("data/raw", exist_ok=True)
    
    def update_config(self, new_config: Dict[str, Any]) -> None:
        """Met à jour la configuration et la sauvegarde."""
        self.config.update(new_config)
        save_config(self.config)
        
        # Mise à jour immédiate de certains paramètres non-modulaires
        if 'audio' in new_config and 'default_duration' in new_config['audio']:
            self.default_duration = new_config['audio']['default_duration']
            
        # Réinitialiser les pointers pour forcer le re-lazy-load avec les nouvelles configs
        self.reload_models()

    def reload_models(self) -> None:
        """Force le rechargement des modèles au prochain appel."""
        print("🔄 Rechargement des modèles IA planifié...")
        self._stt = None
        self._llm = None
        self._tts = None
    
    @property
    def stt(self) -> STTManager:
        """Lazy load STT (Whisper)"""
        if self._stt is None:
            print("👂 Initialisation des oreilles : openai/whisper-small")
            stt_cfg = self.config.get('stt', {})
            self._stt = STTManager(model_id=stt_cfg.get('model', 'openai/whisper-small'))
        return self._stt
    
    @property
    def llm(self) -> Any:
        """Lazy load LLM (Hugging Face, Gemini ou Mistral)"""
        if self._llm is None:
            llm_cfg = self.config.get('llm', {})
            provider = llm_cfg.get('provider', 'hf')
            model_id = llm_cfg.get('model', 'microsoft/Phi-3-mini-4k-instruct')
            
            print(f"🧠 Initialisation du cerveau IA (Provider: {provider}, Modèle: {model_id})")
            
            if provider == 'gemini':
                self._llm = GeminiLLMManager(model_id=model_id)
            elif provider == 'mistral':
                self._llm = MistralLLMManager(model_id=model_id)
            else: # hf par défaut
                self._llm = HFLLMManager(model_id=model_id)
                
        return self._llm
    
    @property
    def tts(self) -> ElevenLabsManager:
        """Lazy load TTS (ElevenLabs)"""
        if self._tts is None:
            print("🔊 Initialisation de la voix")
            tts_cfg = self.config.get('tts', {}).get('elevenlabs', {})
            self._tts = ElevenLabsManager(voice_id=tts_cfg.get('voice_id', 'Rachel'))
        return self._tts

    @property
    def loaded(self) -> Dict[str, bool]:
        """State of lazy-loaded model clients."""
        return {
            "stt": self._stt is not None,
            "llm": self._llm is not None,
            "tts": self._tts is not None,
        }

    def process_interaction(self, audio_path: str) -> tuple[str, str]:
        """
        Génère une réponse complète de l'assistant à partir d'un fichier audio.
        Si Gemini est actif, utilise l'audio directement (Premium Native).
        Sinon, utilise Whisper -> LLM (Standard).
        """
        start_time = time.time()
        provider = self.config.get('llm', {}).get('provider', 'hf')
        user_text = ""

        if provider == "gemini":
            print("🚀 [PREMIUM] Mode Native Audio Gemini activé...")
            # Gemini peut analyser l'audio directement
            response = self.llm.generate_response("", audio_path=audio_path)
            # Puisqu'on n'a pas utilisé STT, on demande à Gemini de résumer ce qu'il a entendu (optionnel)
            # Mais pour la vitesse on s'en passe
            user_text = "[Audio Native Gemini]"
        else:
            # Mode standard : STT d'abord
            user_text = self.stt.transcribe(audio_path)
            if not user_text or len(user_text) < 2:
                raise ValueError("Aucun son détecté.")
            print(f"👤 Utilisateur (STT): {user_text}")
            response = self.llm.generate_response(user_text)

        print(f"🤖 Assistant: {response} (Total: {time.time()-start_time:.1f}s)")
        return user_text, response

    def process_cycle(self):
        """Boucle CLI classique."""
        print(f"\n✨ [PRÊT] - {self.default_duration}s...")
        self.recorder.record_to_file(self.temp_audio, duration=self.default_duration)
        
        try:
            _, response = self.process_interaction(self.temp_audio)
            self.tts.speak(response, play_on_server=True)
        except Exception as e:
            print(f"⚠️ {e}")

    def start(self):
        print("\n" + "="*40)
        print("🚀 ASSISTANT VOCAL PREMIUM DÉMARRÉ")
        print("Modèle LLM : " + self.config.get('llm', {}).get('model', 'Default'))
        print("Modèle STT : " + self.config.get('stt', {}).get('model', 'Default'))
        print("="*40)
        
        try:
            while True:
                self.process_cycle()
        except KeyboardInterrupt:
            print("\n👋 Extinction de l'assistant...")
        except Exception as e:
            print(f"\n❌ Erreur fatale : {e}")
