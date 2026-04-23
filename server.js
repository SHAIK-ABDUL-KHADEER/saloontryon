const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Config ---------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DATA_FILE = path.join(__dirname, 'data', 'sessions.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const GENERATED_DIR = path.join(__dirname, 'generated');

// Ensure directories exist
[UPLOADS_DIR, GENERATED_DIR, path.join(__dirname, 'data')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure sessions file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/generated', express.static(GENERATED_DIR));

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// --------------- Helpers ---------------
function readSessions() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// --------------- Style Catalog ---------------
const STYLES = {
  hairstyles: [
    { id: 'pompadour', name: 'Pompadour', image: '/styles/hairstyles/pompadour.png', description: 'Classic volume on top swept upward and back' },
    { id: 'fade_cut', name: 'Fade Cut', image: '/styles/hairstyles/fade_cut.png', description: 'Gradual taper from skin to longer hair on top' },
    { id: 'buzz_cut', name: 'Buzz Cut', image: '/styles/hairstyles/buzz_cut.png', description: 'Uniform short length all over' },
    { id: 'quiff', name: 'Quiff', image: '/styles/hairstyles/quiff.png', description: 'Voluminous front swept upward with textured top' },
    { id: 'undercut', name: 'Undercut', image: '/styles/hairstyles/undercut.png', description: 'Long on top with shaved or short sides' },
    { id: 'crew_cut', name: 'Crew Cut', image: '/styles/hairstyles/crew_cut.png', description: 'Short tapered cut, slightly longer on top' },
    { id: 'slick_back', name: 'Slick Back', image: '/styles/hairstyles/slick_back.png', description: 'Hair combed straight back with a sleek finish' },
    { id: 'textured_crop', name: 'Textured Crop', image: '/styles/hairstyles/textured_crop.png', description: 'Short messy fringe with textured layers' },
    { id: 'man_bun', name: 'Man Bun', image: '/styles/hairstyles/man_bun.png', description: 'Hair pulled back and tied into a bun at the crown' },
    { id: 'mohawk', name: 'Mohawk', image: '/styles/hairstyles/mohawk.png', description: 'Strip of tall hair down the center with shaved sides' },
    { id: 'curtain_bangs', name: 'Curtain Bangs', image: '/styles/hairstyles/curtain_bangs.png', description: 'Center-parted fringe that frames the face like curtains' },
    { id: 'french_crop', name: 'French Crop', image: '/styles/hairstyles/french_crop.png', description: 'Short textured top with a blunt straight fringe' },
    { id: 'taper_fade', name: 'Taper Fade', image: '/styles/hairstyles/taper_fade.png', description: 'Gradual shortening around ears and neckline with length on top' },
    { id: 'side_part', name: 'Side Part', image: '/styles/hairstyles/side_part.png', description: 'Classic gentleman cut with a defined side parting' },
    { id: 'afro', name: 'Afro', image: '/styles/hairstyles/afro.png', description: 'Natural rounded voluminous curly hairstyle' },
    { id: 'bald_head', name: 'Bald Head', image: '/styles/hairstyles/bald_head.svg', description: 'Completely bald head, smooth scalp, no hair on top' },
  ],
  beards: [
    { id: 'full_beard', name: 'Full Beard', image: '/styles/beards/full_beard.png', description: 'Thick, well-groomed full coverage beard' },
    { id: 'goatee', name: 'Goatee', image: '/styles/beards/goatee.png', description: 'Chin beard with connected mustache' },
    { id: 'stubble', name: 'Stubble', image: '/styles/beards/stubble.png', description: 'Designer 3-day growth, evenly trimmed' },
    { id: 'mutton_chops', name: 'Mutton Chops', image: '/styles/beards/mutton_chops.png', description: 'Thick sideburns extending to the jawline' },
    { id: 'van_dyke', name: 'Van Dyke', image: '/styles/beards/van_dyke.png', description: 'Pointed goatee with a separate mustache' },
    { id: 'chin_strap', name: 'Chin Strap', image: '/styles/beards/chin_strap.png', description: 'Thin line of beard running along the jawline' },
    { id: 'circle_beard', name: 'Circle Beard', image: '/styles/beards/circle_beard.png', description: 'Rounded goatee connected to a mustache forming a circle' },
    { id: 'handlebar', name: 'Handlebar Mustache', image: '/styles/beards/handlebar.png', description: 'Thick mustache with upwardly curved and styled ends' },
    { id: 'balbo', name: 'Balbo', image: '/styles/beards/balbo.png', description: 'Floating mustache with a soul patch and chin beard, no sideburns' },
    { id: 'anchor_beard', name: 'Anchor Beard', image: '/styles/beards/anchor_beard.png', description: 'Pointed beard with a pencil mustache resembling an anchor' },
    { id: 'ducktail', name: 'Ducktail', image: '/styles/beards/ducktail.png', description: 'Full beard trimmed into a pointed shape at the chin' },
    { id: 'short_boxed', name: 'Short Boxed Beard', image: '/styles/beards/short_boxed.png', description: 'Neatly trimmed short beard with defined cheek and necklines' },
    { id: 'bandholz', name: 'Bandholz', image: '/styles/beards/bandholz.png', description: 'Extra long full natural beard with a connected mustache' },
    { id: 'chevron', name: 'Chevron Mustache', image: '/styles/beards/chevron.png', description: 'Thick wide mustache covering the upper lip in an inverted V shape' },
    { id: 'soul_patch', name: 'Soul Patch', image: '/styles/beards/soul_patch.png', description: 'Small patch of hair just below the lower lip' },
    { id: 'clean_shave', name: 'Clean Shave', image: '/styles/beards/clean_shave.svg', description: 'Clean shaven face, no beard, no mustache, smooth skin' },
  ]
};

// --------------- API Routes ---------------

// Get style catalog
app.get('/api/styles', (req, res) => {
  res.json(STYLES);
});

// Upload captured photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo provided' });
  }
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Upload photo as base64
app.post('/api/upload-base64', (req, res) => {
  const { imageData, name } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `${Date.now()}-${(name || 'customer').replace(/[^a-z0-9]/gi, '_')}.png`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, buffer);
  res.json({
    success: true,
    filename,
    path: `/uploads/${filename}`
  });
});

