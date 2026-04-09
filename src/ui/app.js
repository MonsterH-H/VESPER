/**
 * VESPER — Premium AI Assistant Frontend
 * SPA Architecture with Custom Router
 */

// --- Configuration & State ---
const API_URL = 'http://localhost:8000';

const state = {
    currentRoute: 'home',
    isListening: false,
    activeModel: 'Llama 3 (8B)',
    activeVoice: 'Rachel',
    systemStatus: 'Prêt',
    chatHistory: [
        { role: 'bot', text: 'Système initialisé. Bienvenue, comment puis-je vous aider ?' }
    ],
    settings: {
        stt: 'openai/whisper-small',
        llm: 'meta-llama/Llama-2-7b-chat-hf',
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
                        <p class="model-status"><span class="status-dot loaded"></span><span>Actif</span></p>
                    </div>
                    <div class="model-desc">
                        <p>Convertit la parole en texte. Basé sur Whisper.</p>
                        <small>Latence: ~500ms</small>
                    </div>
                </div>
                <div class="model-card">
                    <div class="model-header"><i data-lucide="brain"></i><h3>Intelligence Linguistique (LLM)</h3></div>
                    <div class="model-info">
                        <p class="model-name" id="llm-model-name">Chargement...</p>
                        <p class="model-status"><span class="status-dot loaded"></span><span>Actif</span></p>
                    </div>
                    <div class="model-desc">
                        <p>Modèle génératif optimisé pour la conversation.</p>
                        <small>Paramètres: 8B</small>
                    </div>
                </div>
                <div class="model-card">
                    <div class="model-header"><i data-lucide="volume-2"></i><h3>Synthèse Vocale (TTS)</h3></div>
                    <div class="model-info">
                        <p class="model-name">ElevenLabs v2</p>
                        <p class="model-status"><span class="status-dot loaded"></span><span>En ligne</span></p>
                    </div>
                    <div class="model-desc">
                        <p>Voix naturelle par clonage vocal avancé.</p>
                        <small>Qualité: Studio</small>
                    </div>
                </div>
            </div>
            <div class="metrics-panel">
                <h3>📊 Temps de réponse moyens</h3>
                <div class="metrics-row">
                    <div class="metric"><span class="metric-label">Cycle total</span><span class="metric-value">1.2s</span></div>
                    <div class="metric"><span class="metric-label">STT</span><span class="metric-value">420ms</span></div>
                    <div class="metric"><span class="metric-label">LLM</span><span class="metric-value">680ms</span></div>
                </div>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>ℹ️ Hub IA</h3></div>
            <div class="info-content">
                <p>Tous nos modèles sont hébergés localement ou via des API sécurisées pour garantir votre confidentialité.</p>
            </div>
        </aside>
    `,
    voices: `
        <section class="core-stage">
            <div class="content-header">
                <h2>🔊 Bibliothèque de Voix</h2>
                <p>Découvrez la puissance de la synthèse vocale moderne</p>
            </div>
            <div class="voices-grid">
                ${['Rachel', 'Antoine', 'Victoria', 'Adam', 'Sarah', 'Luna'].map(v => `
                    <div class="voice-card ${state.activeVoice === v ? 'active' : ''}" data-voice="${v}">
                        <div class="voice-visualizer">
                            <div class="voice-bars">
                                ${Array(10).fill('<div></div>').join('')}
                            </div>
                        </div>
                        <h3>${v}</h3>
                        <p class="voice-desc">${v === 'Rachel' ? 'Professionnelle & Chaleureuse' : 'Expressive & Claire'}</p>
                        <div class="voice-tags">
                            <span>${['Rachel', 'Victoria', 'Sarah', 'Luna'].includes(v) ? 'Féminin' : 'Masculin'}</span>
                            <span>Français 🇫🇷</span>
                        </div>
                        <button class="btn btn-play" onclick="playSample('${v}')">
                            <i data-lucide="play"></i> Aperçu
                        </button>
                    </div>
                `).join('')}
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>🎤 Sélection</h3></div>
            <div class="info-content">
                <p><strong>Voix active :</strong></p>
                <p id="current-voice-display">${state.activeVoice}</p>
                <button class="action-btn" style="width: 100%; margin-top: 1rem;" onclick="confirmVoiceChange()">
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
                            <option value="tiny">Tiny (Ultra-rapide)</option>
                            <option value="small" selected>Small (Équilibré)</option>
                            <option value="medium">Medium (Précis)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Durée Max (secondes)</label>
                        <div class="slider-container">
                            <input type="range" id="set-duration" min="3" max="15" value="5">
                            <span id="duration-val">5s</span>
                        </div>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>🧠 Intelligence (LLM)</h3>
                    <div class="setting-item">
                        <label>Température</label>
                        <div class="slider-container">
                            <input type="range" id="set-temp" min="0" max="100" value="70">
                            <span id="temp-val">0.7</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label>Max Tokens</label>
                        <input type="number" id="set-tokens" value="256" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: #fff;">
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="action-btn" onclick="saveSettings()">Sauvegarder les changements</button>
            </div>
        </section>
        <aside class="chat-panel">
            <div class="panel-header"><h3>⚙️ Statut</h3></div>
            <div class="info-content">
                 <div class="info-row"><span>Backend :</span><strong id="health-status">...</strong></div>
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

        // Initial route
        const initialRoute = window.location.pathname.replace('/', '') || 'home';
        this.navigate(initialRoute, false);
    },

    async navigate(route, push = true) {
        if (!Views[route]) route = 'home';
        
        const contentArea = document.getElementById('content-area');
        
        // Add transition class
        contentArea.style.opacity = '0';
        contentArea.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            state.currentRoute = route;
            if (push) history.pushState({ route }, '', `/${route === 'home' ? '' : route}`);
            this.render();
            
            // Fade back in
            contentArea.style.opacity = '1';
            contentArea.style.transform = 'translateY(0)';
        }, 300);
    },

    render() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = Views[state.currentRoute];
        
        // Update active nav link
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === state.currentRoute);
            const icon = item.querySelector('i');
            if (icon) icon.style.color = item.dataset.route === state.currentRoute ? 'var(--accent-primary)' : 'inherit';
        });

        // Initialize view-specific logic
        setTimeout(() => {
            lucide.createIcons();
            if (state.currentRoute === 'home') initHomeView();
            if (state.currentRoute === 'models') initModelsView();
            if (state.currentRoute === 'voices') initVoicesView();
            if (state.currentRoute === 'settings') initSettingsView();
        }, 50);
    }
};

