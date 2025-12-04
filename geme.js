const DB = {
    Morning: [
        { q: "Fog reduces visibility. What happens to humidity?", options: ["Rises significantly", "Drops to zero", "Stays constant"], ans: 0, stat: "env" },
        { q: "Dew covers the leaves. Who drinks this water?", options: ["Insects", "Large rocks", "Fish"], ans: 0, stat: "health" },
        { q: "Which layer gets sunlight first?", options: ["Emergent", "Forest Floor", "Understory"], ans: 0, stat: "env" },
        { q: "Plants use sunlight for...", options: ["Photosynthesis", "Digestion", "Sleep"], ans: 0, stat: "energy" },
        { q: "Howler monkeys call to...", options: ["Mark territory", "Attract rain", "Scare fish"], ans: 0, stat: "energy" }
    ],
    Noon: [
        { q: "It is hottest now. How do plants conserve water?", options: ["Close stomata", "Shed bark", "Grow faster"], ans: 0, stat: "energy" },
        { q: "Direct sunlight can cause...", options: ["Leaf scorching", "Instant freezing", "Root rot"], ans: 0, stat: "health" },
        { q: "Animals seek shade to avoid...", options: ["Overheating", "Getting wet", "Moonlight"], ans: 0, stat: "energy" },
        { q: "Heat rises, causing what kind of rain?", options: ["Convectional", "Snow", "Hail"], ans: 0, stat: "env" },
        { q: "The canopy protects the floor from...", options: ["Direct heat", "Air", "Insects"], ans: 0, stat: "env" }
    ],
    Evening: [
        { q: "Temperatures drop. Humidity usually...", options: ["Increases relative to temp", "Disappears", "Becomes toxic"], ans: 0, stat: "env" },
        { q: "Diurnal animals are now...", options: ["Finding shelter", "Waking up", "Hunting"], ans: 0, stat: "energy" },
        { q: "Frogs begin calling. Why?", options: ["Mating/Territory", "They are cold", "To sleep"], ans: 0, stat: "env" },
        { q: "Shadows lengthen. Predatory cats...", options: ["Start hunting", "Go to sleep", "Sunbathe"], ans: 0, stat: "health" },
        { q: "The setting sun reduces...", options: ["Photosynthesis", "Respiration", "Gravity"], ans: 0, stat: "energy" }
    ],
    Night: [
        { q: "It is dark. Plants now mostly...", options: ["Respire", "Photosynthesize", "Bloom"], ans: 0, stat: "energy" },
        { q: "Bats use what to navigate?", options: ["Echolocation", "Flashlights", "Heat vision"], ans: 0, stat: "env" },
        { q: "Nocturnal flowers are usually...", options: ["Pale/White", "Bright Red", "Invisible"], ans: 0, stat: "env" },
        { q: "The forest floor is now...", options: ["Teeming with predators", "Empty", "Hot"], ans: 0, stat: "health" },
        { q: "Bioluminescence is used for...", options: ["Attracting mates", "Heating", "Cooking"], ans: 0, stat: "energy" }
    ]
};

const PHASES = [
    { name: "Morning", bgClass: "bg-morning", bg: "var(--bg-morning)", tip: "Morning humidity is high. Keep your environment clean to prevent mold, but enjoy the fresh water.", questions: 5 },
    { name: "Noon", bgClass: "bg-noon", bg: "var(--bg-noon)", tip: "The sun is brutal. Rest in the shade to conserve Energy. Water loss is rapid.", questions: 5 },
    { name: "Evening", bgClass: "bg-evening", bg: "var(--bg-evening)", tip: "Predators wake up. Watch your Health. Humidity rises as the air cools.", questions: 5 },
    { name: "Night", bgClass: "bg-night", bg: "var(--bg-night)", tip: "Visibility is zero. Danger is everywhere. Conserve Health and Energy to survive until dawn.", questions: 5 }
];

class Game {
    constructor() {
        this.stats = { health: 100, energy: 100, env: 100, score: 0 };
        this.phaseIdx = 0;
        this.qIdx = 0;
        this.humidity = 80;
        this.weather = "Clear";
        this.correctAnswers = 0;
        this.questions = [];
        this.doublePointsActive = false;
        this.doublePointsUses = 1;
        
        // Streak Tracking
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.pendingEvent = null; 
    }

