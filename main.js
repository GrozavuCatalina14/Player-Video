import { VideoPlayer } from "./video-player.js";


const canvas = document.getElementById('canvas_id');
const video = document.getElementById('video_id');
const playlistUl = document.getElementById('playlistElements');
const dropZone = document.getElementById('dragAndDrop');
const effectButtons = document.querySelectorAll('.effects button');

const btnPrev = document.getElementById('btn_prev');
const btnNext = document.getElementById('btn_next');
const btnPlay = document.getElementById('btn_play');
const volSlider = document.getElementById('vol_slider');
const progressBg = document.getElementById('progress_bg');
const progressFill = document.getElementById('progress_fill');


const previewContainer = document.getElementById('preview_container');
const previewCanvas = document.getElementById('preview_canvas');
const previewCtx = previewCanvas.getContext('2d');
const previewTimeLabel = document.getElementById('preview_time');


const previewVideoElement = document.createElement('video');
previewVideoElement.preload = "auto"; 

const player = new VideoPlayer(canvas, video);



btnPlay.addEventListener('click', () => {
    player.togglePlay();
});

video.addEventListener('play', () => btnPlay.textContent = "⏸");
video.addEventListener('pause', () => btnPlay.textContent = "▶");

btnNext.addEventListener('click', () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlistVideos.length) nextIndex = 0;
    AddVideo(nextIndex);
});

btnPrev.addEventListener('click', () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlistVideos.length - 1;
    AddVideo(prevIndex);
});

volSlider.addEventListener('input', (e) => {
    video.volume = e.target.value;
});


video.addEventListener('timeupdate', () => {
    if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = `${pct}%`;
    }
});

progressBg.addEventListener('click', (e) => {
    const rect = progressBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = clickX / width;
    if (video.duration) {
        video.currentTime = pct * video.duration;
    }
});



progressBg.addEventListener('mousemove', (e) => {
    previewContainer.style.display = 'flex';

    const rect = progressBg.getBoundingClientRect();
    const posX = e.clientX - rect.left; 
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, posX / width));
    
    const previewTime = percent * video.duration;

    previewContainer.style.left = `${posX}px`;
    previewTimeLabel.textContent = formatTime(previewTime);

    if (previewVideoElement.src !== video.src) {
        previewVideoElement.src = video.src;
    }
    
    if (Math.abs(previewVideoElement.currentTime - previewTime) > 0.5) {
        previewVideoElement.currentTime = previewTime;
    }
});

previewVideoElement.addEventListener('seeked', () => {
    previewCtx.drawImage(previewVideoElement, 0, 0, previewCanvas.width, previewCanvas.height);
});

progressBg.addEventListener('mouseleave', () => {
    previewContainer.style.display = 'none';
});



effectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const effectName = e.target.getAttribute('data-effect');
        player.setEffect(effectName);
        effectButtons.forEach(b => b.style.backgroundColor = ''); 
        e.target.style.backgroundColor = '#e74c3c'; 
    });
});

let playlistVideos = [
    { name: "Boat on sea", src: "media/boatOnSea.mp4", subs: "media/subtitrari.json" },
    { name: "Cat and candle", src: "media/catANDcandle.mp4", subs: "media/subtitrari.json" },
    { name: "Presents for Christmas", src: "media/presentsChristmas.mp4", subs: "media/subtitrari.json" },
    { name: "Turle in water", src: "media/turtle.mp4", subs: null }
];
let currentIndex = 0;



function saveSettings() {
    localStorage.setItem('vp_volume', video.volume);
    localStorage.setItem('vp_currentIndex', currentIndex);
    // console.log("Setări salvate:", video.volume, currentIndex);
}

function loadSettings() {
    // Volum
    const savedVolume = localStorage.getItem('vp_volume');
    if (savedVolume !== null) {
        video.volume = parseFloat(savedVolume);
        volSlider.value = video.volume; // Actualizăm și slider-ul vizual
    }

    const savedIndex = localStorage.getItem('vp_currentIndex');
    if (savedIndex !== null) {
        const idx = parseInt(savedIndex);
        if (idx >= 0 && idx < playlistVideos.length) {
            currentIndex = idx;
        }
    }
}

video.addEventListener('volumechange', () => {
    localStorage.setItem('vp_volume', video.volume);
});



function List(){
    playlistUl.innerHTML = '';
    for(let i=0; i<playlistVideos.length; i++){
        const item = playlistVideos[i];
        const listItem = document.createElement("li");
        
        const textSpan = document.createElement("span");
        textSpan.textContent = item.name;
        listItem.appendChild(textSpan);
        
        if(i == currentIndex){
            listItem.classList.add("active");
        }

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "playlist-actions";
        
   
        if (i > 0) {
            const btnUp = document.createElement("button");
            btnUp.className = "btn-mini";
            btnUp.textContent = "▲";
            btnUp.onclick = (e) => { e.stopPropagation(); moveVideo(i, -1); };
            actionsDiv.appendChild(btnUp);
        }
        if (i < playlistVideos.length - 1) {
            const btnDown = document.createElement("button");
            btnDown.className = "btn-mini";
            btnDown.textContent = "▼";
            btnDown.onclick = (e) => { e.stopPropagation(); moveVideo(i, 1); };
            actionsDiv.appendChild(btnDown);
        }
        
        
        const btnDel = document.createElement("button");
        btnDel.className = "btn-mini btn-delete";
        btnDel.textContent = "✖";
        btnDel.onclick = (e) => { e.stopPropagation(); deleteVideo(i); };
        actionsDiv.appendChild(btnDel);

        listItem.appendChild(actionsDiv);
        listItem.addEventListener("click", () => {
            AddVideo(i);
        })
        playlistUl.appendChild(listItem);
    }
}

function deleteVideo(index) {
    playlistVideos.splice(index, 1);
    if (index === currentIndex) {
        if (playlistVideos.length > 0) {
            if (currentIndex >= playlistVideos.length) currentIndex = 0;
            AddVideo(currentIndex);
        } else {
            video.pause();
            video.src = "";
            currentIndex = -1;
            List(); // Redesenăm lista goală
        }
    } else if (index < currentIndex) {
        currentIndex--;
        List();
    } else {
        List();
    }
}

function moveVideo(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= playlistVideos.length) return;

    const temp = playlistVideos[index];
    playlistVideos[index] = playlistVideos[newIndex];
    playlistVideos[newIndex] = temp;

    if (currentIndex === index) {
        currentIndex = newIndex;
    } else if (currentIndex === newIndex) {
        currentIndex = index;
    }
    List();
}

function AddVideo(index){
    if (index < 0 || index >= playlistVideos.length) return;
    currentIndex = index;
    saveSettings();

    const item = playlistVideos[currentIndex];
    
    player.loadVideo(item.src);
   
    previewVideoElement.src = item.src; 

    // Încărcăm subtitrări
    if (item.subs) {
        player.loadSubtitles(item.subs);
    } else {
        player.loadSubtitles(null);
    }
    List();
}

video.addEventListener('ended', () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlistVideos.length) nextIndex = 0; 
    AddVideo(nextIndex);
});


dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.border = '2px dashed white'; 
});
dropZone.addEventListener('dragleave', () => { dropZone.style.border = 'none'; });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.border = 'none';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('video/')) {
                const videoUrl = URL.createObjectURL(file);
                playlistVideos.push({ name: file.name, src: videoUrl, subs: null });
            }
        }
        List();
    }
});

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}


loadSettings();


List();


if (playlistVideos.length > 0) {
    
    AddVideo(currentIndex);
}