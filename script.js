/**
 * FLASHFRAME - Photobooth Logic
 * Client-side only camera, canvas compositing, and state management.
 */

// --- CONFIGURATION DATA ---
const FRAMES = [
  { id: 'classic', name: 'Classic', color: '#FFFFFF', border: '#EFE7DC', text: '#1D1B19' },
  { id: 'minimal', name: 'Minimal', color: '#1D1B19', border: '#1D1B19', text: '#F7F2EA' },
  { id: 'pink', name: 'Pink', color: '#E8C9C4', border: '#FFFFFF', text: '#1D1B19' },
  { id: 'retro', name: 'Retro', color: '#C7A27C', border: '#6D6258', text: '#1D1B19' },
  { id: 'midnight', name: 'Midnight', color: '#2C303A', border: '#1D1B19', text: '#EFE7DC' },
  { id: 'cream', name: 'Cream', color: '#F7F2EA', border: '#C7A27C', text: '#6D6258' },
  { id: 'party', name: 'Party', color: '#FFD700', border: '#FF4500', text: '#1D1B19' }, // Vibrant for party
  { id: 'love', name: 'Love', color: '#FFF0F5', border: '#FF69B4', text: '#8B0000' },
  { id: 'graduation', name: 'Graduation', color: '#002147', border: '#D4AF37', text: '#FFFFFF' },
  { id: 'checkered', name: 'Checkered', color: '#B3D4E0', border: '#F7F2EA', text: '#1D1B19', pattern: 'checker' },
  { id: 'toystory', name: 'Toy Story', color: '#FCD116', border: '#8B4513', text: '#111111', pattern: 'grid' },
  { id: 'spiderman', name: 'Spiderman', color: '#111111', border: '#333333', text: '#FFFFFF', pattern: 'dots' }
];

const ASSETS = {
  spider1: new Image(),
  spider2: new Image(),
  spider3: new Image(),
  spider4: new Image(),
  tsAliens: new Image(),
  tsJessie: new Image(),
  tsWoody: new Image(),
  tsBullseye: new Image(),
  tsSlinky: new Image(),
  tsLogo: new Image(),
  tsBuzz: new Image(),
  tsGroup: new Image()
};

function onAssetLoaded() {
  if (appState && appState.currentState === STATES.RESULT && appState.rawPhotos.length > 0) {
    renderFinalComposite();
  }
}

ASSETS.spider1.onload = onAssetLoaded;
ASSETS.spider2.onload = onAssetLoaded;
ASSETS.spider3.onload = onAssetLoaded;
ASSETS.spider4.onload = onAssetLoaded;

ASSETS.tsAliens.onload = onAssetLoaded;
ASSETS.tsJessie.onload = onAssetLoaded;
ASSETS.tsWoody.onload = onAssetLoaded;
ASSETS.tsBullseye.onload = onAssetLoaded;
ASSETS.tsSlinky.onload = onAssetLoaded;
ASSETS.tsLogo.onload = onAssetLoaded;
ASSETS.tsBuzz.onload = onAssetLoaded;
ASSETS.tsGroup.onload = onAssetLoaded;

ASSETS.spider1.src = 'assets/spider-1.png?v=1';
ASSETS.spider2.src = 'assets/spider-2.png?v=1';
ASSETS.spider3.src = 'assets/spider-3.png?v=1';
ASSETS.spider4.src = 'assets/spider-4.png?v=1';

ASSETS.tsAliens.src = 'assets/ts-aliens.png?v=1';
ASSETS.tsJessie.src = 'assets/ts-jessie.png?v=1';
ASSETS.tsWoody.src = 'assets/ts-woody.png?v=1';
ASSETS.tsBullseye.src = 'assets/ts-bullseye.png?v=1';
ASSETS.tsSlinky.src = 'assets/ts-slinky.png?v=1';
ASSETS.tsLogo.src = 'assets/ts-logo.png?v=1';
ASSETS.tsBuzz.src = 'assets/ts-buzz.png?v=1';
ASSETS.tsGroup.src = 'assets/ts-group.png?v=1';

const STATES = {
  LANDING: 'state-landing',
  ERROR: 'state-error',
  STUDIO: 'state-studio',
  PROCESSING: 'state-processing',
  RESULT: 'state-result'
};

// --- APPLICATION STATE ---
const appState = {
  currentState: STATES.LANDING,
  stream: null,
  videoDevices: [],
  currentDeviceIndex: 0,
  rawPhotos: [], // Array of canvas elements or dataURLs (un-mirrored)
  prefs: {
    photoCount: 4,
    countdown: 3,
    filter: 'original',
    frame: 'classic',
    layout: 'classic',
    sound: true,
    eventMode: false,
    eventName: ''
  }
};

