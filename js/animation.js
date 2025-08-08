import { updateCircleVolume } from './audio.js';

let isDrawing = false;
let drawAnimationId = null;
let t = 0;
let glowTimer = 0;

function drawTargetShape(ctx, targetPoints) {
    ctx.clearRect(0, 0, 400, 350);
    ctx.save();
    ctx.translate(200, 175);

    // Target outline
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(targetPoints[0].x, targetPoints[0].y);
    targetPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    ctx.restore();
}

function computeTarget(target) {
    const targetPoints = [];
    for (let step = 0; step < 300; step++) {
        let tt = (step / 300) * Math.PI * 2;
        let pos = { x: 0, y: 0 };
        target.forEach(c => {
            pos.x += c.r * Math.cos(c.f * tt + c.p);
            pos.y += c.r * Math.sin(c.f * tt + c.p);
        });
        targetPoints.push(pos);
    }
    return targetPoints;
}

function draw(ctx, targetPoints, circles, slotContainer, canvas) {
    if (!isDrawing) {
        drawTargetShape(ctx, targetPoints);
        return;
    }
    
    if (typeof window.animationTime === 'undefined') {
        window.animationTime = 0;
    }
    const t = window.animationTime;

    ctx.clearRect(0, 0, 400, 350);
    ctx.save();
    ctx.translate(200, 175);

    // Draw target shape
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(targetPoints[0].x, targetPoints[0].y);
    targetPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Get active circles
    const active = [];
    slotContainer.querySelectorAll(".slot").forEach(s => {
        if (s.dataset.id) {
            const c = circles.find(cc => cc.id === s.dataset.id);
            if (c) active.push(c);
        }
    });

    // Initialize or update main trail
    if (!window.mainTrail) {
        window.mainTrail = [];
        window.mainTrailLength = 200;
    }
    
    let pos = { x: 0, y: 0 };
    active.forEach(c => {
        // Draw orbit path
        ctx.strokeStyle = "rgba(128,128,128,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, c.r, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate next position
        const next = {
            x: pos.x + c.r * Math.cos(c.f * t + c.p),
            y: pos.y + c.r * Math.sin(c.f * t + c.p)
        };
        
        updateCircleVolume(c, next.y);
        
        // Draw connecting line
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();

        // Draw point
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(next.x, next.y, 3, 0, Math.PI * 2);
        ctx.fill();

        pos = next;
    });
    
    // Update and draw trail
    window.mainTrail.push({ x: pos.x, y: pos.y, t });
    if (window.mainTrail.length > window.mainTrailLength) {
        window.mainTrail.shift();
    }
    
    if (window.mainTrail.length > 1) {
        ctx.strokeStyle = "rgba(0,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(window.mainTrail[0].x, window.mainTrail[0].y);
        for (let i = 1; i < window.mainTrail.length; i++) {
            ctx.lineTo(window.mainTrail[i].x, window.mainTrail[i].y);
        }
        ctx.stroke();
    }

    ctx.restore();
    window.animationTime += 0.01;

    // Handle glow effect
    if (glowTimer > 0) {
        canvas.style.boxShadow = "0 0 20px 5px #0ff";
        glowTimer--;
        if (glowTimer === 0) canvas.style.boxShadow = "none";
    }

    drawAnimationId = requestAnimationFrame(() => draw(ctx, targetPoints, circles, slotContainer, canvas));
}

function startDrawing() {
    if (!isDrawing) {
        isDrawing = true;
        window.mainTrail = [];
    }
}

function stopDrawing() {
    isDrawing = false;
    if (drawAnimationId) {
        cancelAnimationFrame(drawAnimationId);
        drawAnimationId = null;
    }
    window.mainTrail = [];
}

function setGlowTimer(value) {
    glowTimer = value;
}

export {
    computeTarget,
    draw,
    startDrawing,
    stopDrawing,
    setGlowTimer
};