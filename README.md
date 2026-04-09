# 🎙️ Learn Audio — Projet IA Audio & Assistant Vocal

Projet d'apprentissage dédié au traitement audio et à la construction d'un assistant vocal intelligent avec Python.

---

## 📁 Structure du Projet

```
learn_audio/
├── data/                   # Données brutes et traitées
├── notebooks/              # Jupyter Notebooks d'exploration
├── src/                    # Code source principal
│   ├── audio/              # Capture et analyse audio
│   ├── stt/                # Speech-to-Text
│   ├── tts/                # Text-to-Speech
│   ├── nlp/                # NLP
│   ├── elevenlabs/         # Intégrations ElevenLabs (API, Creative, Agents)
│   ├── assistant/          # Logique de l'assistant
│   └── utils/              # Utilitaires
├── models/                 # Modèles locaux
├── tests/                  # Tests unitaires
├── scripts/                # Scripts d'exécution
├── configs/                # Configuration YAML/JSON
├── .env.example            # Template variables d'environnement
├── requirements.txt        # Dépendances
└── README.md
```

---

## 🧪 Intégration ElevenLabs & Hugging Face

Ce projet combine les meilleures IA du marché :

- **Whisper (Hugging Face)** : Pour une reconnaissance vocale (STT) ultra-précise.
- **Llama / Mistral / Phi-3 (Hugging Face)** : Pour un cerveau LLM local puissant ou via API.
- **ElevenLabs API** : Pour la synthèse vocale (TTS) la plus naturelle au monde.
- **ElevenAgents** : Pour l'orchestration avancée d'agents conversationnels.

---

## 🏗️ Pipeline Assistant Vocal

Le flux de données est le suivant :
1. **Micro** → `STTManager` (Whisper) → **Texte**
2. **Texte** → `HFLLMManager` (LLM) → **Réponse**
3. **Réponse** → `ElevenLabsManager` (TTS) → **Voix**


---

## 🚀 Démarrage Rapide

```bash
# Activer l'environnement virtuel
.\venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt



Nous utilisons les modèles les plus performants disponibles sur Hugging Face :

- **STT** : `openai/whisper-small` (ou `large-v3` pour la précision maximale).
- **LLM** : `microsoft/Phi-3-mini-4k-instruct` (léger et puissant) ou `mistralai/Mistral-7B-Instruct-v0.2`.
- **TTS** : Intégration ElevenLabs via API pour dépasser la qualité des modèles locaux.

---

| Module | Description | Technologies |
|--------|-------------|--------------|
| `audio` | Capture, lecture, analyse spectrale | `librosa`, `sounddevice`, `pydub` |
| `stt` | Transcription parole → texte | `whisper`, `speechrecognition` |
| `tts` | Synthèse texte → parole | `ElevenLabs API`, `gTTS` |
| `elevenlabs` | Creative, Agents et API ElevenLabs | `elevenlabs-python` |
| `nlp` | Compréhension des intentions | `transformers`, `spacy` |
| `assistant` | Orchestration complète | Custom pipeline / ElevenAgents |

---

## 📚 Parcours d'Apprentissage

1. **Bases audio** → Lecture, visualisation, FFT, spectrogrammes
2. **STT** → Whisper, reconnaissance en temps réel
3. **TTS** → Voix naturelles, contrôle de la cadence/ton
4. **NLP** → Intent detection, entités nommées
5. **Assistant** → Pipeline complet Wake Word → STT → NLP → Action → TTS

---

## ⚙️ Configuration

Copier `.env.example` en `.env` et remplir les clés API nécessaires.