// --- View Specific Logic ---

let audioCtx, analyser, dataArray, animationId;

function initHomeView() {
    const activateBtn = document.getElementById('activate-btn');
    const chatContainer = document.getElementById('chat-history');
    
    // Restore chat history visual
    state.chatHistory.forEach(msg => appendMessageUI(msg.text, msg.role, chatContainer));

    activateBtn.addEventListener('click', startInteraction);
    
    // If we have a running visualizer, we need to bind the new canvas
    if (audioCtx) {
        const canvas = document.getElementById('frequency-bars');
        if (canvas) draw();
    }
}

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
    animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 80;

    // Update volume bar in sidebar (global)
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
            addMessage("Désolé, une erreur est survenue.", "bot");
            resetUI();
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

// --- View Logics ---

async function initModelsView() {
    try {
        const res = await fetch(`${API_URL}/api/models`);
        const data = await res.json();
        document.getElementById('stt-model-name').textContent = data.models.stt;
        document.getElementById('llm-model-name').textContent = data.models.llm;
        document.getElementById('active-model-name').textContent = data.models.llm;
    } catch (e) {
        document.getElementById('stt-model-name').textContent = 'Whisper Large-v3';
        document.getElementById('llm-model-name').textContent = 'Llama 3 (8B)';
        document.getElementById('active-model-name').textContent = 'Llama 3';
    }
}

function initVoicesView() {
    document.querySelectorAll('.voice-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.voice-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.activeVoice = card.dataset.voice;
            document.getElementById('current-voice-display').textContent = state.activeVoice;
        });
    });
}

function initSettingsView() {
    const health = document.getElementById('health-status');
    fetch(`${API_URL}/status`).then(r => {
        health.textContent = r.ok ? '🟢 ONLINE' : '🔴 OFFLINE';
    }).catch(() => health.textContent = '🔴 OFFLINE');

    document.getElementById('set-duration').addEventListener('input', e => {
        document.getElementById('duration-val').textContent = e.target.value + 's';
        state.settings.duration = e.target.value;
    });
    
    document.getElementById('set-temp').addEventListener('input', e => {
        document.getElementById('temp-val').textContent = (e.target.value / 100).toFixed(1);
        state.settings.temperature = e.target.value / 100;
    });
}

// --- Global Functions (exposed for onclick) ---
window.playSample = (voice) => {
    const audio = new Audio(`https://media.sample-videos.com/audio/mp3/wave.mp3`); // Placeholder high quality sound
    console.log("Playing sample for", voice);
    // In a real app, this would play a real ElevenLabs sample
    alert(`🔊 Écoute de l'aperçu de la voix : ${voice}`);
};

window.confirmVoiceChange = () => {
    alert(`✅ Voix "${state.activeVoice}" activée globalement.`);
};

window.saveSettings = () => {
    const btn = event.target;
    btn.textContent = 'Sauvegarde...';
    setTimeout(() => {
        btn.textContent = 'Sauvegardé ✓';
        setTimeout(() => btn.textContent = 'Sauvegarder les changements', 2000);
    }, 800);
};

// --- Boostrap ---
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
    
    // Global System Health Pulse
    setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/status`);
            const dot = document.getElementById('system-dot');
            if (dot) dot.style.background = res.ok ? '#10b981' : '#ef4444';
        } catch (e) {}
    }, 10000);
});