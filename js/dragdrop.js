import { updateCircleAudio } from './audio.js';
import { createAnimation, createSlotAnimation } from './circle-animation.js';

function setupDragAndDrop(circle) {
    circle.draggable = true;
    circle.style.touchAction = "none";
    
    const canvas = circle.querySelector('canvas');
    const circleData = {
        id: circle.dataset.id,
        r: parseFloat(circle.dataset.r),
        f: parseFloat(circle.dataset.f),
        p: parseFloat(circle.dataset.p),
        color: circle.dataset.color
    };
    const stopAnimation = createAnimation(canvas, circleData);

    circle.addEventListener("dragstart", e => {
        e.dataTransfer.setData("id", circle.dataset.id);
        e.dataTransfer.effectAllowed = "move";
        const clone = canvas.cloneNode(true);
        e.dataTransfer.setDragImage(clone, 40, 40);
    });

    circle.addEventListener("remove", () => {
        stopAnimation();
    });

    circle.addEventListener("touchstart", e => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        
        const clone = circle.cloneNode(true);
        clone.className = "circle dragging";
        clone.style.touchAction = "none";
        clone.style.position = "fixed";
        clone.style.zIndex = "10000";
        clone.style.pointerEvents = "none";
        clone.style.transform = "translate(-50%, -50%)";
        document.body.appendChild(clone);
        
        const stopCloneAnimation = createAnimation(clone.querySelector('canvas'), circleData);
        
        const moveCircle = (moveEvent) => {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            const moveTouch = moveEvent.touches[0];
            clone.style.left = moveTouch.pageX + "px";
            clone.style.top = moveTouch.pageY + "px";
            
            const slots = document.querySelectorAll(".slot:not(.locked)");
            slots.forEach(slot => slot.classList.remove("dragover"));
            
            const touchTarget = document.elementFromPoint(moveTouch.pageX, moveTouch.pageY);
            const slot = touchTarget?.closest(".slot:not(.locked)");
            if (slot) slot.classList.add("dragover");
        };
        
        const endTouch = (endEvent) => {
            endEvent.preventDefault();
            endEvent.stopPropagation();
            const endTouch = endEvent.changedTouches[0];
            const dropTarget = document.elementFromPoint(endTouch.pageX, endTouch.pageY);
            const slot = dropTarget?.closest(".slot:not(.locked)");
            
            if (slot) {
                handleDrop(slot, circle.dataset.id, circleData);
            }
            
            stopCloneAnimation();
            clone.remove();
            document.removeEventListener("touchmove", moveCircle);
            document.removeEventListener("touchend", endTouch);
        };
        
        document.addEventListener("touchmove", moveCircle);
        document.addEventListener("touchend", endTouch);
    });
}

function handleDrop(slot, circleId, circle) {
    slot.innerHTML = '';
    slot.classList.remove("dragover");
    slot.dataset.id = circleId;
    slot.classList.add("filled");
    
    const canvas = document.createElement('canvas');
    const isMobile = window.innerWidth <= 600;
    canvas.width = isMobile ? 40 : 100;
    canvas.height = isMobile ? 40 : 100;
    canvas.style.cssText = "width: 100%; height: 100%; display: block;";
    slot.appendChild(canvas);
    
    slot.animationId = createSlotAnimation(canvas, circle);
    
    slot.style.border = "2px solid #fff";
    updateCircleAudio(circle, true);
}

function setupSlot(slot, getCircleById) {
    slot.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        slot.classList.add("dragover");
    });
    
    slot.addEventListener("dragleave", () => {
        slot.classList.remove("dragover");
    });
    
    slot.addEventListener("drop", e => {
        e.preventDefault();
        e.stopPropagation();
        slot.classList.remove("dragover");
        const id = e.dataTransfer.getData("id");
        const circle = getCircleById(id);
        if (circle) {
            const circleData = {
                id: circle.id,
                r: circle.r,
                f: circle.f,
                p: circle.p,
                color: circle.color
            };
            handleDrop(slot, id, circleData);
        }
    });
}

export {
    setupDragAndDrop,
    setupSlot
};