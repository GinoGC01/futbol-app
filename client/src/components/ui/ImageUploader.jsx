import { useState, useRef, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import { api } from '../../lib/api'

export default function ImageUploader({ 
  onUploadSuccess, 
  onError, 
  bucket = 'STAGING_ASSETS',
  path = 'logos',
  defaultImage = null,
  variant = 'square'
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState(defaultImage)
  const fileInputRef = useRef(null)
  const toast = useToast()

  const isCircular = variant === 'circular'

  // Sincronizar vista previa con la imagen por defecto
  useEffect(() => {
    setPreview(defaultImage)
  }, [defaultImage])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 1. Validaciones básicas
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Solo JPG, PNG o WEBP.')
      return
    }

    const MAX_SIZE_MB = 3
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`El archivo es muy pesado (máx ${MAX_SIZE_MB}MB)`)
      return
    }

    // 2. Mostrar vista previa local inmediata
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setIsUploading(true)

    try {
      // 3. Compresión dinámica (respeta el formato original)
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: file.type
      }
      
      const compressedFile = await imageCompression(file, options)

      // 4. Subir al backend via /api/upload/image
      const formData = new FormData()
      formData.append('file', compressedFile, file.name)
      formData.append('bucket', bucket)
      formData.append('path', path)

      const result = await api.upload('/upload/image', formData)

      if (onUploadSuccess) onUploadSuccess(result.publicUrl)

    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Error al subir la imagen')
      setPreview(defaultImage)
      if (onError) onError(error.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setPreview(null)
    if (onUploadSuccess) onUploadSuccess(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex items-center justify-center w-24 h-24 shrink-0 border-2 border-dashed overflow-hidden cursor-pointer transition-all shadow-inner ${
          isCircular ? 'rounded-full' : 'rounded-3xl'
        } ${
          isUploading ? 'opacity-50 pointer-events-none border-white/10' : 
          preview ? 'border-primary/40 bg-bg-surface' : 'border-white/10 hover:border-primary/60 bg-bg-input'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {!isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-dim group">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest">Escudo</span>
              </>
            )}
          </div>
        )}

        {preview && !isUploading && (
          <button 
            type="button"
            onClick={handleRemove}
            className={`absolute top-1 right-1 p-1.5 bg-black/60 text-white hover:bg-danger transition-colors border border-white/10 ${
              isCircular ? 'rounded-full' : 'rounded-xl'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
