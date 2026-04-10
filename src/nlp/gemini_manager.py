import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

class GeminiLLMManager:
    """
    Gestionnaire LLM Google Gemini (via SDK google-genai).
    Prend en charge le texte et l'audio natif.
    """
    def __init__(self, model_id="gemini-2.5-pro"):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY is required")
        
        # Pour les modèles stables en 2026 (2.5), on utilise la v1
        self.client = genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
        self.model_id = model_id
        self.history = []
        print(f"✨ Initialisation Gemini 2.5 PRO (V2 SDK) : {model_id}")

    def generate_response(self, user_input, audio_path=None, retry_count=2):
        """
        Génère une réponse avec gestion automatique de la surcharge (Error 503).
        """
        system_instruction = "Tu es 'Vesper', un assistant vocal d'élite. Tu es élégant, poli, percutant et très intelligent. Réponds de façon concise (max 2-3 phrases)."
        
        try:
            contents = []
            if audio_path:
                print(f"🎙️ [GEMINI NATIVE] Envoi audio à Gemini...")
                # On utilise une logique d'upload résiliente
                myfile = self.client.files.upload(file=audio_path)
                contents = [myfile, user_input if user_input else "Réponds à l'utilisateur."]
            else:
                contents = [user_input]

            # Tentative de génération avec retry pour les erreurs 503
            for attempt in range(retry_count + 1):
                try:
                    response = self.client.models.generate_content(
                        model=self.model_id,
                        contents=contents,
                        config={'system_instruction': system_instruction}
                    )
                    response_text = response.text.strip()
                    self.history.append({"role": "user", "content": user_input if user_input else "[AUDIO]"})
                    self.history.append({"role": "assistant", "content": response_text})
                    return response_text
                except Exception as ex:
                    if "503" in str(ex) and attempt < retry_count:
                        wait = (attempt + 1) * 2
                        print(f"⏳ Gemini surchargé (503). Nouvel essai dans {wait}s...")
                        time.sleep(wait)
                        continue
                    # Si on a épuisé les retries sur le modèle 2.5, on tente un repli sur 1.5
                    if "503" in str(ex) and self.model_id != "gemini-1.5-flash":
                        print("🔄 Repli d'urgence sur Gemini 1.5 Flash...")
                        self.model_id = "gemini-1.5-flash"
                        return self.generate_response(user_input, audio_path, retry_count=0)
                    raise ex

        except Exception as e:
            print(f"❌ Erreur Gemini V2 SDK : {e}")
            if audio_path:
                return "Le moteur IA est actuellement très sollicité. Pouvez-vous me redemander dans un instant ?"
            raise e

    def clear_memory(self):
        self.history = []
