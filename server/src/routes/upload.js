import { Router } from "express";
import multer from "multer";
import { requireAuth, requireOrganizador, requireActiveStatus } from "../middleware/auth.js";
import AppError from "../utils/AppError.js";
import UploadController from "../controllers/upload/UploadController.js";

const router = Router();

// Multer en memoria (no guarda en disco, solo buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Formato no válido. Solo JPG, PNG o WEBP.", 400));
    }
  },
});

// POST /api/upload/image
// Sube una imagen al bucket de Supabase Storage usando la service role key
router.post(
  "/image",
  requireAuth,
  requireOrganizador,
  requireActiveStatus,
  upload.single("file"),
  UploadController.uploadImage
);

export default router;
