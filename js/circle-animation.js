import { updateCircleVolume } from './audio.js';

export function createAnimation(targetCanvas, circle) {
    const ctx = targetCanvas.getContext('2d');
    let t = 0;
    let animationId;
    const isMobile = window.innerWidth <= 600;
    const size = isMobile ? 40 : 100;
    const center = size / 2;
    const scale = isMobile ? 0.2 : 0.5;
    
    let trail = [];
    const trailLength = 30;
    
    function animate() {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(center, center);
        
        // Draw orbit path
        ctx.strokeStyle = "rgba(128,128,128,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, circle.r * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        // Calculate point position
        const x = circle.r * scale * Math.cos(circle.f * t + circle.p);
        const y = circle.r * scale * Math.sin(circle.f * t + circle.p);
        
        updateCircleVolume(circle, y);
        
        // Update and draw trail
        trail.push({ x, y, t });
        if (trail.length > trailLength) {
            trail.shift();
        }
        
        if (trail.length > 1) {
            ctx.strokeStyle = circle.color + "60";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                ctx.lineTo(trail[i].x, trail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw connecting line
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Draw moving point
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        t += 0.01;
        animationId = requestAnimationFrame(animate);
    }
    
    // Start the animation
    animate();
    
    return function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    };
}

export function createSlotAnimation(canvas, circle) {
    const ctx = canvas.getContext("2d");
    let t = 0;
    let trail = [];
    const trailLength = 50;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        
        // Draw orbit path
        ctx.strokeStyle = "rgba(128,128,128,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, circle.r * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Calculate point position
        const x = circle.r * 0.4 * Math.cos(circle.f * t + circle.p);
        const y = circle.r * 0.4 * Math.sin(circle.f * t + circle.p);
        
        updateCircleVolume(circle, y);
        
        // Update and draw trail
        trail.push({ x, y, t });
        if (trail.length > trailLength) {
            trail.shift();
        }
        
        if (trail.length > 1) {
            ctx.strokeStyle = circle.color + "80";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                ctx.lineTo(trail[i].x, trail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw connecting line
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Draw moving point
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        t += 0.01;
        return requestAnimationFrame(animate);
    }
    
    return animate();
}