// --- Configuration & State ---
const API_URL = 'http://localhost:8000';

const state = {
    currentRoute: 'home',
    isListening: false,
    activeModel: 'Initialisation...',
    activeVoice: 'Rachel',
    systemStatus: 'Prêt',
    chatHistory: [
        { role: 'bot', text: 'Système initialisé. Bienvenue sur Vesper.' }
    ],
    availableVoices: [],
    settings: {
        stt: 'openai/whisper-large-v3-turbo',
        llm: 'gemini-2.0-flash-exp',
        llm_provider: 'gemini',
        temperature: 0.7,
        maxTokens: 256,
        duration: 5,
        isLive: false
    }
};

// --- View Templates ---
const Views = {
    home: `
        <section class="core-stage">
            <div class="status-ring"></div>
            <div class="orb-portal">
                <canvas id="frequency-bars" class="visualizer-canvas"></canvas>
                <div id="visualizer" class="orb"></div>
            </div>
            <div class="interaction-bar">
                <p id="status-label" class="status-label">PRÊT</p>
                <div class="action-group" style="display: flex; gap: 1rem;">
                    <button id="activate-btn" class="action-btn">
                        <i data-lucide="mic"></i>
                        <span>Interagir (Standard)</span>
                    </button>
                    <button id="live-btn" class="action-btn premium-btn" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); color: white;">
                        <i data-lucide="zap"></i>
                        <span>Live Alpha v2.5</span>
                    </button>
                </div>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header">
                <h3>Historique</h3>
            </div>
            <div id="chat-history" class="messages">
                <!-- Messages will be injected here -->
            </div>
        </aside>
    `,
    history: `
        <div class="view-container" style="padding: 2rem;">
            <header class="content-header" style="text-align: left; margin-bottom: 2rem;">
                <h2 style="font-size: 1.5rem; letter-spacing: -1px;">Historique des Échanges</h2>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn-play" onclick="clearHistory()" style="font-size: 0.65rem; padding: 4px 12px;">Effacer</button>
                    <button class="btn-play" onclick="exportHistory()" style="font-size: 0.65rem; padding: 4px 12px;">Exporter</button>
                </div>
            </header>
            <div id="full-history-timeline" class="history-timeline" style="display: flex; flex-direction: column; gap: 1rem;">
                <!-- Timeline injectée -->
            </div>
        </div>
    `,
    models: `
        <section class="core-stage">
            <div class="content-header" style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.25rem;">🧠 Architecture IA 2026</h2>
                <p style="font-size: 0.75rem;">Optimisé pour gemini-2.5-flash-live</p>
            </div>
            <div class="models-grid">
                <div class="model-card">
                    <div class="model-header"><i data-lucide="ear"></i><h3>Reconnaissance Vocale (STT)</h3></div>
                    <div class="model-info">
                        <p class="model-name" id="stt-model-name">Chargement...</p>
                        <p class="model-status" id="stt-status-container">
                            <span class="status-dot"></span><span id="stt-status-text">Initialisation</span>
                        </p>
                    </div>
                    <div class="model-desc">
                        <p>Convertit la parole en texte via Whisper API.</p>
                        <small>Latence: ~500ms</small>
                    </div>
                </div>
                <div class="model-card">
                    <div class="model-header"><i data-lucide="brain"></i><h3>Intelligence Linguistique (LLM)</h3></div>
                    <div class="model-info">
                        <p class="model-name" id="llm-model-name">Chargement...</p>
                        <p class="model-provider" id="llm-provider-name" style="font-size: 0.7rem; color: var(--accent-primary); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">-</p>
                        <p class="model-status" id="llm-status-container">
                            <span class="status-dot"></span><span id="llm-status-text">Initialisation</span>
                        </p>
                    </div>
                    <div class="model-desc">
                        <p id="llm-desc-text">Modèle intelligent Cloud.</p>
                        <small id="llm-params-text">Paramètres: Dynamique</small>
                    </div>
                </div>
                <div class="model-card">
                    <div class="model-header"><i data-lucide="volume-2"></i><h3>Synthèse Vocale (TTS)</h3></div>
                    <div class="model-info">
                        <p class="model-name">ElevenLabs v2</p>
                        <p class="model-status" id="tts-status-container">
                            <span class="status-dot"></span><span id="tts-status-text">Prêt</span>
                        </p>
                    </div>
                    <div class="model-desc">
                        <p>Voix naturelle par clonage vocal avancé.</p>
                        <small>Qualité: 44.1kHz</small>
                    </div>
                </div>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>ℹ️ Hub IA</h3></div>
            <div class="info-content">
                <p>Tous les modèles sont synchronisés avec la configuration serveur en temps réel.</p>
            </div>
        </aside>
    `,
    voices: `
        <section class="core-stage">
            <div class="content-header" style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.25rem;">🔊 Voix Premium</h2>
                <p style="font-size: 0.75rem;">Moteur de synthèse ElevenLabs v2.5</p>
            </div>
            <div class="voices-grid" id="voices-list">
                <div class="view-loader"><div class="spinner"></div></div>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>🎤 Sélection</h3></div>
            <div class="info-content">
                <p><strong>Voix active :</strong></p>
                <p id="current-voice-display" style="font-weight: 600; color: var(--accent-primary); font-size: 1.2rem; margin: 0.5rem 0;">${state.activeVoice}</p>
                <button class="action-btn" style="width: 100%; margin-top: 1rem;" onclick="confirmVoiceChange()" id="confirm-voice-btn">
                    Confirmer la voix
                </button>
            </div>
        </aside>
    `,
    settings: `
        <div class="view-container" style="padding: 2rem;">
            <header class="content-header" style="text-align: left; margin-bottom: 2rem;">
                <h2 style="font-size: 1.5rem; letter-spacing: -1px;">Configuration Système</h2>
                <div style="width: 40px; height: 2px; background: var(--accent-primary); margin-top: 8px;"></div>
            </header>
            
            <div class="settings-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                <div class="settings-card" style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-primary); margin-bottom: 1.5rem;">🎙️ Audio Engine</h3>
                    <div class="setting-item">
                        <label style="display: block; font-size: 0.7rem; margin-bottom: 8px; color: var(--text-secondary);">Reconnaissance Vocale (STT)</label>
                        <select id="set-stt" style="width: 100%; background: #000; color: white; border: 1px solid var(--glass-border); padding: 8px; font-size: 0.75rem; border-radius: 4px;">
                            <option value="openai/whisper-large-v3-turbo">Whisper v3 Turbo (Elite)</option>
                            <option value="openai/whisper-medium">Whisper Medium (Stable)</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-card" style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-primary); margin-bottom: 1.5rem;">🧠 Intelligence Core</h3>
                    <div class="setting-item">
                        <label style="display: block; font-size: 0.7rem; margin-bottom: 8px; color: var(--text-secondary);">Large Language Model</label>
                        <select id="set-llm-model" style="width: 100%; background: #000; color: white; border: 1px solid var(--glass-border); padding: 8px; font-size: 0.75rem; border-radius: 4px;">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Production)</option>
                            <option value="mistral-large-latest">Mistral Large (High Accuracy)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <button class="action-btn" id="save-settings-btn" onclick="saveSettings()" style="width: 100%; justify-content: center;">Appliquer les modifications</button>
            </div>
        </div>
    `
};

