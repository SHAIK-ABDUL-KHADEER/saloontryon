// ===== STATE =====
const state = {
  customerName: '',
  photoFilename: null,
  photoDataUrl: null,
  selectedHairstyle: null,
  selectedBeard: null,
  styles: { hairstyles: [], beards: [] },
  stream: null,
};

// ===== DOM REFS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadStyles();
  loadHistory();
  initRevealAnimations();
  initNameInput();
});

// ===== SCROLL REVEAL =====
function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal').forEach((el) => observer.observe(el));
}

function observeNewReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal:not(.visible)').forEach((el) => observer.observe(el));
}

// ===== NAME INPUT =====
function initNameInput() {
  const input = $('#customerName');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') goToCamera();
  });
}

// ===== NAVIGATION =====
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setStep(stepNum) {
  $$('.step').forEach((s) => {
    const n = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (n === stepNum) s.classList.add('active');
    else if (n < stepNum) s.classList.add('completed');
  });
}

function showSection(id) {
  const sections = ['nameSection', 'cameraSection', 'stylesSection', 'resultSection'];
  sections.forEach((s) => {
    const el = document.getElementById(s);
    if (s === id) {
      el.style.display = '';
      setTimeout(() => {
        observeNewReveals();
        scrollToSection(s);
      }, 50);
    }
  });
}

// ===== STEP 1 → 2: GO TO CAMERA =====
function goToCamera() {
  const name = $('#customerName').value.trim();
  if (!name) {
    showToast('Please enter your name', true);
    $('#customerName').focus();
    return;
  }
  state.customerName = name;
  setStep(2);
  showSection('cameraSection');
  startCamera();
}

// ===== CAMERA =====
async function startCamera() {
  const video = $('#cameraFeed');
  const overlay = $('#cameraOverlay');
  const captureBtn = $('#captureBtn');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
      audio: false,
    });
    state.stream = stream;
    video.srcObject = stream;
    overlay.classList.add('hidden');
    captureBtn.style.display = '';
    video.style.display = '';
    $('#capturedPreview').style.display = 'none';
    $('#retakeBtn').style.display = 'none';
    $('#usePhotoBtn').style.display = 'none';
  } catch (err) {
    overlay.innerHTML = `<span>📷 Camera access denied.<br>Please allow camera permission.</span>`;
    console.error('Camera error:', err);
  }
}

function capturePhoto() {
  const video = $('#cameraFeed');
  const canvas = $('#captureCanvas');
  const preview = $('#capturedPreview');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  state.photoDataUrl = dataUrl;

  preview.src = dataUrl;
  preview.style.display = 'block';
  video.style.display = 'none';
  $('.camera-guide').style.display = 'none';

  // Hide capture, show retake + use
  $('#captureBtn').style.display = 'none';
  $('#retakeBtn').style.display = '';
  $('#usePhotoBtn').style.display = '';

  // Flash effect
  const frame = $('.camera-frame');
  frame.style.boxShadow = '0 0 60px rgba(255,255,255,0.6)';
  setTimeout(() => { frame.style.boxShadow = ''; }, 300);
}

function retakePhoto() {
  state.photoDataUrl = null;
  const video = $('#cameraFeed');
  video.style.display = 'block';
  $('#capturedPreview').style.display = 'none';
  $('.camera-guide').style.display = 'flex';
  $('#captureBtn').style.display = '';
  $('#retakeBtn').style.display = 'none';
  $('#usePhotoBtn').style.display = 'none';
}

// ===== STEP 2 → 3: GO TO STYLES =====
async function goToStyles() {
  if (!state.photoDataUrl) {
    showToast('Please capture a photo first', true);
    return;
  }

  // Upload photo
  try {
    const res = await fetch('/api/upload-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: state.photoDataUrl,
        name: state.customerName,
      }),
    });
    const data = await res.json();
    if (data.success) {
      state.photoFilename = data.filename;
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast('Failed to upload photo: ' + err.message, true);
    return;
  }

  // Stop camera
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }

  setStep(3);
  showSection('stylesSection');
}

// ===== STYLES =====
async function loadStyles() {
  try {
    const res = await fetch('/api/styles');
    state.styles = await res.json();
    renderStyles();
  } catch (err) {
    console.error('Failed to load styles:', err);
  }
}

function renderStyles() {
  const hairGrid = $('#hairstylesGrid');
  const beardGrid = $('#beardsGrid');

  hairGrid.innerHTML = state.styles.hairstyles
    .map((s) => createStyleCard(s, 'hairstyle'))
    .join('');

  beardGrid.innerHTML = state.styles.beards
    .map((s) => createStyleCard(s, 'beard'))
    .join('');
}

function createStyleCard(style, type) {
  return `
    <div class="style-card" id="card-${style.id}" onclick="selectStyle('${style.id}', '${type}')">
      <img class="style-card-img" src="${style.image}" alt="${style.name}" loading="lazy" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23111%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23444%22 font-size=%2240%22>✂️</text></svg>'">
      <div class="style-card-info">
        <div class="style-card-name">${style.name}</div>
        <div class="style-card-desc">${style.description}</div>
      </div>
    </div>
  `;
}

