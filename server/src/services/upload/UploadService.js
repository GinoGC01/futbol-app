import { uploadRepository } from '../../repositories/uploadRepository.js'
import AppError from '../../utils/AppError.js'

class UploadService {
  async uploadImage(file, bucket = 'STAGING_ASSETS', basePath = 'logos') {
    if (!file) throw new AppError('No se envió ningún archivo', 400)

    // Generar nombre único preservando la extensión original
    const ext = file.originalname.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const filePath = `${basePath}/${fileName}`

    const { error } = await uploadRepository.uploadFile(bucket, filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      console.error('Supabase Storage upload error:', error)
      throw new AppError(`Error al subir imagen: ${error.message}`, 500)
    }

    const { data: { publicUrl } } = uploadRepository.getPublicUrl(bucket, filePath)
    return { publicUrl }
  }
}

export default new UploadService()