// Generate styled image using Gemini
app.post('/api/generate', async (req, res) => {
  const { photoFilename, customerName, selectedHairstyle, selectedBeard } = req.body;

  if (!photoFilename) {
    return res.status(400).json({ error: 'No photo specified' });
  }
  if (!selectedHairstyle && !selectedBeard) {
    return res.status(400).json({ error: 'Please select at least one style' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'Gemini API key not configured. Set GEMINI_API_KEY environment variable.',
      code: 'NO_API_KEY'
    });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Read the uploaded photo
    const photoPath = path.join(UPLOADS_DIR, photoFilename);
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ error: 'Uploaded photo not found' });
    }
    const photoBuffer = fs.readFileSync(photoPath);
    const photoBase64 = photoBuffer.toString('base64');
    const mimeType = 'image/png';

    // Build the style prompt
    let styleDescription = 'You are a professional photo editor specializing in hyper-realistic hair and beard transformations. ';
    styleDescription += 'Edit this person\'s photo to give them ';
    const parts = [];
    if (selectedHairstyle) {
      const style = STYLES.hairstyles.find(s => s.id === selectedHairstyle);
      parts.push(`a ${style ? style.name : selectedHairstyle} hairstyle (${style ? style.description : ''})`);
    }
    if (selectedBeard) {
      const style = STYLES.beards.find(s => s.id === selectedBeard);
      parts.push(`a ${style ? style.name : selectedBeard} beard style (${style ? style.description : ''})`);
    }
    styleDescription += parts.join(' and ');
    styleDescription += '.\n\nCRITICAL RULES for a natural result:\n';
    styleDescription += '1. HAIR COLOR: The output hair and beard color MUST be the EXACT SAME color as the user\'s existing hair color visible in this input image. Look at their current hair, eyebrows, and any facial hair — use that identical color for the new style. Do NOT change, lighten, darken, or use any different hair color whatsoever.\n';
    styleDescription += '2. LIGHTING & SHADOWS: The new hair/beard must have the exact same lighting direction, shadow intensity, and highlight placement as the rest of the photo. Study where light falls on the face and replicate it on the hair.\n';
    styleDescription += '3. SKIN & FACE: Keep the face, skin tone, facial features, expression, and complexion 100% identical. Do not alter the face in any way.\n';
    styleDescription += '4. BLENDING: The hairline, sideburns, and beard edges must blend seamlessly into the skin. No harsh edges, no visible cut-out artifacts, no pasted-on look.\n';
    styleDescription += '5. BACKGROUND: Keep the original background, clothing, and surroundings completely unchanged.\n';
    styleDescription += '6. TEXTURE: The hair/beard must have natural texture with realistic individual strands, not look like a smooth plastic wig or fake overlay.\n';
    styleDescription += '7. OVERALL: The final image must look like a real, unedited photograph taken by a camera. It should be impossible to tell that the hair/beard was digitally changed.\n';
    styleDescription += '8. RESOLUTION: Maintain the same image quality, sharpness, and resolution as the original photo.\n';

    // Call Gemini with image editing
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: photoBase64 } },
          { text: styleDescription }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    const response = result.response;
    let generatedImagePath = null;

    // Look for image in response parts
    if (response.candidates && response.candidates[0]) {
      const candidateParts = response.candidates[0].content.parts;
      for (const part of candidateParts) {
        if (part.inlineData) {
          const imgBuffer = Buffer.from(part.inlineData.data, 'base64');
          const genFilename = `${Date.now()}-${(customerName || 'result').replace(/[^a-z0-9]/gi, '_')}-styled.png`;
          generatedImagePath = path.join(GENERATED_DIR, genFilename);
          fs.writeFileSync(generatedImagePath, imgBuffer);
          generatedImagePath = `/generated/${genFilename}`;
          break;
        }
      }
    }

    if (!generatedImagePath) {
      return res.status(500).json({ error: 'Failed to generate styled image. The AI did not return an image.' });
    }

    // Save session data
    const session = {
      id: generateId(),
      customerName: customerName || 'Anonymous',
      timestamp: new Date().toISOString(),
      originalPhoto: `/uploads/${photoFilename}`,
      generatedPhoto: generatedImagePath,
      selectedHairstyle: selectedHairstyle || null,
      selectedBeard: selectedBeard || null,
      prompt: styleDescription
    };

    const sessions = readSessions();
    sessions.unshift(session);
    writeSessions(sessions);

    res.json({
      success: true,
      session
    });

  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: `Generation failed: ${err.message}` });
  }
});