    updateUI() {
        document.getElementById('bar-health').style.width = this.stats.health + "%";
        document.getElementById('bar-energy').style.width = this.stats.energy + "%";
        document.getElementById('bar-env').style.width = this.stats.env + "%";
        
        document.getElementById('hud-humidity').innerText = this.humidity + "%";
        document.getElementById('quiz-score').innerText = "Score: " + this.stats.score;
        
        if (this.stats.health <= 0) this.gameOver("You succumbed to injury.");
        else if (this.stats.energy <= 0) this.gameOver("You collapsed from exhaustion.");
        else if (this.stats.env <= 0) this.gameOver("The environment became uninhabitable.");
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(id).classList.add('active');
    }

    setCardBackground(bgClass) {
        const card = document.querySelector('.glass-card');
        card.className = 'glass-card ' + bgClass;
        // Sets the outer body background gradient based on the phase
        document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue(`--${bgClass.replace('bg-', 'bg-')}`);
    }

    async start() {
        // Reset state for new game
        this.stats = { health: 100, energy: 100, env: 100, score: 0 };
        this.phaseIdx = 0;
        this.qIdx = 0;
        this.correctAnswers = 0;
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.pendingEvent = null;
        this.doublePointsActive = false;
        this.doublePointsUses = 1;

        const dpBtn = document.getElementById('double-points-btn');
        dpBtn.disabled = false;
        dpBtn.innerText = '✨ 2x Points (5⚡)';
        dpBtn.classList.remove('active');

        document.getElementById('quiz-score').innerText = "Score: 0";

        // Load questions from JSON
        const response = await fetch('questions.json');
        const DB = await response.json();

        // Shuffle all questions initially 
        this.questions = Object.values(DB).flat().sort(() => 0.5 - Math.random()); 
        
        this.loadPhase();
    }

    loadPhase() {
        if (this.phaseIdx >= PHASES.length) {
            this.gameOver("You survived the full 24-hour cycle! The rainforest is balanced.", true);
            return;
        }

        const phase = PHASES[this.phaseIdx];
        this.qIdx = 0; // Reset question index for new phase

        this.setCardBackground(phase.bgClass);
        document.getElementById('period-title').innerText = phase.name;
        document.getElementById('context-desc').innerText = `You are now entering the ${phase.name} phase. Watch out for dangers unique to this time of day.`;
        document.getElementById('context-tip').innerText = phase.tip;
        
        this.showScreen('screen-context');
        this.updateUI();
    }

    startPhase() {
        this.showScreen('screen-quiz');
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.qIdx >= PHASES[this.phaseIdx].questions) {
            // Logic to check if phase is COMPLETE and then proceed to next phase
            this.phaseIdx++;
            this.loadPhase();
            return;
        }

        this.showScreen('screen-quiz');
        document.getElementById('action-area').style.display = 'none'; 
        
        // Re-enable action buttons for potential use at phase end
        const actBtns = document.querySelectorAll('.action-btn');
        actBtns.forEach(b => {
            b.style.opacity = '1';
            b.style.pointerEvents = 'auto';
            b.style.cursor = 'pointer';
        });
        
        this.runBiome();
        this.runEvent(); // Executes streak events

        const qData = this.questions[this.qIdx];
        document.getElementById('question-text').innerText = qData.q;
        
        const optsDiv = document.getElementById('options-list');
        optsDiv.innerHTML = "";
        
        // Shuffle options and display them
        let idxs = [0, 1, 2].sort(() => 0.5 - Math.random());
        idxs.forEach(i => {
            const btn = document.createElement('button');
            btn.className = "option-btn";
            btn.innerText = qData.options[i];
            btn.onclick = () => this.handleAnswer(i, qData.ans, btn, qData);
            optsDiv.appendChild(btn);
        });
        
