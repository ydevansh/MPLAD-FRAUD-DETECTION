import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'citizen');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  },
});

// File filter validation
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
  const isValidMime = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type '${ext || file.mimetype}'. Only JPG, PNG, and WEBP images are allowed.`));
  }
};

export const citizenPhotoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB prototype limit
  },
});