function selectStyle(id, type) {
  if (type === 'hairstyle') {
    if (state.selectedHairstyle === id) {
      state.selectedHairstyle = null;
      $(`#card-${id}`).classList.remove('selected');
    } else {
      // Deselect previous
      if (state.selectedHairstyle) {
        const prev = $(`#card-${state.selectedHairstyle}`);
        if (prev) prev.classList.remove('selected');
      }
      state.selectedHairstyle = id;
      $(`#card-${id}`).classList.add('selected');
    }
  } else {
    if (state.selectedBeard === id) {
      state.selectedBeard = null;
      $(`#card-${id}`).classList.remove('selected');
    } else {
      if (state.selectedBeard) {
        const prev = $(`#card-${state.selectedBeard}`);
        if (prev) prev.classList.remove('selected');
      }
      state.selectedBeard = id;
      $(`#card-${id}`).classList.add('selected');
    }
  }

  updateSelectionSummary();
}

function updateSelectionSummary() {
  const summary = $('#selectionSummary');
  const btn = $('#generateBtn');
  const parts = [];

  if (state.selectedHairstyle) {
    const s = state.styles.hairstyles.find((h) => h.id === state.selectedHairstyle);
    parts.push(`<span class="selected-names">🎨 ${s.name}</span>`);
  }
  if (state.selectedBeard) {
    const s = state.styles.beards.find((b) => b.id === state.selectedBeard);
    parts.push(`<span class="selected-names">🧔 ${s.name}</span>`);
  }

  if (parts.length === 0) {
    summary.innerHTML = '<p>No styles selected yet</p>';
    btn.disabled = true;
  } else {
    summary.innerHTML = `<p>Selected: ${parts.join(' + ')}</p>`;
    btn.disabled = false;
  }
}

// ===== GENERATE =====
async function generateStyle() {
  if (!state.photoFilename) {
    showToast('Please capture a photo first', true);
    return;
  }
  if (!state.selectedHairstyle && !state.selectedBeard) {
    showToast('Please select at least one style', true);
    return;
  }

  showLoading(true);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoFilename: state.photoFilename,
        customerName: state.customerName,
        selectedHairstyle: state.selectedHairstyle,
        selectedBeard: state.selectedBeard,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showResult(data.session);
      loadHistory();
    } else {
      if (data.code === 'NO_API_KEY') {
        showToast('⚠️ Gemini API key not set. Start server with: set GEMINI_API_KEY=your-key', true);
      } else {
        showToast('Generation failed: ' + data.error, true);
      }
    }
  } catch (err) {
    showToast('Network error: ' + err.message, true);
  } finally {
    showLoading(false);
  }
}

function showResult(session) {
  setStep(4);
  showSection('resultSection');

  $('#resultGreeting').textContent = `Looking great, ${session.customerName}! Here's your transformation`;
  $('#resultBefore').src = session.originalPhoto;
  $('#resultAfter').src = session.generatedPhoto;

  // Animate in
  const cards = $$('.result-card');
  cards.forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(20px)';
    setTimeout(() => {
      c.style.transition = 'all 0.6s ease';
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
    }, 300 + i * 200);
  });
}

// ===== HISTORY =====
async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const sessions = await res.json();
    renderHistory(sessions);
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

function renderHistory(sessions) {
  const grid = $('#historyGrid');

  if (!sessions || sessions.length === 0) {
    grid.innerHTML = '<p class="history-empty">No transformations yet. Be the first!</p>';
    return;
  }

  grid.innerHTML = sessions.slice(0, 12).map((s) => {
    const date = new Date(s.timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const styleParts = [];
    if (s.selectedHairstyle) styleParts.push(s.selectedHairstyle.replace(/_/g, ' '));
    if (s.selectedBeard) styleParts.push(s.selectedBeard.replace(/_/g, ' '));

    return `
      <div class="history-card">
        <div class="history-card-images">
          <img src="${s.originalPhoto}" alt="Before" onerror="this.style.background='#111'">
          <img src="${s.generatedPhoto}" alt="After" onerror="this.style.background='#111'">
        </div>
        <div class="history-card-info">
          <div>
            <div class="history-card-name">${s.customerName}</div>
            <div class="history-card-styles">${styleParts.join(' + ')}</div>
          </div>
          <div class="history-card-date">${date}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== START OVER =====
function startOver() {
  state.photoFilename = null;
  state.photoDataUrl = null;
  state.selectedHairstyle = null;
  state.selectedBeard = null;

  // Reset style card selections
  $$('.style-card.selected').forEach((c) => c.classList.remove('selected'));
  updateSelectionSummary();

  // Hide result, show name
  $('#resultSection').style.display = 'none';
  $('#stylesSection').style.display = 'none';
  $('#cameraSection').style.display = 'none';
  setStep(1);
  scrollToSection('nameSection');
}

// ===== LOADING =====
const loadingTips = [
  'AI barber is analyzing your features...',
  'Selecting the perfect angles... ✂️',
  'Styling in progress... hold still! 💈',
  'Blending the look seamlessly...',
  'Almost there... adding finishing touches! 🪮',
  'Your new style is being crafted... 💇',
  'Checking the mirror... looking good!',
  'Fine-tuning the details...',
];
let tipInterval = null;

function showLoading(show) {
  const overlay = $('#loadingOverlay');
  const textEl = $('#loadingText');
  if (show) {
    overlay.style.display = 'flex';
    overlay.style.animation = 'fadeInUp 0.3s ease';
    let tipIndex = 0;
    textEl.textContent = loadingTips[0];
    tipInterval = setInterval(() => {
      tipIndex = (tipIndex + 1) % loadingTips.length;
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = loadingTips[tipIndex];
        textEl.style.opacity = '1';
      }, 300);
    }, 3000);
  } else {
    overlay.style.display = 'none';
    if (tipInterval) { clearInterval(tipInterval); tipInterval = null; }
  }
}

// ===== TOAST =====
function showToast(message, isError = false) {
  const toast = $('#toast');
  const msgEl = $('#toastMessage');
  msgEl.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