// --- Router Engine ---
const Router = {
    init() {
        document.querySelectorAll('[data-link]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const route = link.closest('.nav-item').dataset.route;
                this.navigate(route);
            });
        });

        window.addEventListener('popstate', () => {
            const route = window.location.pathname.replace('/', '') || 'home';
            this.navigate(route, false);
        });

        const initialRoute = window.location.pathname.replace('/', '') || 'home';
        this.navigate(initialRoute, false);
    },

    async navigate(route, push = true) {
        if (!Views[route]) route = 'home';

        const contentArea = document.getElementById('content-area');
        contentArea.style.opacity = '0';
        contentArea.style.transform = 'translateY(10px)';

        setTimeout(() => {
            state.currentRoute = route;
            if (push) history.pushState({ route }, '', `/${route === 'home' ? '' : route}`);
            this.render();
            contentArea.style.opacity = '1';
            contentArea.style.transform = 'translateY(0)';
        }, 300);
    },

    render() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = Views[state.currentRoute];

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === state.currentRoute);
        });

        setTimeout(() => {
            lucide.createIcons();
            if (state.currentRoute === 'home') initHomeView();
            if (state.currentRoute === 'models') initModelsView();
            if (state.currentRoute === 'voices') initVoicesView();
            if (state.currentRoute === 'settings') initSettingsView();
            if (state.currentRoute === 'history') initHistoryView();
        }, 50);
    }
};

// --- View Logics ---

let audioCtx, analyser, dataArray, animationId;

