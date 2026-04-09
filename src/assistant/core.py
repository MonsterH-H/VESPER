import os
import time
from src.utils.config_loader import load_config
from src.audio.recorder import AudioRecorder
from src.stt.whisper_manager import STTManager
from src.nlp.hf_manager import HFLLMManager
from src.elevenlabs.wrapper import ElevenLabsManager

class AssistantCore:
    """
    Orchestrateur central piloté par configuration.
    Fait le lien entre le micro, Whisper, HuggingFace et ElevenLabs.
    Utilise lazy loading pour les modèles lourds.
    """
    def __init__(self):
        # 1. Charger la config
        self.config = load_config()
        
        print("🔧 Initialisation rapide du système...")
        
        # Audio (léger)
        audio_cfg = self.config.get('audio', {})
        self.recorder = AudioRecorder(
            samplerate=audio_cfg.get('samplerate', 16000),
            channels=audio_cfg.get('channels', 1)
        )
        self.default_duration = audio_cfg.get('default_duration', 5)
        
        # Services lourds : lazy loading
        self._stt = None
        self._llm = None
        self._tts = None
        
        # Chemins
        self.temp_audio = "data/raw/input.wav"
        os.makedirs("data/raw", exist_ok=True)
    
    @property
    def stt(self):
        """Lazy load STT (Whisper)"""
        if self._stt is None:
            print("👂 Initialisation des oreilles : openai/whisper-small")
            stt_cfg = self.config.get('stt', {})
            self._stt = STTManager(model_id=stt_cfg.get('model', 'openai/whisper-small'))
        return self._stt
    
    @property
    def llm(self):
        """Lazy load LLM (Hugging Face)"""
        if self._llm is None:
            print("🧠 Initialisation du cerveau IA")
            llm_cfg = self.config.get('llm', {})
            self._llm = HFLLMManager(model_id=llm_cfg.get('model', 'microsoft/Phi-3-mini-4k-instruct'))
        return self._llm
    
    @property
    def tts(self):
        """Lazy load TTS (ElevenLabs)"""
        if self._tts is None:
            print("🔊 Initialisation de la voix")
            tts_cfg = self.config.get('tts', {}).get('elevenlabs', {})
            self._tts = ElevenLabsManager(voice_id=tts_cfg.get('voice_id', 'Rachel'))
        return self._tts

    def process_cycle(self):
        """Exécute une boucle complète d'interaction vocale."""
        print(f"\n✨ [PRÊT] - Parlez pendant {self.default_duration}s...")
        
        # PHASE 1 : Capture
        self.recorder.record_to_file(self.temp_audio, duration=self.default_duration)
        
        # PHASE 2 : Transcription (STT)
        start_time = time.time()
        text = self.stt.transcribe(self.temp_audio)
        if not text or len(text) < 2:
            print("🔇 Silence ou audio non interprété.")
            return
        
        print(f"👤 Utilisateur : {text} (Transcription en {time.time()-start_time:.1f}s)")
        
        # PHASE 3 : Intelligence (LLM)
        start_time = time.time()
        response = self.llm.generate_response(text)
        print(f"🤖 Assistant : {response} (Réflexion en {time.time()-start_time:.1f}s)")
        
        # PHASE 4 : Vocalisation (TTS)
        self.tts.speak(response)

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
