import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe filename: timestamp-random-sanitizedName
    const randomHex = crypto.randomBytes(6).toString('hex');
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = `${Date.now()}-${randomHex}-${sanitizedName}`;
    cb(null, finalName);
  }
});

const fileFilter = (req, file, cb) => {
  // Validate extension and MIME type
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf';

  if (isPdfExt && (isPdfMime || file.mimetype === 'application/octet-stream')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents (.pdf) are supported.'), false);
  }
};

const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10);

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024 // in bytes
  }
});