async function syncState() {
    try {
        const res = await fetch(`${API_URL}/api/config`);
        const data = await res.json();
        state.settings.stt = data.stt.model;
        state.settings.llm_provider = data.llm.provider || 'hf';
        state.settings.llm = data.llm.model;
        state.settings.temperature = data.llm.temperature;
        state.settings.maxTokens = data.llm.max_tokens;
        state.settings.duration = data.audio.default_duration;
        state.activeVoice = data.tts.elevenlabs.voice_id;

        document.getElementById('active-model-name').textContent = state.settings.llm.split('/').pop();
    } catch (e) {
        console.error("Sync error:", e);
    }
}

function initHomeView() {
    const activateBtn = document.getElementById('activate-btn');
    const chatContainer = document.getElementById('chat-history');

    chatContainer.innerHTML = '';
    state.chatHistory.forEach(msg => appendMessageUI(msg.text, msg.role, chatContainer));

    activateBtn.addEventListener('click', startInteraction);
    const liveBtn = document.getElementById('live-btn');
    if (liveBtn) liveBtn.addEventListener('click', startLiveInteraction);

    if (view === 'history') {
        renderFullHistory();
    }

    if (audioCtx) {
        const canvas = document.getElementById('frequency-bars');
        if (canvas) draw();
    }
    resetUI();
}

async function initModelsView() {
    try {
        const res = await fetch(`${API_URL}/api/models`);
        const data = await res.json();

        document.getElementById('stt-model-name').textContent = data.models.stt;
        document.getElementById('llm-model-name').textContent = data.models.llm.split('/').pop();
        document.getElementById('llm-provider-name').textContent = data.models.llm_provider;

        const llmDesc = document.getElementById('llm-desc-text');
        const llmParams = document.getElementById('llm-params-text');

        if (data.models.llm_provider === 'gemini') {
            llmDesc.textContent = "Analyse multimodale ultra-performante.";
            llmParams.textContent = "Contexte: 1M+ tokens";
        } else if (data.models.llm_provider === 'mistral') {
            llmDesc.textContent = "Souveraineté et efficacité européenne.";
            llmParams.textContent = "Optimisé pour la vitesse";
        }

        updateStatusTab('stt', data.loaded.stt);
        updateStatusTab('llm', data.loaded.llm);
        updateStatusTab('tts', data.loaded.tts);
    } catch (e) {
        console.error("Models fetch error:", e);
    }
}

function updateStatusTab(type, loaded) {
    const container = document.getElementById(`${type}-status-container`);
    const text = document.getElementById(`${type}-status-text`);
    if (!container) return;

    container.className = loaded ? 'model-status loaded' : 'model-status';
    text.textContent = loaded ? 'Actif' : 'Prêt (Lazy)';
}

