const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Config ---------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SECRET_CODE = process.env.SECRET_CODE || 'SALOON2026';
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
    // Male hairstyles
    { id: 'pompadour', name: 'Pompadour', image: '/styles/hairstyles/pompadour.png', description: 'Classic volume on top swept upward and back', gender: 'male' },
    { id: 'fade_cut', name: 'Fade Cut', image: '/styles/hairstyles/fade_cut.png', description: 'Gradual taper from skin to longer hair on top', gender: 'male' },
    { id: 'buzz_cut', name: 'Buzz Cut', image: '/styles/hairstyles/buzz_cut.png', description: 'Uniform short length all over', gender: 'male' },
    { id: 'quiff', name: 'Quiff', image: '/styles/hairstyles/quiff.png', description: 'Voluminous front swept upward with textured top', gender: 'male' },
    { id: 'undercut', name: 'Undercut', image: '/styles/hairstyles/undercut.png', description: 'Long on top with shaved or short sides', gender: 'male' },
    { id: 'crew_cut', name: 'Crew Cut', image: '/styles/hairstyles/crew_cut.png', description: 'Short tapered cut, slightly longer on top', gender: 'male' },
    { id: 'slick_back', name: 'Slick Back', image: '/styles/hairstyles/slick_back.png', description: 'Hair combed straight back with a sleek finish', gender: 'male' },
    { id: 'textured_crop', name: 'Textured Crop', image: '/styles/hairstyles/textured_crop.png', description: 'Short messy fringe with textured layers', gender: 'male' },
    { id: 'man_bun', name: 'Man Bun', image: '/styles/hairstyles/man_bun.png', description: 'Hair pulled back and tied into a bun at the crown', gender: 'male' },
    { id: 'mohawk', name: 'Mohawk', image: '/styles/hairstyles/mohawk.png', description: 'Strip of tall hair down the center with shaved sides', gender: 'male' },
    { id: 'curtain_bangs', name: 'Curtain Bangs', image: '/styles/hairstyles/curtain_bangs.png', description: 'Center-parted fringe that frames the face like curtains', gender: 'male' },
    { id: 'french_crop', name: 'French Crop', image: '/styles/hairstyles/french_crop.png', description: 'Short textured top with a blunt straight fringe', gender: 'male' },
    { id: 'taper_fade', name: 'Taper Fade', image: '/styles/hairstyles/taper_fade.png', description: 'Gradual shortening around ears and neckline with length on top', gender: 'male' },
    { id: 'side_part', name: 'Side Part', image: '/styles/hairstyles/side_part.png', description: 'Classic gentleman cut with a defined side parting', gender: 'male' },
    { id: 'afro', name: 'Afro', image: '/styles/hairstyles/afro.png', description: 'Natural rounded voluminous curly hairstyle', gender: 'male' },
    { id: 'bald_head', name: 'Bald Head', image: '/styles/hairstyles/bald_head.svg', description: 'Completely bald head, smooth scalp, no hair on top', gender: 'male' },
    { id: 'wolf_cut', name: 'Wolf Cut', image: '/styles/hairstyles/wolf_cut.png', description: 'Trendy hairstyle featuring choppy layers and volume on top with longer hair at the back', gender: 'male' },
    // Female hairstyles
    { id: 'f_long_bob', name: 'Long Bob (Lob)', image: '/styles/hairstyles/f_long_bob.png', description: 'Sleek shoulder-length bob with a clean blunt cut', gender: 'female' },
    { id: 'f_pixie_cut', name: 'Pixie Cut', image: '/styles/hairstyles/f_pixie_cut.png', description: 'Short textured cut with side-swept bangs', gender: 'female' },
    { id: 'f_beach_waves', name: 'Beach Waves', image: '/styles/hairstyles/f_beach_waves.png', description: 'Long flowing loose curls with a natural beachy texture', gender: 'female' },
    { id: 'f_layered_cut', name: 'Layered Cut', image: '/styles/hairstyles/f_layered_cut.png', description: 'Medium-length with feathered face-framing layers', gender: 'female' },
    { id: 'f_straight_hair', name: 'Sleek Straight', image: '/styles/hairstyles/f_straight_hair.png', description: 'Long perfectly straight glossy hair with a sleek finish', gender: 'female' },
    { id: 'f_curly_hair', name: 'Voluminous Curls', image: '/styles/hairstyles/f_curly_hair.png', description: 'Long defined bouncy spiral curls with natural volume', gender: 'female' },
    { id: 'f_blunt_bangs', name: 'Blunt Bangs', image: '/styles/hairstyles/f_blunt_bangs.png', description: 'Medium-length hair with thick straight bangs covering the forehead', gender: 'female' },
    { id: 'f_side_braid', name: 'Side Braid', image: '/styles/hairstyles/f_side_braid.png', description: 'Long thick braid draped elegantly over one shoulder', gender: 'female' },
    { id: 'f_messy_bun', name: 'Messy Bun', image: '/styles/hairstyles/f_messy_bun.png', description: 'High messy bun with loose strands framing the face', gender: 'female' },
    { id: 'f_shaggy_cut', name: 'Modern Shag', image: '/styles/hairstyles/f_shaggy_cut.png', description: 'Medium-length choppy layers with lots of volume and curtain bangs', gender: 'female' },
    { id: 'f_sleek_ponytail', name: 'Sleek Ponytail', image: '/styles/hairstyles/f_sleek_ponytail.png', description: 'High sleek ponytail pulled back tightly with hair wrapped at the base', gender: 'female' },
    { id: 'f_curtain_bangs', name: 'Curtain Bangs', image: '/styles/hairstyles/f_curtain_bangs.png', description: 'Center-parted bangs blending into long flowing hair that frames the face', gender: 'female' },
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

