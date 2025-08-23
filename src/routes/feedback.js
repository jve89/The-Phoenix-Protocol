const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/db');

const uploadsRoot = path.resolve(__dirname, '../../public/uploads');

// ensure uploads dir exists
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
} catch (e) {
  console.error('[Feedback] Failed to ensure uploads dir:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const raw = crypto.randomBytes(8).toString('hex');
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    cb(null, `feedback-${Date.now()}-${raw}${ext}`);
  }
});

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(mime)) {
      return cb(new Error('Only JPG, PNG, WEBP allowed'));
    }
    // basic double-extension guard
    if (/\.(php|js|sh|exe)(\.|$)/i.test(file.originalname)) {
      return cb(new Error('Invalid file name'));
    }
    cb(null, true);
  }
});

const router = express.Router();

function sanitizeText(s, max = 5000) {
  if (typeof s !== 'string') return '';
  const trimmed = s.trim().slice(0, max);
  // strip tags to reduce XSS risk when rendered later
  return trimmed.replace(/<[^>]*>/g, '');
}

router.post(
  '/submit-feedback',
  upload.single('photo'),
  async (req, res) => {
    try {
      const firstName = sanitizeText(req.body.firstName || '', 120);
      const testimonial = sanitizeText(req.body.testimonial || '', 3000);
      const gender = sanitizeText(req.body.gender || '', 40);
      const permissionRaw = req.body.permission;
      const ageRaw = req.body.age;

      // validation
      const permission = permissionRaw === true || permissionRaw === 'true' || permissionRaw === 'on' ? true : false;
      if (!testimonial || testimonial.length < 50 || !permission) {
        return res.status(400).json({ error: 'Invalid submission.' });
      }

      let age = null;
      if (ageRaw !== undefined && ageRaw !== null && String(ageRaw).trim() !== '') {
        const n = parseInt(ageRaw, 10);
        if (Number.isNaN(n) || n < 12 || n > 100) {
          return res.status(400).json({ error: 'Invalid age.' });
        }
        age = n;
      }

      const allowedGenders = new Set(['', 'Female', 'Male', 'Non-binary', 'Prefer not to say']);
      if (gender && !allowedGenders.has(gender)) {
        return res.status(400).json({ error: 'Invalid gender.' });
      }

      let photo_url = null;
      if (req.file) {
        // ensure saved path is under uploadsRoot
        const saved = path.resolve(uploadsRoot, req.file.filename);
        if (!saved.startsWith(uploadsRoot + path.sep)) {
          return res.status(400).json({ error: 'Invalid upload path.' });
        }
        photo_url = `/uploads/${req.file.filename}`;
      }

      await db.query(
        `INSERT INTO testimonials 
          (first_name, age, gender, testimonial, photo_url, permission, status, created_at) 
         VALUES ($1,$2,$3,$4,$5,$6,'pending',NOW())`,
        [
          firstName || null,
          age,
          gender || null,
          testimonial,
          photo_url,
          permission
        ]
      );

      return res.json({ success: true });
    } catch (err) {
      console.error('[Feedback] Submission failed:', err.message);
      return res.status(500).json({ error: 'Submission failed' });
    }
  }
);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /Only JPG, PNG, WEBP allowed|Invalid file name/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
