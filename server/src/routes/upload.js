import { Router } from "express";
import multer from "multer";
import { requireAuth, requireOrganizador, requireActiveStatus } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import AppError from "../utils/AppError.js";

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
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError("No se envió ningún archivo", 400);
      }

      const bucket = req.body.bucket || "STAGING_ASSETS";
      const basePath = req.body.path || "logos";

      // Generar nombre único preservando la extensión original
      const ext = req.file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${basePath}/${fileName}`;

      // Subir usando la service role key (tiene permisos completos)
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage upload error:", error);
        throw new AppError(`Error al subir imagen: ${error.message}`, 500);
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

      res.status(200).json({
        status: "success",
        data: { publicUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
