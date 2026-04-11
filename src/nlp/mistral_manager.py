import os
from mistralai.client import Mistral
from dotenv import load_dotenv

load_dotenv()

class MistralLLMManager:
    """
    Gestionnaire LLM Mistral AI via API Mistral.
    """
    def __init__(self, model_id="mistral-small-latest"):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise EnvironmentError("MISTRAL_API_KEY is required for Mistral models")

        self.client = Mistral(api_key=api_key)
        self.model_id = model_id
        self.history = []
        print(f"Initialisation Mistral : {model_id}")

    def build_messages(self, user_input):
        system_msg = "Tu es un assistant vocal d'élite nommé 'Vesper'. Tes réponses sont courtes, élégantes et percutantes. Utilise un ton professionnel mais chaleureux."
        
        messages = [{"role": "system", "content": system_msg}]
        
        for item in self.history[-10:]:
            messages.append(item)
            
        messages.append({"role": "user", "content": user_input})
        return messages

    def generate_response(self, user_input):
        print(f"Mistral reflechit ({self.model_id})...")
        
        messages = self.build_messages(user_input)
        
        try:
            response = self.client.chat.complete(
                model=self.model_id,
                messages=messages,
                max_tokens=250,
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content.strip()
            self.history.append({"role": "user", "content": user_input})
            self.history.append({"role": "assistant", "content": response_text})
            return response_text
        except Exception as e:
            print(f"Erreur Mistral : {e}")
            raise RuntimeError(f"Mistral API error: {e}")

    def clear_memory(self):
        self.history = []