// --- DOM ELEMENTS ---
const DOM = {
  // Navigation & Drawers
  navStartBtn: document.getElementById('navStartBtn'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  mobileDrawer: document.getElementById('mobileDrawer'),
  closeDrawerBtn: document.getElementById('closeDrawerBtn'),
  drawerHome: document.getElementById('drawerHome'),
  drawerHowItWorks: document.getElementById('drawerHowItWorks'),
  
  // Landing
  heroStartBtn: document.getElementById('heroStartBtn'),
  
  // Error
  retryCameraBtn: document.getElementById('retryCameraBtn'),
  backToHomeBtn: document.getElementById('backToHomeBtn'),
  errorMessage: document.getElementById('errorMessage'),
  
  // Studio
  videoContainer: document.getElementById('videoContainer'),
  layoutGuide: document.getElementById('layoutGuide'),
  video: document.getElementById('cameraVideo'),
  countdownOverlay: document.getElementById('countdownOverlay'),
  countdownText: document.getElementById('countdownText'),
  shutterFlash: document.getElementById('shutterFlash'),
  captureProgress: document.getElementById('captureProgress'),
  progressText: document.getElementById('progressText'),
  progressBarFill: document.getElementById('progressBarFill'),
  
  // Controls
  switchCameraBtn: document.getElementById('switchCameraBtn'),
  soundToggle: document.getElementById('soundToggle'),
  captureBtn: document.getElementById('captureBtn'),
  photoCountRadios: document.getElementsByName('photoCount'),
  countdownRadios: document.getElementsByName('countdownTime'),
  frameSelect: document.getElementById('frameSelect'),
  filterSelect: document.getElementById('filterSelect'),
  layoutSelect: document.getElementById('layoutSelect'),
  eventModeToggle: document.getElementById('eventModeToggle'),
  eventNameInput: document.getElementById('eventNameInput'),
  
  // Result
  finalImagePreview: document.getElementById('finalImagePreview'),
  finalCanvas: document.getElementById('finalCanvas'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  startOverBtn: document.getElementById('startOverBtn'),
  shareFallbackMsg: document.getElementById('shareFallbackMsg')
};

// --- AUDIO SYNTHESIS (No external files needed) ---
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playBeep() {
    if (!appState.prefs.sound) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) { console.warn("Audio play failed", e); }
  },
  playShutter() {
    if (!appState.prefs.sound) return;
    this.init();
    try {
      // Noise burst for shutter
      const bufferSize = this.ctx.sampleRate * 0.1; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch (e) { console.warn("Audio play failed", e); }
  }
};

// --- INITIALIZATION ---
function init() {
  loadPreferences();
  populateFrames();
  setupEventListeners();
  
  const lastState = sessionStorage.getItem('flashframe_state');
  const savedPhotos = sessionStorage.getItem('flashframe_photos');
  
  if (lastState === STATES.RESULT && savedPhotos) {
    try {
      const photoURLs = JSON.parse(savedPhotos);
      appState.rawPhotos = [];
      let loaded = 0;
      Object.values(STATES).forEach(id => document.getElementById(id).classList.remove('is-active'));
      document.getElementById(STATES.PROCESSING).classList.add('is-active');
      
      photoURLs.forEach((url, i) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1200; canvas.height = 900;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          appState.rawPhotos[i] = canvas;
          loaded++;
          if (loaded === photoURLs.length) {
            renderFinalComposite();
          }
        };
        img.src = url;
      });
    } catch (e) {
      setState(STATES.STUDIO);
      startCamera();
    }
  } else if (lastState && lastState !== STATES.LANDING && lastState !== STATES.PROCESSING && lastState !== STATES.COUNTDOWN && lastState !== STATES.CAPTURING) {
    setState(STATES.STUDIO);
    startCamera();
  } else {
    setState(STATES.LANDING);
  }
  
  // Check Share API support
  if (!navigator.share) {
    DOM.shareBtn.disabled = true;
    DOM.shareBtn.style.opacity = '0.5';
    DOM.shareFallbackMsg.classList.remove('hidden');
  }
}

// --- STATE MANAGEMENT ---
function setState(newState) {
  // Hide all sections
  Object.values(STATES).forEach(id => {
    document.getElementById(id).classList.remove('is-active');
  });
  
  // Show new section
  document.getElementById(newState).classList.add('is-active');
  appState.currentState = newState;
  sessionStorage.setItem('flashframe_state', newState);
  
  // Handle side effects
  if (newState !== STATES.STUDIO && newState !== STATES.CAPTURING && newState !== STATES.COUNTDOWN) {
    stopCamera();
  }
}

function showError(message) {
  DOM.errorMessage.textContent = message;
  setState(STATES.ERROR);
}

// --- PREFERENCES (LocalStorage) ---
function loadPreferences() {
  try {
    const saved = localStorage.getItem('flashframe_prefs');
    if (saved) {
      appState.prefs = { ...appState.prefs, ...JSON.parse(saved) };
    }
  } catch (e) { console.warn("Could not load preferences", e); }
  
  // Sync UI with loaded prefs
  Array.from(DOM.photoCountRadios).forEach(r => r.checked = (parseInt(r.value) === appState.prefs.photoCount));
  Array.from(DOM.countdownRadios).forEach(r => r.checked = (parseInt(r.value) === appState.prefs.countdown));
  
  DOM.frameSelect.value = appState.prefs.frame;
  DOM.filterSelect.value = appState.prefs.filter;
  DOM.layoutSelect.value = appState.prefs.layout;
  DOM.soundToggle.checked = appState.prefs.sound;
  
  DOM.eventModeToggle.checked = appState.prefs.eventMode;
  DOM.eventNameInput.disabled = !appState.prefs.eventMode;
  DOM.eventNameInput.value = appState.prefs.eventName;
  
  applyPreviewFilter(appState.prefs.filter);
  applyLivePreview();
}

