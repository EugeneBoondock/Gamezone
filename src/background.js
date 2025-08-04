const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

// Adjust particle count based on screen size for performance
const particleCount = Math.floor((canvas.width * canvas.height) / 20000);

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() * 1 - 0.5);
        this.speedY = (Math.random() * 1 - 0.5);
        this.color = 'rgba(255, 255, 255, 0.7)';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) {
            this.speedX *= -1;
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.speedY *= -1;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connectParticles();
}

function connectParticles() {
    let opacityValue = 1;
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                         + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));

            if (distance < (canvas.width/7) * (canvas.height/7)) {
                opacityValue = 1 - (distance/20000);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalculate particle count on resize
    const newParticleCount = Math.floor((canvas.width * canvas.height) / 20000);
    // Adjust particles array to the new count
    if(newParticleCount > particles.length){
        for(let i = particles.length; i < newParticleCount; i++){
            particles.push(new Particle());
        }
    } else {
        particles.length = newParticleCount;
    }
});

init();
animate();
