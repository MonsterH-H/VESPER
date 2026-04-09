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
        stt: 'openai/whisper-small',
        llm: 'microsoft/Phi-3-mini-4k-instruct',
        temperature: 0.7,
        maxTokens: 256,
        duration: 5
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
                <p id="status-label" class="status-label">Initialisation...</p>
                <button id="activate-btn" class="action-btn">
                    <i data-lucide="mic"></i>
                    <span>Commencer</span>
                </button>
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
    models: `
        <section class="core-stage">
            <div class="content-header">
                <h2>🧠 Modèles Intelligents</h2>
                <p>Architecture IA optimisée pour la performance en temps réel</p>
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
                        <p class="model-status" id="llm-status-container">
                            <span class="status-dot"></span><span id="llm-status-text">Initialisation</span>
                        </p>
                    </div>
                    <div class="model-desc">
                        <p>Modèle Phi-3 optimisé pour des réponses fluides.</p>
                        <small>Paramètres: 3.8B</small>
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
            <div class="content-header">
                <h2>🔊 Bibliothèque de Voix</h2>
                <p>Sélectionnez une voix professionnelle d'ElevenLabs</p>
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
        <section class="core-stage">
            <div class="content-header">
                <h2>⚙️ Préférences Système</h2>
                <p>Configurez votre assistant pour une expérience sur mesure</p>
            </div>
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>🎙️ Audio & STT</h3>
                    <div class="setting-item">
                        <label>Modèle Whisper</label>
                        <select id="set-stt">
                            <option value="openai/whisper-tiny">Whisper Tiny (Ultra-rapide)</option>
                            <option value="openai/whisper-small">Whisper Small (Équilibré)</option>
                            <option value="openai/whisper-medium">Whisper Medium (Précis)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Durée Max (secondes)</label>
                        <div class="slider-container">
                            <input type="range" id="set-duration" min="3" max="15" value="${state.settings.duration}">
                            <span id="duration-val">${state.settings.duration}s</span>
                        </div>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>🧠 Intelligence (LLM)</h3>
                    <div class="setting-item">
                        <label>Température</label>
                        <div class="slider-container">
                            <input type="range" id="set-temp" min="0" max="100" value="${state.settings.temperature * 100}">
                            <span id="temp-val">${state.settings.temperature}</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label>Max Tokens</label>
                        <input type="number" id="set-tokens" value="${state.settings.maxTokens}" class="dark-input">
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="action-btn" id="save-settings-btn" onclick="saveSettings()">Sauvegarder les changements</button>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>⚙️ Statut</h3></div>
            <div class="info-content">
                 <div class="info-row"><span>Serveur :</span><strong id="health-status">...</strong></div>
                 <div class="info-row"><span>Version :</span><strong>1.0.0-PRO</strong></div>
            </div>
        </aside>
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
        document.getElementById('llm-model-name').textContent = data.models.llm;
        
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
            model: state.settings.llm, // Garder le même pour l'instant
            temperature: state.settings.temperature,
            max_tokens: parseInt(document.getElementById('set-tokens').value)
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

    await initVisualizer();
    draw();

    btn.disabled = true;
    orb.className = 'orb listening';
    label.textContent = 'ÉCOUTE...';
    label.style.color = '#10b981';

    try {
        const res = await fetch(`${API_URL}/interact`, { method: 'POST' });
        const data = await res.json();

        orb.className = 'orb thinking';
        label.textContent = 'RÉFLEXION...';
        label.style.color = '#6366f1';

        if (data.success) {
            if (data.user) addMessage(data.user, 'user');
            setTimeout(() => {
                if (data.assistant) addMessage(data.assistant, 'bot');
                resetUI();
            }, 600);
        } else {
            addMessage(data.error || "Désolé, une erreur est survenue.", "bot");
            resetUI('ERREUR', '#ef4444');
        }
    } catch (e) {
        addMessage("Veuillez démarrer le serveur Backend.", "bot");
        resetUI('HORS LIGNE', '#ef4444');
    }
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
        } catch (e) {}
    }, 10000);
});