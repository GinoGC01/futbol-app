export default class AppError extends Error {
  constructor(message, statusCode, internalError = null) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true // Errores operacionales, predecibles para mostrar al usuario
    
    // El error interno (del sistema/DB) NUNCA se enviará al frontend
    // pero lo guardamos para el logger del backend.
    this.internalError = internalError 

    Error.captureStackTrace(this, this.constructor)
  }
}