        this.updateUI();
    }

    runBiome() {
        // 1. Humidity Curve Logic
        let targetHum = 70; 
        const currentPhase = PHASES[this.phaseIdx].name;

        if (currentPhase === "Morning") targetHum = 95;
        else if (currentPhase === "Noon") targetHum = 45;
        else if (currentPhase === "Evening") targetHum = 75;
        else if (currentPhase === "Night") targetHum = 90;

        // Moves humidity towards the target
        const diff = targetHum - this.humidity;
        const change = Math.sign(diff) * Math.floor(Math.random() * 5 + 2); 
        const noise = Math.floor(Math.random() * 5) - 2;
        
        this.humidity += change + noise;
        this.humidity = Math.max(30, Math.min(100, this.humidity));

        // 2. Weather Logic (influenced by humidity)
        let rainChance = 0.1; 
        let stormChance = 0.02;

        if (this.humidity > 80) { rainChance = 0.3; stormChance = 0.08; }
        if (this.humidity > 90) { rainChance = 0.5; stormChance = 0.15; }

        const roll = Math.random();
        
        if (roll < stormChance) {
            this.weather = "Storm";
        } else if (roll < (stormChance + rainChance)) {
            this.weather = "Rain";
        } else {
            this.weather = "Clear";
        }

        // 3. Biome Consequences (Stats Impact)
        if (this.humidity > 90) {
            this.stats.energy -= 3; 
            this.triggerEffect('mist'); 
        }
        
        if (this.weather === "Storm") {
            this.stats.env -= 8;
            this.triggerEffect('rain'); 
        }
        
        if (this.weather === "Rain") this.stats.env = Math.min(100, this.stats.env + 2);
    }
    
    triggerEffect(type) {
        const fx = document.getElementById('weather-fx');
        fx.className = ''; 
        if (type === 'mist') fx.classList.add('fx-mist');
        if (type === 'rain') fx.classList.add('fx-rain');
        fx.style.opacity = '1';
        setTimeout(() => {
            fx.style.opacity = '0';
        }, 3000);
    }

    runEvent() {
        const box = document.getElementById('event-alert');
        box.style.display = 'none';

        // Check if a pending event exists from the previous turn's answer (streak reward/penalty)
        if (this.pendingEvent) {
            this.pendingEvent.f(); // Execute the stat change
            
            // Show Alert
            document.querySelector('.event-title').innerText = "⚠️ " + this.pendingEvent.t;
            document.getElementById('event-msg').innerText = this.pendingEvent.d;
            box.style.display = 'block';

            this.pendingEvent = null;
        }
    }

    toggleDoublePoints() {
        const btn = document.getElementById('double-points-btn');
        // Allow toggling OFF even if uses are 0, but not ON.
        if (this.doublePointsUses <= 0 && !this.doublePointsActive) return;

        // If trying to activate, check for energy
        if (!this.doublePointsActive && this.stats.energy < 5) {
            // Not enough energy, maybe flash the button red or show a message
            return;
        }

        this.doublePointsActive = !this.doublePointsActive;
        
        if (this.doublePointsActive) {
            btn.classList.add('active');
            btn.innerText = '2x Active';
        } else {
            btn.classList.remove('active');
            btn.innerText = '✨ 2x Points (5⚡)';
        }
    }

    handleAnswer(selected, correct, btn, qData) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.style.pointerEvents = 'none');

        if (selected === correct) {
            btn.classList.add('correct');
            let scoreToAdd = 10;
            // Consume double points if active and has enough energy
            if (this.doublePointsActive) {
                if (this.stats.energy >= 5) {
                    this.stats.energy -= 5;
                    scoreToAdd *= 2;
                }
                this.doublePointsActive = false;
                this.doublePointsUses--;
                
                const dpBtn = document.getElementById('double-points-btn');
                dpBtn.disabled = true;
                dpBtn.classList.remove('active');
                dpBtn.innerText = '✨ 2x Used';
            }

            this.stats.score += scoreToAdd;
            this.correctAnswers++;
            this.stats.energy = Math.min(100, this.stats.energy + 5);
            this.stats.env = Math.min(100, this.stats.env + 5);

            // --- STREAK LOGIC (CORRECT) ---
            this.correctStreak++;
            this.wrongStreak = 0; 

            if (this.correctStreak === 2) {
                // Litter Found (+5 Env)
                this.pendingEvent = { 
                    t: "Streak: Litter Found", 
                    d: "2 Correct in a row! You cleaned up trash. (+5 Env)", 
                    f: () => this.stats.env = Math.min(100, this.stats.env + 5) 
                };
            } 
            else if (this.correctStreak >= 4) {
                // Refreshing Breeze (+3 All)
                this.pendingEvent = { 
                    t: "Streak: Refreshing Breeze", 
                    d: "4 Correct in a row! Nature rewards you. (+3 All Stats)", 
                    f: () => {
                        this.stats.health = Math.min(100, this.stats.health + 3);
                        this.stats.energy = Math.min(100,.stats.energy + 3);
                        this.stats.env = Math.min(100, this.stats.env + 3);
                    }
                };
                this.correctStreak = 0; // Reset streak after big reward
            }

        } else {
            btn.classList.add('wrong');
            
            // Topic-Based Penalty: large hit to targeted stat, small hit to others
            const targetStat = qData.stat || 'energy'; 
            this.stats[targetStat] -= 15;
            
            if (targetStat !== 'health') this.stats.health -= 5;
            if (targetStat !== 'energy') this.stats.energy -= 5;
            if (targetStat !== 'env') this.stats.env -= 5;

            // --- STREAK LOGIC (WRONG) ---
            this.wrongStreak++;
            this.correctStreak = 0; 

            if (this.wrongStreak >= 2) {
                // Mosquito Swarm (-5 Health, -5 Energy)
                this.pendingEvent = { 
                    t: "Streak: Mosquito Swarm", 
                    d: "2 Wrong in a row! Biting insects swarm you. (-5 Health, -5 Energy)", 
                    f: () => {
                        this.stats.health -= 5;
                        this.stats.energy -= 5;
                    }
                };
                this.wrongStreak = 0; // Reset penalty streak
            }
        }

        this.stats.health = Math.max(0, this.stats.health);
        this.stats.energy = Math.max(0, this.stats.energy);
        this.stats.env = Math.max(0, this.stats.env);

        this.qIdx++;
        this.updateUI();
        
        if (this.stats.health > 0 && this.stats.energy > 0 && this.stats.env > 0) {
            const actionArea = document.getElementById('action-area');
            const actionRow = actionArea.querySelector('.action-row');
            const actionText = actionArea.querySelector('p');
            const continueBtn = actionArea.querySelector('.btn-primary');

            const isPhaseComplete = this.qIdx >= PHASES[this.phaseIdx].questions;

            if (isPhaseComplete) {
                actionRow.style.display = 'flex';
                actionText.style.display = 'block';
                actionText.innerText = "Phase Complete! Choose a recovery action:";
                continueBtn.innerText = "Enter Next Phase";
            } else {
                actionRow.style.display = 'none';
                actionText.style.display = 'none';
                continueBtn.innerText = "Next Question";
            }

            actionArea.style.display = 'flex';
        }
    }

    action(type) {
        const btns = document.querySelectorAll('.action-btn');
        btns.forEach(b => {
            b.style.opacity = 0.5; 
            b.style.pointerEvents = 'none';
        });

        if (type === 'drink') this.stats.health = Math.min(100, this.stats.health + 10);
        if (type === 'rest') this.stats.energy = Math.min(100, this.stats.energy + 10);
        if (type === 'clean') this.stats.env = Math.min(100, this.stats.env + 10);
        
        this.updateUI();
    }

    gameOver(reason, win=false) {
        this.showScreen('screen-over');
        this.setCardBackground(win ? 'bg-end' : 'bg-start'); 
        
        const title = document.getElementById('end-title');
        title.innerText = win ? "SURVIVED!" : "GAME OVER";
        title.style.color = win ? "#4ade80" : "#ef4444";
        document.getElementById('end-reason').innerText = reason;
        document.getElementById('end-correct').innerText = this.correctAnswers;
        document.getElementById('end-score').innerText = this.stats.score;
    }
}

const game = new Game();