function applyLivePreview() {
  const frameConfig = FRAMES.find(f => f.id === appState.prefs.frame);
  if (frameConfig) {
    DOM.videoContainer.style.backgroundColor = frameConfig.color;
    DOM.videoContainer.style.borderColor = frameConfig.border !== frameConfig.color ? frameConfig.border : 'transparent';
  }
  
  const layout = appState.prefs.layout;
  DOM.layoutGuide.className = 'layout-guide'; // Reset classes
  if (layout === 'grid') {
    DOM.layoutGuide.classList.add('is-grid');
  } else if (layout === 'vertical' || layout === 'classic') {
    DOM.layoutGuide.classList.add('is-vertical');
  }
}

function savePreferences() {
  try {
    localStorage.setItem('flashframe_prefs', JSON.stringify(appState.prefs));
  } catch (e) { console.warn("Could not save preferences", e); }
}

// --- CAMERA LOGIC ---
async function startCamera(deviceId = null) {
  if (appState.stream) {
    stopCamera();
  }
  
  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: deviceId ? undefined : 'user',
      deviceId: deviceId ? { exact: deviceId } : undefined
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    appState.stream = stream;
    DOM.video.srcObject = stream;
    
    // Enumerate devices for switch camera button
    if (appState.videoDevices.length === 0) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      appState.videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (appState.videoDevices.length > 1) {
        DOM.switchCameraBtn.classList.remove('hidden');
      }
    }
    
    setState(STATES.STUDIO);
  } catch (err) {
    console.error("Camera access error:", err);
    showError("Camera access was denied or is not available. Please check your browser settings and try again.");
  }
}

function stopCamera() {
  if (appState.stream) {
    appState.stream.getTracks().forEach(track => track.stop());
    appState.stream = null;
  }
  DOM.video.srcObject = null;
}

async function switchCamera() {
  if (appState.videoDevices.length < 2) return;
  
  appState.currentDeviceIndex = (appState.currentDeviceIndex + 1) % appState.videoDevices.length;
  const nextDeviceId = appState.videoDevices[appState.currentDeviceIndex].deviceId;
  
  await startCamera(nextDeviceId);
}

// --- UI POPULATION ---
function populateFrames() {
  DOM.frameSelect.innerHTML = '';
  
  FRAMES.forEach(frame => {
    const option = document.createElement('option');
    option.value = frame.id;
    option.textContent = frame.name;
    if (frame.id === appState.prefs.frame) option.selected = true;
    DOM.frameSelect.appendChild(option);
  });
}

function applyPreviewFilter(filterName) {
  let cssFilter = 'none';
  switch (filterName) {
    case 'warm': cssFilter = 'sepia(0.3) saturate(1.2) brightness(1.05)'; break;
    case 'vintage': cssFilter = 'sepia(0.5) contrast(0.9) saturate(0.8)'; break;
    case 'bw': cssFilter = 'grayscale(1) contrast(1.1)'; break;
    case 'soft': cssFilter = 'brightness(1.1) contrast(0.9) blur(0.5px)'; break;
    case 'cinema': cssFilter = 'contrast(1.2) saturate(1.1) brightness(0.9)'; break;
  }
  // Keep the mirror scaleX(-1) while adding the filter
  DOM.video.style.filter = cssFilter;
  DOM.video.style.transform = 'scaleX(-1)'; 
}

// --- CAPTURE FLOW ---
function startSession() {
  appState.rawPhotos = [];
  DOM.captureBtn.disabled = true;
  DOM.captureProgress.classList.remove('hidden');
  captureSequence(1);
}

function captureSequence(currentPhotoNum) {
  if (currentPhotoNum > appState.prefs.photoCount) {
    // Done capturing
    DOM.captureProgress.classList.add('hidden');
    DOM.captureBtn.disabled = false;
    setState(STATES.PROCESSING);
    
    // Yield to let UI update before heavy canvas work
    setTimeout(() => {
      renderFinalComposite();
    }, 100);
    return;
  }

  // Update Progress UI
  DOM.progressText.textContent = `PHOTO ${currentPhotoNum} / ${appState.prefs.photoCount}`;
  DOM.progressBarFill.style.width = `${((currentPhotoNum - 1) / appState.prefs.photoCount) * 100}%`;
  
  // Start Countdown
  let seconds = appState.prefs.countdown;
  DOM.countdownOverlay.classList.remove('hidden');
  DOM.countdownText.textContent = seconds;
  
  AudioEngine.init(); // ensure context is ready
  
  const tick = setInterval(() => {
    seconds--;
    if (seconds > 0) {
      DOM.countdownText.textContent = seconds;
      DOM.countdownText.style.animation = 'none';
      void DOM.countdownText.offsetWidth; // trigger reflow
      DOM.countdownText.style.animation = 'popIn 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      AudioEngine.playBeep();
    } else {
      clearInterval(tick);
      DOM.countdownOverlay.classList.add('hidden');
      performCapture();
      
      // Update progress bar full for this photo
      DOM.progressBarFill.style.width = `${(currentPhotoNum / appState.prefs.photoCount) * 100}%`;
      
      // Brief pause before next photo
      setTimeout(() => {
        captureSequence(currentPhotoNum + 1);
      }, 1000);
    }
  }, 1000);
}

