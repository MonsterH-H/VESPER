import os
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv

load_dotenv()

class OpenRouterManager:
    """Gestionnaire LLM OpenRouter via API REST."""

    def __init__(self, model_id: str = "gpt-4o-mini") -> None:
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise EnvironmentError("OPENROUTER_API_KEY is required for OpenRouter")

        self.model_id = model_id
        base_url = os.getenv("OPENROUTER_API_BASE_URL", "https://openrouter.ai/v1")
        self.endpoint = f"{base_url}/chat/completions"
        self.history: List[Dict[str, str]] = []
        print(f"🚀 Initialisation OpenRouter : {model_id} via {base_url}")

    def generate_response(self, user_input: str) -> str:
        system_prompt = (
            "Tu es un assistant vocal d'élite nommé 'Vesper'. "
            "Réponds de manière concise, professionnelle et chaleureuse."
        )

        payload: Dict[str, Any] = {
            "model": self.model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input or "Réponds à l'utilisateur."}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        print("🤖 Envoi à OpenRouter...")
        response = requests.post(self.endpoint, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            raise RuntimeError(f"OpenRouter API error {response.status_code}: {response.text}")

        result = response.json()
        choice = None
        if isinstance(result, dict):
            choices = result.get("choices", [])
            if choices and isinstance(choices, list):
                choice = choices[0]

        if not choice:
            raise RuntimeError("OpenRouter response contains no choices")

        message = choice.get("message") if isinstance(choice, dict) else None
        response_text = ""

        if isinstance(message, dict):
            content = message.get("content")
            if isinstance(content, str):
                response_text = content
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "output_text":
                        response_text = part.get("text", "")
                        break
        elif isinstance(choice, dict):
            response_text = choice.get("text", "") or ""

        response_text = response_text.strip()
        self.history.append({"role": "user", "content": user_input})
        self.history.append({"role": "assistant", "content": response_text})
        return response_text

    def clear_memory(self) -> None:
        self.history = []