// Get session history
app.get('/api/history', (req, res) => {
  const sessions = readSessions();
  res.json(sessions);
});

// Delete a session
app.delete('/api/history/:id', (req, res) => {
  let sessions = readSessions();
  sessions = sessions.filter(s => s.id !== req.params.id);
  writeSessions(sessions);
  res.json({ success: true });
});

// --------------- Keep Awake Cron ---------------
// Render free tier spins down after 15 mins of inactivity.
// This pings the server's own external URL every 14 minutes.
app.get('/api/ping', (req, res) => res.send('pong'));

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(`${RENDER_URL}/api/ping`);
      console.log(`[CRON] Pinged ${RENDER_URL} to keep awake`);
    } catch (err) {
      console.error(`[CRON] Ping failed:`, err.message);
    }
  }, 14 * 60 * 1000); // 14 minutes
}

// --------------- Start Server ---------------
app.listen(PORT, () => {
  console.log(`\n  ✂️  Saloon Experience Centre`);
  console.log(`  🌐 Running at http://localhost:${PORT}`);
  console.log(`  📁 Uploads: ${UPLOADS_DIR}`);
  console.log(`  🎨 Generated: ${GENERATED_DIR}`);
  if (!GEMINI_API_KEY) {
    console.log(`\n  ⚠️  No GEMINI_API_KEY set — generation will be disabled`);
    console.log(`  💡 Set it via: set GEMINI_API_KEY=your-key-here`);
  }
  console.log('');
});