async function initVoicesView() {
    const grid = document.getElementById('voices-list');
    try {
        const res = await fetch(`${API_URL}/api/voices`);
        const data = await res.json();
        state.availableVoices = data.voices;

        if (data.voices.length === 0) {
            grid.innerHTML = '<p class="error">Aucune voix disponible. Vérifiez votre clé ElevenLabs.</p>';
            return;
        }

        grid.innerHTML = data.voices.map(v => `
            <div class="voice-card ${state.activeVoice === v.id || state.activeVoice === v.name ? 'active' : ''}" data-voice-id="${v.id}" onclick="selectVoice('${v.id}', '${v.name}')">
                <div class="voice-visualizer"><div class="voice-bars">${Array(10).fill('<div></div>').join('')}</div></div>
                <h3>${v.name}</h3>
                <p class="voice-desc">${v.category}</p>
                <button class="btn btn-play" onclick="event.stopPropagation(); playSample('${v.name}')">
                    <i data-lucide="play"></i> Aperçu
                </button>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (e) {
        grid.innerHTML = '<p class="error">Erreur de connexion au serveur.</p>';
    }
}

window.selectVoice = (id, name) => {
    document.querySelectorAll('.voice-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`[data-voice-id="${id}"]`);
    if (card) card.classList.add('active');
    state.activeVoice = id;
    document.getElementById('current-voice-display').textContent = name;
};

window.confirmVoiceChange = async () => {
    const btn = document.getElementById('confirm-voice-btn');
    btn.disabled = true;
    btn.textContent = 'Enregistrement...';

    const settings = { tts: { elevenlabs: { voice_id: state.activeVoice } } };
    try {
        const res = await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (res.ok) {
            btn.textContent = 'Voix confirmée !';
            setTimeout(() => { btn.disabled = false; btn.textContent = 'Confirmer la voix'; }, 2000);
        }
    } catch (e) {
        btn.textContent = 'Erreur';
        btn.disabled = false;
    }
};

async function initSettingsView() {
    const health = document.getElementById('health-status');
    fetch(`${API_URL}/status`).then(r => {
        health.textContent = r.ok ? '🟢 EN LIGNE' : '🔴 HORS LIGNE';
    }).catch(() => health.textContent = '🔴 HORS LIGNE');

    const sttSelect = document.getElementById('set-stt');
    sttSelect.value = state.settings.stt;

    const providerSelect = document.getElementById('set-llm-provider');
    providerSelect.value = state.settings.llm_provider;

    const modelSelect = document.getElementById('set-llm-model');
    modelSelect.value = state.settings.llm;

    document.getElementById('set-duration').addEventListener('input', e => {
        document.getElementById('duration-val').textContent = e.target.value + 's';
        state.settings.duration = parseInt(e.target.value);
    });

    document.getElementById('set-temp').addEventListener('input', e => {
        const val = (e.target.value / 100).toFixed(1);
        document.getElementById('temp-val').textContent = val;
        state.settings.temperature = parseFloat(val);
    });
}

window.saveSettings = async () => {
    const btn = document.getElementById('save-settings-btn');
    btn.textContent = 'Sauvegarde...';

    const newSettings = {
        stt: { model: document.getElementById('set-stt').value },
        llm: {
            provider: document.getElementById('set-llm-provider').value,
            model: document.getElementById('set-llm-model').value,
            temperature: state.settings.temperature,
            max_tokens: state.settings.maxTokens
        },
        audio: { default_duration: state.settings.duration }
    };

    try {
        const res = await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
        });
        if (res.ok) {
            btn.textContent = 'Sauvegardé ✓';
            setTimeout(() => btn.textContent = 'Sauvegarder les changements', 2000);
            syncState();
        }
    } catch (e) {
        btn.textContent = 'Erreur';
    }
};

// --- Interaction Logic ---

async function initVisualizer() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
        } catch (err) {
            console.error("Mic error:", err);
        }
    }
}

function draw() {
    const canvas = document.getElementById('frequency-bars');
    const volumeBar = document.getElementById('sidebar-volume');
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    if (volumeBar) volumeBar.style.width = `${Math.min(100, average * 1.5)}%`;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * 60;
        const angle = (i / dataArray.length) * Math.PI * 2;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(99, 102, 241, ${dataArray[i] / 255})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

async function startInteraction() {
    const btn = document.getElementById('activate-btn');
    const orb = document.getElementById('visualizer');
    const label = document.getElementById('status-label');

    if (state.isListening) return; // Éviter les doubles clics
    state.isListening = true;

    await initVisualizer();
    draw();

    btn.disabled = true;
    orb.className = 'orb listening';
    label.textContent = 'ÉCOUTE (5s)...';
    label.style.color = '#10b981';

    try {
        // Enregistrement Audio sur le Navigateur
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            label.textContent = 'ENVOI...';
            label.style.color = '#f59e0b';

            const formData = new FormData();
            formData.append('file', audioBlob, 'client_audio.wav');

            try {
                const res = await fetch(`${API_URL}/interact`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                orb.className = 'orb thinking';
                label.textContent = 'RÉFLEXION...';
                label.style.color = '#6366f1';

                if (data.success) {
                    if (data.user) addMessage(data.user, 'user');
                    if (data.audio) await playAudioFromBase64(data.audio);
                    setTimeout(() => {
                        if (data.assistant) addMessage(data.assistant, 'bot');
                        resetUI();
                    }, 300);
                } else {
                    addMessage(data.error || "Erreur.", "bot");
                    resetUI('ERREUR', '#ef4444');
                }
            } catch (e) {
                addMessage("Erreur réseau.", "bot");
                resetUI('HORS LIGNE', '#ef4444');
            }
            state.isListening = false;
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 5000); // 5 secondes d'écoute

    } catch (e) {
        console.error("Mic access error:", e);
        addMessage("Accès micro refusé.", "bot");
        resetUI('ERREUR', '#ef4444');
        state.isListening = false;
    }
}

// --- Real-time Live Interaction ---
let ws;
let scriptProcessor;

async function startLiveInteraction() {
    const liveBtn = document.getElementById('live-btn');
    const label = document.getElementById('status-label');
    const orb = document.getElementById('visualizer');

    if (state.isListening) {
        stopLive();
        return;
    }

    state.isListening = true;
    liveBtn.innerHTML = '<i data-lucide="square"></i><span>Arrêter</span>';
    label.textContent = 'MODE LIVE ACTIF - PARLEZ';
    label.style.color = 'var(--accent-secondary)';
    orb.className = 'orb listening';

    const wsUrl = `ws://${window.location.hostname}:8000/ws/audio`;
    ws = new WebSocket(wsUrl);

    // Initialisation Audio
    await initVisualizer();
    draw();

    // Capturer l'audio du micro (16kHz PCM Mono attendu par Gemini)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioCtx.createMediaStreamSource(stream);
    scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioCtx.destination);

    ws.onopen = () => {
        scriptProcessor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                // On downsample simple de 48k/44k vers 16k ou on envoie tel quel (Gemini gère le resampling parfois)
                // Pour simplifier et être "concret" : on envoie en Int16 PCM
                const pcmData = convertFloat32ToInt16(inputData);
                ws.send(JSON.stringify({
                    type: "audio",
                    data: b64encode(pcmData)
                }));
            }
        };
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "audio") {
            // Lecture instantanée des chunks audio
            playLivePCM(msg.data);
        }
    };

    ws.onclose = () => stopLive();
}

