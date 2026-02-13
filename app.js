document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        mood: null,
        note: '',
        currentScreen: 'screen-welcome'
    };

    // --- DOM Elements ---
    const screens = {
        welcome: document.getElementById('screen-welcome'),
        checkin: document.getElementById('screen-checkin'),
        validation: document.getElementById('screen-validation'),
        breathe: document.getElementById('screen-breathe'),
        choice: document.getElementById('screen-choice'),
        chat: document.getElementById('screen-chat'),
        game: document.getElementById('screen-game'),
        burn: document.getElementById('screen-burn'), // Added
        closing: document.getElementById('screen-closing')
    };

    const modalSupport = document.getElementById('modal-support');
    const visualCircle = document.querySelector('.circle-visual');
    const breathInstruction = document.getElementById('breath-instruction');
    const validationMessage = document.getElementById('validation-message');
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const checkinNote = document.getElementById('checkin-note');
    const gameContainer = document.getElementById('game-container');

    // --- Buttons ---
    const buttons = {
        start: document.getElementById('btn-start'),
        checkinContinue: document.getElementById('continueBtn'), // Updated ID mapping
        finishPause: document.getElementById('btn-finish-pause'),
        choiceYes: document.getElementById('btn-choice-yes'), // Updated
        choiceNo: document.getElementById('btn-choice-no'),   // Updated
        chatSend: document.getElementById('btn-chat-send'),
        endChat: document.getElementById('btn-end-chat'),
        endGame: document.getElementById('btn-end-game'),
        openSupport: document.getElementById('btn-open-support'),
        closeSupport: document.getElementById('btn-close-support'),


    };

    // ... (Keep existing code) ...

    // 5. Post-Activity Choice
    if (buttons.choiceYes) {
        buttons.choiceYes.addEventListener('click', () => {
            showScreen('closing');
        });
    }

    if (buttons.choiceNo) {
        buttons.choiceNo.addEventListener('click', () => {
            // Go back to options
            showScreen('validation');
        });
    }

    const emojiBtns = document.querySelectorAll('.emoji-btn');

    // --- Event Listeners ---

    // 1. Welcome -> Check-In (Auto-Transition)
    setTimeout(() => {
        const welcomeScreen = document.getElementById('screen-welcome');
        const welcomeContent = welcomeScreen.querySelector('.content');

        // Add fade-out effect
        if (welcomeContent) welcomeContent.classList.add('fade-out');

        // Wait for animation to finish, then switch
        setTimeout(() => {
            showScreen('checkin');
        }, 800);
    }, 3000);

    // 2. Check-In Logic
    // const emojiBtns = document.querySelectorAll('.emoji-btn'); // Old selector
    const moods = document.querySelectorAll('.mood');
    const continueBtn = document.getElementById('continueBtn'); // New ID

    moods.forEach(mood => {
        mood.addEventListener('click', () => {
            moods.forEach(m => m.classList.remove('selected'));
            mood.classList.add('selected');
            state.mood = mood.dataset.mood;
            if (continueBtn) continueBtn.disabled = false;
        });
    });

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            state.note = checkinNote.value;
            // Save to local storage (privacy first)
            localStorage.setItem('mindMate_lastCheckIn', JSON.stringify({
                timestamp: new Date().toISOString(),
                mood: state.mood,
                note: state.note
            }));

            showValidation();
        });
    }

    // 3. Validation -> Pause (Manual choices)
    function showValidation() {
        const messages = {
            // New moods
            "Angry": "It’s okay to feel angry. It’s a valid emotion.",
            "Frustrated": "Frustration is tough. Take a breath.",
            "Neutral": "Checking in is a great start.",
            "Sad": "I hear you. be gentle with yourself.",
            "Anxious": "You are safe right now.",
            "Stressed": "Let's take this one step at a time.",
            // Legacy mapping fallback
            calm: "It’s wonderful that you’re feeling calm.",
            okay: "It’s okay to just be okay.",
            neutral: "Thank you for checking in with yourself.",
            low: "It’s okay to feel low sometimes.",
            stressed: "I hear you. Let’s take a moment."
        };
        validationMessage.textContent = messages[state.mood] || "You are seen.";

        showScreen('validation');
    }

    // 3b. Validation Screen Options
    document.getElementById('btn-val-breathe').addEventListener('click', () => {
        startBreathingExercise();
    });

    document.getElementById('btn-val-chat').addEventListener('click', () => {
        showScreen('chat');
        addChatMessage('ai', `I'm here to listen. What's on your mind?`);
    });

    document.getElementById('btn-val-game').addEventListener('click', () => {
        startCalmingGame();
    });

    // 4. Pause & Breathe
    let breathingInterval;

    function startBreathingExercise() {
        showScreen('breathe');

        // Reset state
        let totalSeconds = 0;
        const countdownEl = document.getElementById('breath-countdown');

        const updateState = () => {
            const phaseTime = totalSeconds % 10;

            // Inhale (0-3)
            if (phaseTime < 4) {
                breathInstruction.textContent = "Breathe In...";
                if (phaseTime === 0) {
                    visualCircle.classList.remove('breathe-out');
                    visualCircle.classList.add('breathe-in');
                }
                if (countdownEl) countdownEl.textContent = 4 - phaseTime;
            }
            // Hold (4-5)
            else if (phaseTime < 6) {
                breathInstruction.textContent = "Hold...";
                if (countdownEl) countdownEl.textContent = 2 - (phaseTime - 4);
            }
            // Exhale (6-9)
            else {
                breathInstruction.textContent = "Breathe Out...";
                if (phaseTime === 6) {
                    visualCircle.classList.remove('breathe-in');
                    visualCircle.classList.add('breathe-out');
                }
                if (countdownEl) countdownEl.textContent = 4 - (phaseTime - 6);
            }

            totalSeconds++;
        };

        updateState(); // Initial call
        breathingInterval = setInterval(updateState, 1000);
    }

    buttons.finishPause.addEventListener('click', () => {
        clearInterval(breathingInterval);
        showScreen('choice');
    });

    // 5b. Calming Game (Floating Bubble Drift)
    const canvas = document.getElementById('game-canvas');
    let ctx;
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
    let gameRunning = false;
    let animationFrameId; // Define animationFrameId
    let bubbles = [];
    let canvasWidth, canvasHeight;

    // Resize Observer
    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    window.addEventListener('resize', resizeCanvas);

    buttons.endGame.addEventListener('click', () => {
        gameRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        showScreen('choice');
    });

    function startCalmingGame() {
        if (!ctx) return; // Guard clause
        showScreen('game');
        resizeCanvas();
        bubbles = [];
        gameRunning = true;

        // Start Loop
        lastTime = performance.now();
        gameLoop(lastTime); // Start the loop
    }

    // Parameters
    const SPAWN_RATE = 600; // ms
    let lastSpawnTime = 0;
    let lastTime = 0;

    class Bubble {
        constructor() {
            this.radius = Math.random() * 60 + 10; // 10px to 70px radius (20-140px diameter)
            this.x = Math.random() * canvasWidth;
            this.y = canvasHeight + this.radius;
            this.speed = Math.random() * 1.5 + 0.5; // Slow upward speed
            this.driftOffset = Math.random() * Math.PI * 2;
            this.driftSpeed = Math.random() * 0.02 + 0.01;
            this.opacity = Math.random() * 0.4 + 0.4; // Increased: 0.4 - 0.8
            this.colorHue = Math.random() * 40 + 170; // Cyans/Teals (Brighter)

            // Pop Animation
            this.isPopping = false;
            this.popScale = 1;
            this.popOpacity = 1;
        }

        update() {
            if (this.isPopping) {
                this.popScale += 0.05;
                this.popOpacity -= 0.1;
                return this.popOpacity > 0;
            }

            this.y -= this.speed;
            this.x += Math.sin(this.y * 0.02 + this.driftOffset) * 0.5;

            // Remove if off screen
            return this.y > -this.radius;
        }

        draw() {
            ctx.beginPath();

            if (this.isPopping) {
                // Ripple effect
                ctx.arc(this.x, this.y, this.radius * this.popScale, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.popOpacity})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                // Bubble Body
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

                // Gradient Fill (Brighter for dark mode)
                const grad = ctx.createRadialGradient(
                    this.x - this.radius * 0.3,
                    this.y - this.radius * 0.3,
                    this.radius * 0.1,
                    this.x,
                    this.y,
                    this.radius
                );
                grad.addColorStop(0, `hsla(${this.colorHue}, 90%, 95%, ${this.opacity + 0.2})`);
                grad.addColorStop(1, `hsla(${this.colorHue}, 80%, 60%, ${this.opacity})`);

                ctx.fillStyle = grad;
                ctx.fill();

                // Stronger Border
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity + 0.4})`;
                ctx.stroke();

                // Stronger Reflection (Shine)
                ctx.beginPath();
                ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity + 0.5})`;
                ctx.fill();
            }
        }
    }

    function gameLoop(timestamp) {
        if (!gameRunning) return;

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Clear Canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Spawn Bubbles
        if (timestamp - lastSpawnTime > SPAWN_RATE && bubbles.length < 30) {
            bubbles.push(new Bubble());
            lastSpawnTime = timestamp;
        }

        // Update & Draw
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            const active = b.update();
            if (!active) {
                bubbles.splice(i, 1);
            } else {
                b.draw();
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Interaction
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check clicks (reverse order to hit top bubbles first)
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            const dx = mouseX - b.x;
            const dy = mouseY - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < b.radius && !b.isPopping) {
                b.isPopping = true;
                // Optional: Play sound here
                break; // Only pop one at a time
            }
        }
    });

    // 6. AI Chat (Simulated with Memory)
    let chatMemory = {
        lastEmotion: null,
        lastUserMessage: null
    };

    buttons.chatSend.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    function handleChatSend() {
        const input = document.getElementById("chat-input");
        const userText = input.value.trim();
        if (!userText) return;

        addChatMessage('user', userText);
        input.value = "";

        chatMemory.lastUserMessage = userText;

        // Show typing indicator
        const typingId = addChatMessage('ai', "Typing...");

        setTimeout(() => {
            const aiReply = generateSmartResponse(userText);
            updateChatMessage(typingId, aiReply);
        }, 1200);
    }

    function addChatMessage(sender, text) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.textContent = text;

        // Generate a unique ID for typing indicator updates
        const msgId = 'msg-' + Date.now();
        div.setAttribute('id', msgId);

        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return msgId;
    }

    function updateChatMessage(msgId, newText) {
        const msgDiv = document.getElementById(msgId);
        if (msgDiv) {
            msgDiv.textContent = newText;
        }
    }

    function generateSmartResponse(input) {
        const text = input.toLowerCase();

        // 🚨 Crisis Detection
        const crisisWords = ["suicide", "kill myself", "die", "end my life"];
        if (crisisWords.some(word => text.includes(word))) {
            openSupportModal();
            return "I'm really glad you told me. You don’t have to go through this alone. Please consider reaching out to support.";
        }

        // 😔 Sad / Low
        if (text.includes("sad") || text.includes("cry") || text.includes("low")) {
            chatMemory.lastEmotion = "sad";
            return pick([
                "I'm really sorry you're feeling this way. What’s been weighing on you?",
                "That sounds heavy. Do you want to tell me more about it?",
                "It’s okay to feel low sometimes. I’m here with you."
            ]);
        }

        // 😣 Stress / Anxiety
        if (text.includes("stress") || text.includes("anxious") || text.includes("overwhelmed")) {
            chatMemory.lastEmotion = "stressed";
            return pick([
                "That sounds overwhelming. Let’s take it one step at a time.",
                "When things feel too much, pausing helps. Want to try a quick breathing reset?",
                "You're handling a lot right now. What’s the hardest part?"
            ]);
        }

        // 😠 Anger
        if (text.includes("angry") || text.includes("mad") || text.includes("frustrated")) {
            chatMemory.lastEmotion = "angry";
            return pick([
                "It makes sense to feel angry sometimes. What triggered it?",
                "Frustration can build up fast. Do you want to talk about what happened?",
                "That sounds upsetting. What part bothered you the most?"
            ]);
        }

        // 😊 Positive
        if (text.includes("happy") || text.includes("better") || text.includes("good")) {
            chatMemory.lastEmotion = "positive";
            return pick([
                "I'm really glad to hear that 😊 What’s been going well?",
                "That’s great! Want to share what made today better?",
                "It’s nice hearing something positive. Tell me more."
            ]);
        }

        // 🔁 Context Awareness
        if (chatMemory.lastEmotion === "sad") {
            return "Earlier you mentioned feeling low. Is it still on your mind?";
        }

        if (chatMemory.lastEmotion === "stressed") {
            return "Do you feel the stress easing a little now?";
        }

        // 🌿 Default
        return pick([
            "Thank you for sharing that. I’m listening.",
            "That sounds important. Tell me more.",
            "I appreciate you opening up."
        ]);
    }

    buttons.endChat.addEventListener('click', () => showScreen('choice'));

    // 7. Support Modal
    buttons.openSupport.addEventListener('click', () => {
        modalSupport.classList.add('active');
    });
    buttons.closeSupport.addEventListener('click', () => {
        modalSupport.classList.remove('active');
    });

    // 8. Closing




    // --- Burn It Away Game Logic ---
    const burnContainer = document.getElementById('burn-container');
    const burnWords = [
        "Unfair", "Enough", "Why", "Stop", "Tired", "Angry", "No", "Heavy", "Stress", "Doubt",
        "Fear", "Pain", "Guilt", "Shame", "Regret", "Lonely", "Anxiety", "Panic", "Failure", "Weak", "Lost",
        "Overthinking", "Pressure", "Insecure", "Worthless", "Exhausted", "Empty", "Stuck"
    ];
    let burnInterval;

    if (document.getElementById('btn-val-burn')) {
        document.getElementById('btn-val-burn').addEventListener('click', () => {
            startBurnGame();
        });
    }

    if (document.getElementById('btn-end-burn')) {
        document.getElementById('btn-end-burn').addEventListener('click', () => {
            endBurnGame();
            showScreen('choice');
        });
    }

    function startBurnGame() {
        showScreen('burn');
        burnContainer.innerHTML = ''; // Clear previous

        // Start generating words
        burnInterval = setInterval(createBurnWord, 500);
    }

    function createBurnWord() {
        if (state.currentScreen !== 'burn') return;

        const word = document.createElement("div");
        word.className = "word";
        word.innerText = burnWords[Math.floor(Math.random() * burnWords.length)];

        // Random position within container (with padding)
        const x = Math.random() * (window.innerWidth - 100) + 20;
        const y = Math.random() * (window.innerHeight - 100) + 20;

        word.style.left = x + "px";
        word.style.top = y + "px";

        word.addEventListener('click', (e) => {
            e.stopPropagation();
            createExplosion(e.clientX, e.clientY); // Trigger flames
            word.classList.add("burn");
            setTimeout(() => word.remove(), 500); // Remove quicker
        });

        // Auto remove after some time to prevent clutter
        setTimeout(() => {
            if (word.parentElement) {
                word.style.opacity = '0';
                setTimeout(() => { if (word.parentElement) word.remove(); }, 1000);
            }
        }, 5000);

        burnContainer.appendChild(word);
    }

    // --- Flame Particle System ---
    let particles = [];

    function createExplosion(x, y) {
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new FlameParticle(x, y));
        }
    }

    class FlameParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 20 + 10; // Big initial flame
            this.speedX = (Math.random() - 0.5) * 4;
            this.speedY = Math.random() * -5 - 2; // Upward movement
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;

            this.element = document.createElement('div');
            this.element.className = 'flame-particle';
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            burnContainer.appendChild(this.element);
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= this.decay;
            this.size *= 0.95; // Shrink

            // Apply visual updates
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.opacity = this.life;

            // Color shift: Yellow -> Orange -> Red -> Smoke
            if (this.life > 0.7) {
                this.element.style.background = 'radial-gradient(circle, #fff700, #ffaa00)';
            } else if (this.life > 0.4) {
                this.element.style.background = 'radial-gradient(circle, #ffaa00, #ff4c00)';
            } else {
                this.element.style.background = 'rgba(50, 50, 50, 0.5)'; // Smoke
            }
        }

        remove() {
            if (this.element.parentElement) this.element.remove();
        }
    }

    function updateParticles() {
        if (state.currentScreen !== 'burn') return;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            if (p.life <= 0) {
                p.remove();
                particles.splice(i, 1);
            }
        }
        requestAnimationFrame(updateParticles);
    }

    // Start particle loop when game starts
    const originalStartBurn = startBurnGame;
    startBurnGame = function () {
        originalStartBurn(); // Call original setup
        updateParticles(); // Start particle loop
    };

    function endBurnGame() {
        clearInterval(burnInterval);
        burnContainer.innerHTML = '';
    }

    // --- Helper Functions ---
    function showScreen(screenId) {
        // Hide all screens
        Object.values(screens).forEach(s => {
            if (s) {
                s.classList.remove('active');
                s.classList.add('hidden');
            }
        });

        console.log("Switching to screen:", screenId);

        // Show target screen
        const target = screens[screenId];
        if (target) {
            target.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                target.classList.add('active');
            }, 10);
            state.currentScreen = screenId;
        }
    }

    function pick(options) {
        return options[Math.floor(Math.random() * options.length)];
    }

    function openSupportModal() {
        modalSupport.classList.add('active');
    }
});
