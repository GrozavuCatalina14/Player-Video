export class VideoPlayer {
    #canvas;
    #ctx;
    #videoElement;
    #animationID;
    #currentEffect = 'normal';
    
    #subtitles = []; 
    #activeSubtitle = ""; 

    constructor(canvas, videoElement) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d");
        this.#videoElement = videoElement;
        
        this.#initEvents();
    }

    #initEvents() {
        this.#videoElement.addEventListener("loadedmetadata", () => {
            this.#canvas.width = this.#videoElement.videoWidth;
            this.#canvas.height = this.#videoElement.videoHeight;
            this.#draw(true);
        });

        this.#videoElement.addEventListener("play", () => {
            this.#draw();
        });

        this.#videoElement.addEventListener("pause", () => {
            cancelAnimationFrame(this.#animationID);
           
        });

        this.#videoElement.addEventListener("ended", () => {
            cancelAnimationFrame(this.#animationID);
        });

        
        this.#canvas.addEventListener("mousemove", (e) => {
            const rect = this.#canvas.getBoundingClientRect();
            const y = (e.clientY - rect.top) * (this.#canvas.height / rect.height);
            // Dacă mouse-ul e în partea de jos (unde ar fi controalele), punem pointer
            this.#canvas.style.cursor = (y > this.#canvas.height - 50) ? "pointer" : "default";
        });
    }

    setEffect(effectName) {
        this.#currentEffect = effectName;
        if (this.#videoElement.paused && !this.#videoElement.ended) {
            this.#draw(true); // Desenăm un frame pentru a aplica efectul instant
        }
    }

    
    #draw(force = false) {
        if ((this.#videoElement.paused || this.#videoElement.ended) && !force) {
            return;
        }

        
        this.#processFrame();
        
       
        this.#drawSubtitles();
        
        if (!this.#videoElement.paused && !this.#videoElement.ended) {
            this.#animationID = requestAnimationFrame(() => {
                this.#draw();
            });
        }
    }
      
    #processFrame() {
       
        this.#ctx.drawImage(this.#videoElement, 0, 0, this.#canvas.width, this.#canvas.height);

        if (this.#currentEffect === 'normal') return;

        const frame = this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
        const data = frame.data; 

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];     
            const g = data[i + 1]; 
            const b = data[i + 2]; 

            if (this.#currentEffect === 'invert') {
                data[i] = 255 - r;
                data[i + 1] = 255 - g;
                data[i + 2] = 255 - b;
            } 
            else if (this.#currentEffect === 'threshold') {
                const avg = (r + g + b) / 3;
                const val = avg > 128 ? 255 : 0;
                
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
        }
        this.#ctx.putImageData(frame, 0, 0);
    }

    #drawSubtitles() {
        if (this.#subtitles.length === 0) return;

        const currentTime = this.#videoElement.currentTime;
        
        const activeSub = this.#subtitles.find(sub => 
            currentTime >= sub.start && currentTime <= sub.end
        );

        if (activeSub) {
            this.#ctx.save();
            
            this.#ctx.font = "bold 24px Arial"; 
            this.#ctx.textAlign = "center";
            this.#ctx.textBaseline = "bottom";
            
            const x = this.#canvas.width / 2;
            const y = this.#canvas.height - 40; 

           
            this.#ctx.lineWidth = 4;
            this.#ctx.strokeStyle = "black";
            this.#ctx.strokeText(activeSub.text, x, y);

            
            this.#ctx.fillStyle = "white";
            this.#ctx.fillText(activeSub.text, x, y);

            this.#ctx.restore();
        }
    }

    loadSubtitles(jsonUrl) {
        this.#subtitles = []; 
        if (!jsonUrl) return;

        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                this.#subtitles = data;
                console.log("Subtitrări încărcate:", this.#subtitles.length);
            })
            .catch(err => console.error("Eroare încărcare subtitrări:", err));
    }

    loadVideo(src) {
        cancelAnimationFrame(this.#animationID);
        this.#videoElement.src = src;
        this.#videoElement.load();
        this.#videoElement.play().catch(error => { console.log("Autoplay nu a pornit!"); });
    }

    
    togglePlay() {
        if (this.#videoElement.paused) {
            this.#videoElement.play();
        } else {
            this.#videoElement.pause();
        }
    }
}