function performCapture() {
  // Flash effect
  DOM.shutterFlash.classList.remove('hidden');
  DOM.shutterFlash.classList.add('flash-anim');
  AudioEngine.playShutter();
  
  setTimeout(() => {
    DOM.shutterFlash.classList.remove('flash-anim');
    DOM.shutterFlash.classList.add('hidden');
  }, 200);

  // Capture to Raw Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Use actual video dimensions
  const vw = DOM.video.videoWidth;
  const vh = DOM.video.videoHeight;
  
  // Crop to 4:3 if video is wider (e.g. 16:9 webcam) to match standard photobooth
  let targetAspect = 4/3;
  let sWidth = vw;
  let sHeight = vw / targetAspect;
  let sx = 0;
  let sy = (vh - sHeight) / 2;

  if (sHeight > vh) {
    sHeight = vh;
    sWidth = vh * targetAspect;
    sx = (vw - sWidth) / 2;
    sy = 0;
  }

  // We want high res for output, but standard aspect
  canvas.width = 1200;
  canvas.height = 900;

  // IMPORTANT: Un-mirror the captured image
  // The video element is mirrored via CSS (`transform: scaleX(-1)`).
  // The raw frame from `getUserMedia` is NOT mirrored (it's exactly what the camera sees).
  // Since we want the final output to NOT be mirrored (so text reads correctly),
  // we actually DON'T need to flip it here if we want the true real-world orientation.
  // Wait, standard self-facing cameras stream as if you are looking at a mirror? No, they stream real-world.
  // CSS flips it for UX. So drawing it directly to canvas gives the real-world (un-mirrored) result!
  
  // Actually, some devices might flip it in hardware. 
  // Standard WebRTC facingMode 'user' usually gives a non-mirrored frame.
  // We will flip it horizontally during draw so that it matches what the user saw, but wait...
  // The prompt says: "hasil capture akhir harus dikoreksi agar tidak terbalik".
  // This means the final output should be like a normal photograph (what someone else sees).
  // This is the default behavior of `drawImage` from a webcam.
  
  ctx.drawImage(DOM.video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  
  appState.rawPhotos.push(canvas);
}

// --- COMPOSITING ENGINE ---

function renderFinalComposite() {
  const canvas = DOM.finalCanvas;
  const ctx = canvas.getContext('2d');
  
  const frameId = appState.prefs.frame;
  const layoutId = appState.prefs.layout;
  const filterId = appState.prefs.filter;
  const frameConfig = FRAMES.find(f => f.id === frameId);
  
  const photos = appState.rawPhotos;
  const count = photos.length;
  
  // 1. Determine Dimensions based on Layout & Photo Count
  let cWidth, cHeight;
  let padding = 60;
  let topPad = 120;
  let bottomPadding = 180; // Space for logo/date
  let innerGap = 30;
  
  const photoW = 1200;
  const photoH = 900;
  
  let rects = []; // {x, y, w, h}
  
  if (layoutId === 'classic' || layoutId === 'vertical') {
    // Vertical stack
    if (layoutId === 'classic' && (count === 3 || count === 4)) {
      // Force 1:3 ratio for standard 2x6 photobooth strip
      cWidth = 1200;
      cHeight = 3600;
      
      padding = 80;
      const gap = 40;
      const photoW = cWidth - (padding * 2);
      
      topPad = 120;
      const bottomPad = 320; // Room for branding
      const availableHeight = cHeight - topPad - bottomPad - (gap * (count - 1));
      const photoH = availableHeight / count;
      
      for (let i = 0; i < count; i++) {
        rects.push({
          x: padding,
          y: topPad + (i * (photoH + gap)),
          w: photoW,
          h: photoH
        });
      }
    } else {
      cWidth = photoW + (padding * 2);
      cHeight = (photoH * count) + (innerGap * (count - 1)) + padding + bottomPadding;
      
      for (let i = 0; i < count; i++) {
        rects.push({
          x: padding,
          y: padding + (i * (photoH + innerGap)),
          w: photoW,
          h: photoH
        });
      }
    }
  } 
  else if (layoutId === 'grid') {
    // 2x2 grid (if 4 photos), 2x3 (if 6), etc.
    const cols = 2;
    const rows = Math.ceil(count / cols);
    
    cWidth = (photoW * cols) + (innerGap * (cols - 1)) + (padding * 2);
    cHeight = (photoH * rows) + (innerGap * (rows - 1)) + padding + bottomPadding;
    
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      rects.push({
        x: padding + (col * (photoW + innerGap)),
        y: padding + (row * (photoH + innerGap)),
        w: photoW,
        h: photoH
      });
    }
  }
  else if (layoutId === 'polaroid') {
    // Similar to vertical, but individual thick white borders around each
    padding = 80;
    innerGap = 60;
    cWidth = photoW + (padding * 2);
    cHeight = (photoH * count) + (innerGap * (count - 1)) + padding + bottomPadding;
    
    for (let i = 0; i < count; i++) {
      rects.push({
        x: padding,
        y: padding + (i * (photoH + innerGap)),
        w: photoW,
        h: photoH
      });
    }
  }

  // Set Canvas size
  canvas.width = cWidth;
  canvas.height = cHeight;
  
  // 2. Draw Frame Background
  ctx.fillStyle = frameConfig.color;
  ctx.fillRect(0, 0, cWidth, cHeight);
  
  if (frameConfig.pattern === 'checker') {
    ctx.fillStyle = frameConfig.border;
    const size = 120; // checker size
    for(let y = 0; y < cHeight; y += size) {
      for(let x = 0; x < cWidth; x += size) {
        if ((Math.floor(x/size) + Math.floor(y/size)) % 2 === 0) {
          ctx.fillRect(x, y, size, size);
        }
      }
    }
  } else if (frameConfig.pattern === 'dots') {
    ctx.fillStyle = frameConfig.border;
    const spacing = 40;
    const radius = 6;
    for(let y = 0; y < cHeight; y += spacing) {
      for(let x = 0; x < cWidth; x += spacing) {
        // Offset alternate rows for a halftone look
        const offsetX = (Math.floor(y / spacing) % 2 === 0) ? 0 : spacing / 2;
        ctx.beginPath();
        ctx.arc(x + offsetX, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (frameConfig.pattern === 'grid') {
    // Toy Story grid (Woody shirt pattern)
    ctx.strokeStyle = frameConfig.border;
    ctx.lineWidth = 4;
    const spacing = 80; // Size of grid squares
    
    // Draw horizontal lines
    for(let y = 0; y < cHeight; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cWidth, y);
      ctx.stroke();
    }
    // Draw vertical lines
    for(let x = 0; x < cWidth; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cHeight);
      ctx.stroke();
    }
  }
  
  // Decorative border for certain frames
  if (frameConfig.id !== 'minimal' && frameConfig.id !== 'polaroid' && !frameConfig.pattern) {
    ctx.strokeStyle = frameConfig.border;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, cWidth - 40, cHeight - 40);
  }

  // Helper for rounded corners
  function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Helper for object-fit: cover drawing
  function drawImageCover(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sWidth = img.width;
    let sHeight = img.height;
    let sx = 0;
    let sy = 0;
    
    if (imgRatio > targetRatio) {
      sWidth = img.height * targetRatio;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / targetRatio;
      sy = (img.height - sHeight) / 2;
    }
    
    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  }

  // 3. Draw Photos with Filter
  for (let i = 0; i < count; i++) {
    const rect = rects[i];
    
    // Draw white polaroid backing if layout is polaroid
    if (layoutId === 'polaroid') {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      drawRoundRect(ctx, rect.x - 20, rect.y - 20, rect.w + 40, rect.h + 80, 20);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // Reset shadow
    }

    ctx.save();
    
    let radius = 30; // Default rounded corners
    if (frameConfig.id === 'checkered' && count === 3 && (i === 0 || i === 2)) {
      radius = 400; // Oval/cloud-like corners for 1st and 3rd photos (almost full pill)
    }
    
    // Toy Story cow print border
    if (frameConfig.id === 'toystory') {
      const bThick = 25;
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(ctx, rect.x - bThick, rect.y - bThick, rect.w + bThick*2, rect.h + bThick*2, radius + 10);
      ctx.fill();
      
      ctx.save();
      drawRoundRect(ctx, rect.x - bThick, rect.y - bThick, rect.w + bThick*2, rect.h + bThick*2, radius + 10);
      ctx.clip();
      ctx.fillStyle = '#111111';
      let rnd = rect.x + rect.y; 
      function r() { rnd = (rnd * 16807) % 2147483647; return (rnd - 1) / 2147483646; }
      for(let s=0; s<35; s++) {
        let sx = rect.x - bThick + r() * (rect.w + bThick*2);
        let sy = rect.y - bThick + r() * (rect.h + bThick*2);
        ctx.beginPath();
        let sr = 12 + r() * 28;
        for(let a=0; a<Math.PI*2; a+=0.5) {
          let r2 = sr * (0.6 + r() * 0.8);
          ctx.lineTo(sx + Math.cos(a)*r2, sy + Math.sin(a)*r2);
        }
        ctx.fill();
      }
      ctx.restore();
    }
    
    drawRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.clip();

    // Apply Filter string to canvas context
    let filterString = 'none';
    switch (filterId) {
      case 'warm': filterString = 'sepia(30%) saturate(120%) brightness(105%)'; break;
      case 'vintage': filterString = 'sepia(50%) contrast(90%) saturate(80%)'; break;
      case 'bw': filterString = 'grayscale(100%) contrast(110%)'; break;
      case 'soft': filterString = 'brightness(110%) contrast(90%) blur(0.5px)'; break;
      case 'cinema': filterString = 'contrast(120%) saturate(110%) brightness(90%)'; break;
    }
    ctx.filter = filterString;
    
    // Draw photo using cover logic to prevent squishing
    drawImageCover(ctx, photos[i], rect.x, rect.y, rect.w, rect.h);
    
    // Reset filter
    ctx.filter = 'none';
    ctx.restore(); // Restore clipping path
  }

  // 4. Draw Branding & Text
  ctx.textAlign = 'center';
  
  if (frameConfig.id === 'spiderman') {
    // Draw the angled red polygon at the bottom
    ctx.fillStyle = '#E23636'; // Spiderman Red
    ctx.beginPath();
    ctx.moveTo(0, cHeight - 150);
    ctx.lineTo(cWidth, cHeight - 450);
    ctx.lineTo(cWidth, cHeight);
    ctx.lineTo(0, cHeight);
    ctx.closePath();
    ctx.fill();

    // SPIDER-MAN Text
    ctx.font = 'italic 900 130px "Inter", sans-serif'; 
    ctx.strokeStyle = '#0047AB'; // Blue shadow/stroke
    ctx.lineWidth = 20;
    ctx.lineJoin = 'round';
    ctx.strokeText("SPIDER-MAN", cWidth / 2, cHeight - 150);
    
    ctx.fillStyle = '#E23636'; // Red text
    ctx.fillText("SPIDER-MAN", cWidth / 2, cHeight - 150);

    // Subtext
    ctx.font = 'bold 45px "Inter", sans-serif';
    ctx.fillStyle = '#FFD700'; // Yellow
    ctx.fillText("BRAND NEW DAY", cWidth / 2, cHeight - 80);
  } else {
    ctx.fillStyle = frameConfig.text;
    
    // Event Name or Default Branding
    let mainText = "FLASHFRAME";
    if (appState.prefs.eventMode && appState.prefs.eventName.trim() !== '') {
      mainText = appState.prefs.eventName.toUpperCase();
    }
    
    ctx.font = 'bold 50px "Playfair Display", serif';
    ctx.fillText(mainText, cWidth / 2, cHeight - 80);
    
    // Date
    const dateOpts = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', dateOpts).toUpperCase();
    ctx.font = '30px "Inter", sans-serif';
    ctx.letterSpacing = "4px"; 
    if (ctx.letterSpacing !== undefined) {
      ctx.letterSpacing = "4px";
    }
    ctx.fillText(dateStr, cWidth / 2, cHeight - 40);
    if (ctx.letterSpacing !== undefined) {
      ctx.letterSpacing = "0px";
    }
  }

  // Update Preview Image
  
  function drawHeart(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    const s = size / 30; ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 5);
    ctx.bezierCurveTo(0, -10, -15, -10, -15, 5);
    ctx.bezierCurveTo(-15, 15, 0, 20, 0, 30);
    ctx.bezierCurveTo(0, 20, 15, 15, 15, 5);
    ctx.bezierCurveTo(15, -10, 0, -10, 0, 5);
    ctx.fillStyle = '#FF4D6D'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.restore();
  }

  function drawSpiderWeb(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; ctx.lineWidth = 4;
    const rings = 4; const points = 8; const rStep = size / 2 / rings;
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (size/2), Math.sin(a) * (size/2)); ctx.stroke();
    }
    for (let r = 1; r <= rings; r++) {
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const a1 = (i / points) * Math.PI * 2;
        const x1 = Math.cos(a1) * (r * rStep); const y1 = Math.sin(a1) * (r * rStep);
        if (i === 0) ctx.moveTo(x1, y1);
        const a2 = ((i + 1) % points) * Math.PI * 2;
        const x2 = Math.cos(a2) * (r * rStep); const y2 = Math.sin(a2) * (r * rStep);
        const midA = ((i + 0.5) / points) * Math.PI * 2;
        const cx = Math.cos(midA) * (r * rStep * 0.8);
        const cy = Math.sin(midA) * (r * rStep * 0.8);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpider(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    const s = size / 100; ctx.scale(s, s);
    ctx.fillStyle = '#000000'; ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 10, 15, 20, 0, 0, Math.PI * 2); ctx.fill(); // body
    ctx.beginPath(); ctx.ellipse(0, -15, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // head
    function drawLeg(lx1, ly1, lx2, ly2, lx3, ly3) {
      ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.lineTo(lx3, ly3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-lx1, ly1); ctx.lineTo(-lx2, ly2); ctx.lineTo(-lx3, ly3); ctx.stroke();
    }
    drawLeg(10, -15, 35, -30, 45, -10);
    drawLeg(12, -5, 40, -10, 50, 10);
    drawLeg(14, 5, 45, 15, 40, 40);
    drawLeg(10, 15, 30, 35, 20, 55);
    ctx.fillStyle = '#E23636'; ctx.beginPath(); // red logo
    ctx.moveTo(-5, 5); ctx.lineTo(5, 5); ctx.lineTo(-5, 15); ctx.lineTo(5, 15); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    const outerRadius = size / 2; const innerRadius = size / 4; const spikes = 5;
    ctx.beginPath(); let rot = Math.PI / 2 * 3; let step = Math.PI / spikes;
    ctx.moveTo(0, -outerRadius);
    for(let i = 0; i < spikes; i++){
      ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius); rot += step;
      ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius); rot += step;
    }
    ctx.lineTo(0, -outerRadius); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = '#D1363A'; ctx.stroke();
    ctx.fillStyle = '#FFD700'; ctx.fill();
    ctx.restore();
  }

  function drawPlanet(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    const r = size / 3;
    ctx.fillStyle = '#8B5CF6'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#FCD34D'; ctx.lineWidth = size/8;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.4, -0.2, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  function drawImageAsset(ctx, img, x, y, size, angle) {
    if (!img.complete || img.naturalWidth === 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180);
    const aspect = img.height / img.width;
    const drawW = size; const drawH = size * aspect;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // Helper to remove white backgrounds (fake PNGs) via flood fill
  function drawImageAssetNoBg(ctx, img, x, y, size, angle) {
    if (!img.complete || img.naturalWidth === 0) return;
    
    const w = img.naturalWidth; const h = img.naturalHeight;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w; offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(img, 0, 0);
    
    const imgData = offCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const stack = [[0, 0], [w-1, 0], [0, h-1], [w-1, h-1]]; 
    
    function isWhite(px, py) {
      const idx = (py * w + px) * 4;
      return data[idx] > 230 && data[idx+1] > 230 && data[idx+2] > 230 && data[idx+3] > 0;
    }
    
    while(stack.length > 0) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      
      const vIdx = cy * w + cx;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;
      
      if (isWhite(cx, cy)) {
        const idx = (cy * w + cx) * 4;
        data[idx+3] = 0; // Make transparent
        
        stack.push([cx+1, cy]); stack.push([cx-1, cy]);
        stack.push([cx, cy+1]); stack.push([cx, cy-1]);
      }
    }
    offCtx.putImageData(imgData, 0, 0);
    
    ctx.save(); ctx.translate(x, y); 
    // removed rotation support here to simplify alignment logic
    const aspect = h / w;
    const drawW = size; const drawH = size * aspect;
    
    let dx = -drawW / 2;
    let dy = -drawH / 2;
    
    if (angle === 'top-left') { dx = 0; dy = 0; }
    else if (angle === 'top-right') { dx = -drawW; dy = 0; }
    else if (angle === 'bottom-left') { dx = 0; dy = -drawH; }
    else if (angle === 'bottom-right') { dx = -drawW; dy = -drawH; }
    else if (typeof angle === 'number') {
       // if angle is a number, we use center alignment and rotate
       ctx.rotate(angle * Math.PI / 180);
    }
    
    ctx.drawImage(offCanvas, dx, dy, drawW, drawH);
    ctx.restore();
  }

  // Helper to draw transparent PNGs (without the flood-fill hack)
  function drawAssetNormal(ctx, img, x, y, size, angle = 0) {
    if (!img.complete || img.naturalWidth === 0) return;
    const aspect = img.height / img.width;
    const drawW = size; const drawH = size * aspect;
    let dx = -drawW / 2; let dy = -drawH / 2;
    if (angle === 'top-left') { dx = 0; dy = 0; }
    else if (angle === 'top-right') { dx = -drawW; dy = 0; }
    else if (angle === 'bottom-left') { dx = 0; dy = -drawH; }
    else if (angle === 'bottom-right') { dx = -drawW; dy = -drawH; }
    
    ctx.save(); ctx.translate(x, y);
    if (typeof angle === 'number') ctx.rotate(angle * Math.PI / 180);
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
  }

  if (frameConfig.id === 'love') {
    drawHeart(ctx, cWidth * 0.15, topPad / 2 || 80, 120, -15);
    drawHeart(ctx, cWidth * 0.85, topPad / 2 || 80, 90, 20);
    drawHeart(ctx, cWidth * 0.15, cHeight - 120, 100, -10);
    drawHeart(ctx, cWidth * 0.85, cHeight - 100, 130, 15);
  } else if (frameConfig.id === 'toystory') {
    drawAssetNormal(ctx, ASSETS.tsAliens, 20, 20, 320, 'top-left');
    
    if (count >= 3) {
       const p1 = rects[0]; const p2 = rects[1]; const p3 = rects[2];
       drawAssetNormal(ctx, ASSETS.tsJessie, cWidth + 10, p1.y + p1.h - 50, 300, 'bottom-right');
       drawAssetNormal(ctx, ASSETS.tsSlinky, 10, p2.y - 20, 350, 'bottom-left');
       drawAssetNormal(ctx, ASSETS.tsWoody, -10, p3.y + 40, 280, 'bottom-left');
       drawAssetNormal(ctx, ASSETS.tsBullseye, cWidth - 10, p2.y + p2.h + 20, 250, 'bottom-right');
    }
    
    // Bottom area
    drawAssetNormal(ctx, ASSETS.tsLogo, 40, cHeight - 40, 320, 'bottom-left');
    
    ctx.fillStyle = '#111111';
    ctx.font = 'normal 80px "Playfair Display", serif';
    ctx.fillText("XOXO", 200, cHeight - 50);

    drawAssetNormal(ctx, ASSETS.tsGroup, cWidth - 20, cHeight - 10, 480, 'bottom-right');
    drawAssetNormal(ctx, ASSETS.tsBuzz, cWidth - 100, cHeight - 380, 300, 'bottom-right');
  } else if (frameConfig.id === 'spiderman') {
    // Tanda seru (spider3) di kiri atas, miring
    const s3Size = 350;
    drawImageAssetNoBg(ctx, ASSETS.spider3, 180, 160, s3Size, -25);
    
    // Kepala Spiderman (spider4) di kanan atas, agak gedein
    const s4Size = 480;
    drawImageAssetNoBg(ctx, ASSETS.spider4, cWidth - 10, 10, s4Size, 'top-right');
  }
  
  // 4. Draw Branding & Text
  DOM.finalImagePreview.src = canvas.toDataURL('image/png');

  try {
    const serializedPhotos = appState.rawPhotos.map(c => c.toDataURL('image/jpeg', 0.8));
    sessionStorage.setItem('flashframe_photos', JSON.stringify(serializedPhotos));
  } catch (e) { console.warn("Failed to persist photos", e); }

  setState(STATES.RESULT);
}

