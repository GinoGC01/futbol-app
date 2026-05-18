import UploadService from '../../services/upload/UploadService.js'

export const uploadImage = async (req, res, next) => {
  try {
    const bucket = req.body.bucket || 'STAGING_ASSETS'
    const basePath = req.body.path || 'logos'

    const result = await UploadService.uploadImage(req.file, bucket, basePath)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) { next(error) }
}

const UploadController = {
  uploadImage
}

export default UploadController
