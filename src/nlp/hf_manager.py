import os
from typing import Any, Dict, List, cast

import requests
from dotenv import load_dotenv

load_dotenv()

class HFLLMManager:
    """
    Gestionnaire LLM Hugging Face via Inference API.
    """
    def __init__(self, model_id: str = "microsoft/Phi-3-mini-4k-instruct") -> None:
        self.token = os.getenv("HF_TOKEN")
        if not self.token:
            raise EnvironmentError("HF_TOKEN is required for remote LLM")

        self.model_id = model_id
        base_url = os.getenv("HF_API_BASE_URL", "https://router.huggingface.co")
        self.endpoint = f"{base_url}/models/{model_id}"
        self.history: List[Dict[str, str]] = []
        print(f"🧠 Initialisation LLM cloud : {model_id} via {base_url}")

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

        payload: Dict[str, Any] = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 250,
                "temperature": 0.7,
                "top_p": 0.9,
                "return_full_text": False,
                "stop": ["<|end|>", "<|user|>", "<|system|>"]
            }
        }

        headers: Dict[str, str] = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        print("🤔 Génération cloud en cours...")
        response = requests.post(self.endpoint, headers=headers, json=payload)
        if response.status_code != 200:
            raise RuntimeError(f"LLM API error {response.status_code}: {response.text}")

        result: Any = response.json()
        generated_text: str = ""

        if isinstance(result, dict):
            response_dict = cast(Dict[str, Any], result)
            if response_dict.get("error"):
                raise RuntimeError(response_dict["error"])
            generated_text = response_dict.get("generated_text", "") or ""
        elif isinstance(result, list) and result and isinstance(result[0], dict):
            response_items = cast(List[Dict[str, Any]], result)
            generated_text = response_items[0].get("generated_text", "") or ""
        else:
            raise RuntimeError("Unexpected response format from LLM API")

        response_text: str = generated_text.strip()
        self.history.append({"role": "assistant", "content": response_text})
        return response_text

    def clear_memory(self) -> None:
        self.history = []
