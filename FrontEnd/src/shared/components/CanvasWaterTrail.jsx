import { useEffect, useRef } from "react";

const CanvasWaterTrail = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        // Manejo del resize de pantalla
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        // Control del mouse
        const mouse = { x: null, y: null };
        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener("mousemove", handleMouseMove);

        // Configuración de las gotas (partículas)
        const PARTICLE_COUNT = 70; // Cantidad baja para mantener sutileza
        const particles = [];

        // Paleta de azules más intensos (equivalentes a blue-300 y blue-400 en Tailwind)
        // Opacidad subida a 0.3 para ser más visibles
        const colors = [
            "rgba(147, 197, 253, 0.3)", // blue-300
            "rgba(96, 165, 250, 0.3)",  // blue-400
        ];

        const createParticle = () => {
            const p = {
                x: 0, y: 0, radius: 0, speedY: 0, color: "",
                baseOpacity: 0.3, currentOpacity: 0.3,
                reset() {
                    this.x = Math.random() * canvas.width;
                    this.y = -10;
                    this.radius = Math.random() * 2 + 1; // 1px a 3px
                    this.speedY = Math.random() * 1.5 + 0.5; // Velocidad de caída lenta
                    this.color = colors[Math.floor(Math.random() * colors.length)];
                    this.currentOpacity = this.baseOpacity;
                },
                update() {
                    // Caída natural base
                    this.y += this.speedY;
                    
                    // Interacción global con el mouse (Viento de agua)
                    if (mouse.x !== null && mouse.y !== null) {
                        const dx = mouse.x - this.x;
                        const dy = mouse.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 0) {
                            // Normalizar vector apuntando hacia el mouse
                            const nx = dx / distance;
                            const ny = dy / distance;
                            
                            // Fuerza de atracción (viento) muy suave
                            const windForce = 0.2; 
                            
                            // Viraje sutil sumando la velocidad del viento
                            this.x += nx * windForce;
                            this.y += ny * windForce;
                        }
                        
                        // Resplandor leve si se acerca al "radio de atracción" o impacto
                        const interactionRadius = 200;
                        if (distance < interactionRadius) {
                            const force = (interactionRadius - distance) / interactionRadius; 
                            this.currentOpacity = Math.min(0.8, this.baseOpacity + force * 0.4);
                        } else {
                            this.currentOpacity = Math.max(this.baseOpacity, this.currentOpacity - 0.02);
                        }
                    } else {
                        this.currentOpacity = Math.max(this.baseOpacity, this.currentOpacity - 0.02);
                    }

                    // Reiniciar al salir del canvas (por cualquier borde debido al viento)
                    if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
                        this.reset();
                    }
                },
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    
                    // Reemplazar la opacidad en el string de color
                    const rgbaColor = this.color.replace(/[\d.]+\)$/g, `${this.currentOpacity})`);
                    ctx.fillStyle = rgbaColor;
                    
                    ctx.fill();
                }
            };
            p.reset();
            p.y = Math.random() * canvas.height;
            return p;
        };

        // Inicializar partículas
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }

        let animationFrameId;

        const render = () => {
            // Efecto de rastro (Trail Effect):
            // En vez de borrar todo el canvas, dibujamos un rectángulo del color de fondo (slate-50) 
            // con un 5% de opacidad. Esto borra parcialmente el frame anterior dejando una estela más larga.
            ctx.fillStyle = "rgba(248, 250, 252, 0.05)"; // slate-50 con opacidad 0.05
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
};

export default CanvasWaterTrail;