function stopLive() {
    state.isListening = false;
    const liveBtn = document.getElementById('live-btn');
    if (liveBtn) liveBtn.innerHTML = '<i data-lucide="zap"></i><span>Live Alpha v2.5</span>';
    resetUI();

    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }
    if (ws) {
        ws.send(JSON.stringify({ type: "end" }));
        ws.close();
        ws = null;
    }
}

// Utilitaires de traitement audio
function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf.buffer;
}

function b64encode(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function playLivePCM(base64Data) {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Le PCM renvoyé par Gemini est en 24kHz Mono 16-bit Little Endian
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

function resetUI(txt = 'PRÊT', color = '#71717a') {
    const btn = document.getElementById('activate-btn');
    const orb = document.getElementById('visualizer');
    const label = document.getElementById('status-label');
    if (!btn) return;

    btn.disabled = false;
    orb.className = 'orb';
    label.textContent = txt;
    label.style.color = color;
}

function addMessage(text, role) {
    state.chatHistory.push({ role, text });
    const container = document.getElementById('chat-history');
    if (container) appendMessageUI(text, role, container);
}

function appendMessageUI(text, role, container) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function playAudioFromBase64(base64Data) {
    const audioBlob = b64toBlob(base64Data, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play();
    });
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
}

// --- History Management ---
function renderFullHistory() {
    const container = document.getElementById('full-history-timeline');
    if (!container) return;

    if (state.chatHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem; color: var(--text-tertiary);">
                <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Aucun historique pour le moment.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = state.chatHistory.map((msg, i) => `
        <div class="history-item ${msg.role}" style="animation-delay: ${i * 0.05}s">
            <div class="history-meta">
                <span class="role-tag">${msg.role === 'user' ? 'VOUS' : 'VESPER'}</span>
                <span class="time-tag">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="history-text">${msg.text}</div>
        </div>
    `).join('');

    lucide.createIcons();
}

window.clearHistory = () => {
    if (confirm("Voulez-vous vraiment effacer tout l'historique ?")) {
        state.chatHistory = [];
        localStorage.removeItem('vesper_history');
        if (state.currentView === 'home') {
            document.getElementById('chat-history').innerHTML = '';
        } else if (state.currentView === 'history') {
            renderFullHistory();
        }
    }
};

window.exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.chatHistory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "vesper_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

function initHistoryView() {
    renderFullHistory();
}

function renderFullHistory() {
    const container = document.getElementById('full-history-timeline');
    if (!container) return;

    if (state.chatHistory.length === 0) {
        container.innerHTML = '<div style="text-align:center; color: var(--text-tertiary);">Aucun historique.</div>';
        return;
    }

    container.innerHTML = state.chatHistory.map(msg => `
        <div class="msg ${msg.role}" style="max-width: 100%; border: 1px solid var(--glass-border);">
            <div style="font-size: 0.65rem; color: var(--accent-primary); margin-bottom: 4px; font-weight: bold;">
                ${msg.role === 'user' ? 'UTILISATEUR' : 'VESPER'}
            </div>
            ${msg.text}
        </div>
    `).join('');
}

window.clearHistory = () => {
    if (confirm("Voulez-vous vraiment effacer l'historique ?")) {
        state.chatHistory = [];
        initHistoryView();
    }
};

window.exportHistory = () => {
    const blob = new Blob([JSON.stringify(state.chatHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vesper_history.json';
    a.click();
};

window.playSample = (voiceName) => {
    alert(`🔊 Écoute de l'aperçu de la voix : ${voiceName} (Simulé)`);
};

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
    syncState();
    Router.init();

    setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/status`);
            const dot = document.getElementById('system-dot');
            if (dot) dot.style.background = res.ok ? '#10b981' : '#ef4444';
        } catch (e) { }
    }, 10000);
});