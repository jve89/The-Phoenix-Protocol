const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fname = `feedback-${Date.now()}-${Math.round(Math.random()*1E6)}${ext}`;
    cb(null, fname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only JPG, PNG, WEBP allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

router.post(
  '/submit-feedback',
  upload.single('photo'),
  async (req, res) => {
    try {
      const { firstName, age, gender, testimonial, permission } = req.body;
      // Micro-validation
      if (!testimonial || testimonial.trim().length < 50 || !permission) {
        return res.status(400).json({ error: 'Invalid submission.' });
      }
      if (age && (isNaN(age) || age < 12 || age > 100)) {
        return res.status(400).json({ error: 'Invalid age.' });
      }
      // Gender whitelist (optional)
      const allowedGenders = ['', 'Female', 'Male', 'Non-binary', 'Prefer not to say'];
      if (gender && !allowedGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender.' });
      }
      let photo_url = null;
      if (req.file) {
        photo_url = `/uploads/${req.file.filename}`;
      }
      await db.query(
        `INSERT INTO testimonials 
          (first_name, age, gender, testimonial, photo_url, permission, status, created_at) 
        VALUES ($1,$2,$3,$4,$5,$6,'pending',NOW())`,
        [
          firstName ? firstName.trim() : null,
          age ? parseInt(age,10) : null,
          gender ? gender.trim() : null,
          testimonial.trim(),
          photo_url,
          permission === 'true' || permission === true
        ]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('[Feedback] Submission failed:', err);
      res.status(500).json({ error: 'Submission failed' });
    }
  }
);

module.exports = router;