// Validate secret code
app.post('/api/validate-code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.json({ valid: false });
  }
  res.json({ valid: code === SECRET_CODE });
});

// Get style catalog (supports ?gender=male|female filtering for hairstyles)
app.get('/api/styles', (req, res) => {
  const gender = req.query.gender; // 'male' or 'female'
  const filtered = {
    hairstyles: gender
      ? STYLES.hairstyles.filter(s => s.gender === gender)
      : STYLES.hairstyles,
    beards: STYLES.beards,
  };
  res.json(filtered);
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

    // Build the style prompt — enhanced for hyper-realistic results
    const styleParts = [];
    if (selectedHairstyle) {
      const style = STYLES.hairstyles.find(s => s.id === selectedHairstyle);
      styleParts.push(`a ${style ? style.name : selectedHairstyle} hairstyle (${style ? style.description : ''})`);
    }
    if (selectedBeard) {
      const style = STYLES.beards.find(s => s.id === selectedBeard);
      styleParts.push(`a ${style ? style.name : selectedBeard} beard style (${style ? style.description : ''})`);
    }

    let styleDescription = `ROLE: You are the world's best photorealistic hair/beard retouching specialist. You have 20 years of experience creating undetectable hair transformations in photographs.\n\n`;
    styleDescription += `TASK: Edit this person's photo to give them ${styleParts.join(' and ')}.\n\n`;
    styleDescription += `ABSOLUTE RULES — violating ANY of these is unacceptable:\n\n`;
    styleDescription += `1. FACE PRESERVATION (MOST CRITICAL): The person's face must remain PIXEL-PERFECT IDENTICAL to the input. This means:\n`;
    styleDescription += `   - Same exact eye shape, eye color, pupil size, eyelashes, eyebrow shape and thickness\n`;
    styleDescription += `   - Same exact nose shape, nostril size, lip shape, lip color, lip thickness\n`;
    styleDescription += `   - Same exact jawline, chin shape, cheekbones, forehead shape\n`;
    styleDescription += `   - Same exact skin tone, skin texture, pores, freckles, moles, blemishes\n`;
    styleDescription += `   - Same exact facial expression, wrinkles, laugh lines\n`;
    styleDescription += `   - Same exact ear shape and position\n`;
    styleDescription += `   - DO NOT age, de-age, beautify, smooth, or alter the face in ANY way\n\n`;
    styleDescription += `2. HAIR COLOR MATCHING: The new hair/beard color MUST exactly match the person's EXISTING natural hair color visible in this photo. Analyze their current hair, eyebrows, and any facial hair — replicate that identical color, shade, and tone. Never change, lighten, or darken the hair color.\n\n`;
    styleDescription += `3. LIGHTING CONSISTENCY: Study the exact lighting setup in this photo — the direction of the key light, fill light, ambient light. The new hair/beard must have shadows, highlights, specular reflections, and subsurface scattering that PERFECTLY match this lighting environment. Pay attention to:\n`;
    styleDescription += `   - Shadow direction and softness on the face\n`;
    styleDescription += `   - Highlight positions on skin and existing hair\n`;
    styleDescription += `   - Color temperature of the light sources\n`;
    styleDescription += `   - Ambient occlusion in recessed areas\n\n`;
    styleDescription += `4. SEAMLESS BLENDING: The transition between the new hair/beard and skin must be invisible:\n`;
    styleDescription += `   - Hairline must look 100% natural with baby hairs and gradual density\n`;
    styleDescription += `   - Sideburns must blend naturally into the skin\n`;
    styleDescription += `   - Beard edges must have natural feathering, not sharp lines\n`;
    styleDescription += `   - No halo artifacts, no visible cut lines, no color fringing\n\n`;
    styleDescription += `5. NATURAL HAIR TEXTURE: The hair/beard must show:\n`;
    styleDescription += `   - Individual visible strands, not smooth solid masses\n`;
    styleDescription += `   - Natural flyaways and imperfections\n`;
    styleDescription += `   - Realistic depth and volume with proper layering\n`;
    styleDescription += `   - Appropriate shine/matte finish matching the hair type\n\n`;
    styleDescription += `6. BACKGROUND & CLOTHING: Keep the original background, clothing, accessories, and ALL surroundings 100% unchanged. Do not crop, resize, or reframe the image.\n\n`;
    styleDescription += `7. IMAGE QUALITY: Output at the EXACT same resolution, aspect ratio, sharpness, noise level, and color profile as the input image. The output should be indistinguishable from a real photograph.\n\n`;
    styleDescription += `8. PHYSICS & REALISM: Hair must obey gravity and physics. It should drape, fall, and stack naturally. Consider head shape and skull structure when placing the new hairstyle.\n`;

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
