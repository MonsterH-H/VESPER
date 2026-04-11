import os
from typing import Dict, List

from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class HFLLMManager:
    """
    Gestionnaire LLM Hugging Face via Inference Client.
    """
    def __init__(self, model_id: str = "microsoft/Phi-3-mini-4k-instruct") -> None:
        self.token = os.getenv("HF_TOKEN")
        if not self.token:
            raise EnvironmentError("HF_TOKEN is required for remote LLM")

        self.model_id = model_id
        self.client = InferenceClient(model=model_id, token=self.token)
        self.history: List[Dict[str, str]] = []
        print(f"Initialisation LLM cloud : {model_id} via InferenceClient")

    def build_prompt(self, user_input: str) -> str:
        system_msg = "Tu es un assistant vocal d'élite nommé 'Vesper'. Tes réponses sont courtes, élégantes et percutantes. Utilise un ton professionnel mais chaleureux."
        
        prompt = f"<|system|>\n{system_msg}<|end|>\n"
        
        for item in self.history[-6:]:
            role = "user" if item["role"] == "user" else "assistant"
            prompt += f"<|{role}|>\n{item['content']}<|end|>\n"
            
        prompt += f"<|user|>\n{user_input}<|end|>\n<|assistant|>\n"
        return prompt

    def generate_response(self, user_input: str) -> str:
        self.history.append({"role": "user", "content": user_input})
        prompt = self.build_prompt(user_input)

        print("Generation cloud en cours...")
        try:
            response_text = self.client.text_generation(
                prompt,
                max_new_tokens=250,
                temperature=0.7,
                top_p=0.9,
                stop_sequences=["<|end|>", "<|user|>", "<|system|>"]
            )
            
            response_text = response_text.strip()
            self.history.append({"role": "assistant", "content": response_text})
            return response_text
        except Exception as e:
            raise RuntimeError(f"HF InferenceClient LLM error: {e}")

    def clear_memory(self) -> None:
        self.history = []
