// Audio context and management
let audioContext;
let oscillators = new Map(); // Map of circle ID to oscillator
let gainNodes = new Map();   // Map of circle ID to gain node
let pannerNodes = new Map(); // Map of circle ID to panner node
let drumSamples = new Map(); // Map of circle ID to assigned drum sample
let audioBuffers = []; // Array to store loaded audio buffers
let lastDrumTime = new Map(); // Track last drum hit time to prevent spam
let fadeInStartTime = new Map(); // Track fade-in start times
window.audioEnabled = true;  // Global audio state

// Load drum samples
async function loadDrumSamples() {
    if (!audioContext) return;
    
    const sampleFiles = ['1.wav', '2.wav', '3.wav', '4.wav', '5.wav'];
    
    for (let i = 0; i < sampleFiles.length; i++) {
        try {
            const response = await fetch(sampleFiles[i]);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers[i] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load drum sample ${i + 1}:`, error);
        }
    }
}

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        loadDrumSamples();
    }
}

// Create or update oscillator for a circle
function updateCircleAudio(circle, isActive = true, fadeIn = false) {
    if (!window.audioEnabled) return;
    
    initAudio();
    if (!audioContext) return;
    
    const circleId = circle.id;
    
    // Remove existing audio if circle is no longer active
    if (!isActive) {
        if (oscillators.has(circleId)) {
            const oscillator = oscillators.get(circleId);
            const gainNode = gainNodes.get(circleId);
            
            if (gainNode) {
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
                setTimeout(() => {
                    oscillator.stop();
                    oscillators.delete(circleId);
                    gainNodes.delete(circleId);
                    pannerNodes.delete(circleId);
                }, 500);
            } else {
                oscillator.stop();
                oscillators.delete(circleId);
                gainNodes.delete(circleId);
                pannerNodes.delete(circleId);
            }
        }
        return;
    }
    
    // Create oscillator if it doesn't exist
    if (!oscillators.has(circleId)) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const pannerNode = audioContext.createStereoPanner();
        
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
        compressor.knee.setValueAtTime(30, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(compressor);
        compressor.connect(audioContext.destination);
        
        oscillators.set(circleId, oscillator);
        gainNodes.set(circleId, gainNode);
        pannerNodes.set(circleId, pannerNode);
        
        oscillator.start();
        
        if (fadeIn) {
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 3);
            fadeInStartTime.set(circleId, audioContext.currentTime);
        }
    }
    
    const oscillator = oscillators.get(circleId);
    const gainNode = gainNodes.get(circleId);
    const pannerNode = pannerNodes.get(circleId);
    
    const baseNote = 220; // A3
    const frequency = Math.max(20, Math.min(2000, baseNote + circle.f * 50));
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    pannerNode.pan.setValueAtTime(0, audioContext.currentTime);
    oscillator.type = 'sine';
}

// Create a drum sound for a circle
function createDrumSound(circleId, frequency) {
    if (!audioContext || !window.audioEnabled) return;
    
    const now = audioContext.currentTime;
    const lastHit = lastDrumTime.get(circleId) || 0;
    if (now - lastHit < 0.3) return;
    lastDrumTime.set(circleId, now);
    
    let sampleIndex = drumSamples.get(circleId);
    if (sampleIndex === undefined) {
        sampleIndex = Math.floor(Math.random() * 5);
        drumSamples.set(circleId, sampleIndex);
    }
    
    if (!audioBuffers[sampleIndex]) return;
    
    const drumSource = audioContext.createBufferSource();
    const drumGain = audioContext.createGain();
    
    drumSource.connect(drumGain);
    drumGain.connect(audioContext.destination);
    
    drumSource.buffer = audioBuffers[sampleIndex];
    
    const playbackRate = 1.0 + (Math.abs(frequency) - 1) * 0.1;
    drumSource.playbackRate.setValueAtTime(playbackRate, now);
    
    drumGain.gain.setValueAtTime(0.4, now);
    
    drumSource.start(now);
}

// Update audio volume based on Y position
function updateCircleVolume(circle, yPosition) {
    if (!window.audioEnabled || !gainNodes.has(circle.id)) return;
    
    const gainNode = gainNodes.get(circle.id);
    if (!gainNode) return;
    
    const canvasHeight = 80;
    const yPercentage = Math.max(0, Math.min(1, (yPosition + 40) / canvasHeight)); 
    
    const scaledRadius = circle.r * yPercentage;
    const dynamicVolume = Math.max(0, Math.min(0.3, scaledRadius / 100 * 0.3));
    
    const fadeStart = fadeInStartTime.get(circle.id);
    const fadeInDuration = 3;
    const isInFadeIn = fadeStart && (audioContext.currentTime - fadeStart) < fadeInDuration;
    
    if (!isInFadeIn) {
        const currentGain = gainNode.gain.value;
        const smoothedGain = currentGain * 0.9 + dynamicVolume * 0.1; 
        gainNode.gain.setValueAtTime(smoothedGain, audioContext.currentTime);
    }
}

// Update audio for all active circles
function updateAllAudio(activeCircles) {
    if (!window.audioEnabled) return;
    
    oscillators.forEach((osc, id) => {
        osc.stop();
    });
    oscillators.clear();
    gainNodes.clear();
    pannerNodes.clear();
    
    activeCircles.forEach(circle => {
        updateCircleAudio(circle, true, true);
    });
}

// Stop all audio with fade out
function stopAllAudio() {
    const fadeOutTime = 0.5;
    
    oscillators.forEach((osc, id) => {
        const gainNode = gainNodes.get(id);
        if (gainNode) {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + fadeOutTime);
            setTimeout(() => {
                if (osc) {
                    osc.stop();
                }
            }, fadeOutTime * 1000);
        } else {
            osc.stop();
        }
    });
    
    setTimeout(() => {
        oscillators.clear();
        gainNodes.clear();
        pannerNodes.clear();
        drumSamples.clear();
        lastDrumTime.clear();
        fadeInStartTime.clear();
    }, fadeOutTime * 1000);
}

export {
    initAudio,
    updateCircleAudio,
    createDrumSound,
    updateCircleVolume,
    updateAllAudio,
    stopAllAudio
};