// --- OUTPUT ACTIONS ---
function downloadPhoto() {
  const dataURL = DOM.finalCanvas.toDataURL('image/png');
  const date = new Date().toISOString().split('T')[0];
  const filename = `flashframe-${date}.png`;
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function sharePhoto() {
  if (!navigator.share) return;
  
  try {
    DOM.finalCanvas.toBlob(async (blob) => {
      const date = new Date().toISOString().split('T')[0];
      const filename = `flashframe-${date}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Flashframe Photo',
          text: 'Check out my photobooth strip from Flashframe!',
          files: [file]
        });
      } else {
        // Fallback for browsers that support share but not files
        DOM.shareFallbackMsg.textContent = "Your device doesn't support sharing image files directly.";
        DOM.shareFallbackMsg.classList.remove('hidden');
      }
    }, 'image/png');
  } catch (err) {
    console.error("Error sharing:", err);
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Navigation
  const openLanding = () => setState(STATES.LANDING);
  const openStudio = () => startCamera();
  const openResult = () => {
    if (appState.rawPhotos.length > 0) {
      renderFinalComposite();
    } else {
      setState(STATES.RESULT);
    }
  };

  DOM.drawerHome.addEventListener('click', () => { DOM.mobileDrawer.classList.remove('is-open'); openLanding(); });
  document.querySelector('.nav-link[href="#home"]').addEventListener('click', (e) => { e.preventDefault(); openLanding(); });
  
  document.getElementById('drawerStudio').addEventListener('click', () => { DOM.mobileDrawer.classList.remove('is-open'); openStudio(); });
  document.querySelector('.nav-link[href="#studio"]').addEventListener('click', (e) => { e.preventDefault(); openStudio(); });
  
  document.getElementById('drawerResult').addEventListener('click', () => { DOM.mobileDrawer.classList.remove('is-open'); openResult(); });
  document.querySelector('.nav-link[href="#result"]').addEventListener('click', (e) => { e.preventDefault(); openResult(); });
  
  // Mobile Menu
  DOM.mobileMenuBtn.addEventListener('click', () => DOM.mobileDrawer.classList.add('is-open'));
  DOM.closeDrawerBtn.addEventListener('click', () => DOM.mobileDrawer.classList.remove('is-open'));
  
  // Start Flow
  const handleStart = () => {
    DOM.mobileDrawer.classList.remove('is-open');
    startCamera();
  };
  DOM.navStartBtn.addEventListener('click', handleStart);
  DOM.heroStartBtn.addEventListener('click', handleStart);
  DOM.retryCameraBtn.addEventListener('click', handleStart);
  
  DOM.backToHomeBtn.addEventListener('click', openLanding);
  
  // Studio Controls
  DOM.switchCameraBtn.addEventListener('click', switchCamera);
  
  DOM.soundToggle.addEventListener('change', (e) => {
    appState.prefs.sound = e.target.checked;
    savePreferences();
  });
  
  Array.from(DOM.photoCountRadios).forEach(r => {
    r.addEventListener('change', (e) => {
      const count = parseInt(e.target.value);
      appState.prefs.photoCount = count;
      
      // Auto-adjust layout based on photo count for best results
      if (count === 3) {
        appState.prefs.layout = 'classic';
        DOM.layoutSelect.value = 'classic';
      } else if (count === 4) {
        appState.prefs.layout = 'grid';
        DOM.layoutSelect.value = 'grid';
      }
      
      savePreferences();
      applyLivePreview();
    });
  });
  
  Array.from(DOM.countdownRadios).forEach(r => {
    r.addEventListener('change', (e) => {
      appState.prefs.countdown = parseInt(e.target.value);
      savePreferences();
    });
  });
  
  DOM.frameSelect.addEventListener('change', (e) => {
    appState.prefs.frame = e.target.value;
    savePreferences();
    applyLivePreview();
  });
  
  DOM.filterSelect.addEventListener('change', (e) => {
    appState.prefs.filter = e.target.value;
    applyPreviewFilter(e.target.value);
    savePreferences();
  });
  
  DOM.layoutSelect.addEventListener('change', (e) => {
    appState.prefs.layout = e.target.value;
    savePreferences();
    applyLivePreview();
  });
  
  DOM.eventModeToggle.addEventListener('change', (e) => {
    appState.prefs.eventMode = e.target.checked;
    DOM.eventNameInput.disabled = !e.target.checked;
    if (e.target.checked) DOM.eventNameInput.focus();
    savePreferences();
  });
  
  DOM.eventNameInput.addEventListener('input', (e) => {
    appState.prefs.eventName = e.target.value;
    savePreferences();
  });
  
  // Capture
  DOM.captureBtn.addEventListener('click', startSession);
  
  // Actions
  DOM.downloadBtn.addEventListener('click', downloadPhoto);
  DOM.shareBtn.addEventListener('click', sharePhoto);
  
  DOM.retakeBtn.addEventListener('click', () => {
    appState.rawPhotos = [];
    startCamera(appState.videoDevices[appState.currentDeviceIndex]?.deviceId);
  });
  
  DOM.startOverBtn.addEventListener('click', () => {
    appState.rawPhotos = [];
    setState(STATES.LANDING);
  });
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
