export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // LOG INTERNO: Diferenciamos errores esperados (4xx) de errores graves (5xx)
  if (err.statusCode >= 400 && err.statusCode < 500) {
    // Log minimalista para errores de cliente (Auth, Not Found, etc)
    console.log(`[CLIENT ERROR] ${req.method} ${req.originalUrl} - Status: ${err.statusCode} - ${err.message}`);
  } else {
    // Log completo para errores internos graves
    console.error(`[INTERNAL ERROR] [${new Date().toISOString()}]`);
    console.error(`Message: ${err.message}`);
    if (err.internalError) {
      console.error('Raw DB/System Error:', err.internalError);
    }
    console.error(`Path: ${req.originalUrl}`);
    console.error(`Stack: ${err.stack}`);
  }

  // Redacción de seguridad: Palabras prohibidas que nunca deben ir al frontend
  const forbiddenKeywords = ['column', 'table', 'relation', 'syntax', 'supabase', 'postgres', 'uuid', 'constraint', 'fkey', 'pkey'];
  let publicMessage = err.message;

  // Si el mensaje contiene tecnicismos o NO es un error controlado (isOperational)
  const isTechnical = forbiddenKeywords.some(word => publicMessage.toLowerCase().includes(word));
  
  if (!err.isOperational || isTechnical) {
    publicMessage = 'Hubo un problema interno en el servidor. Por favor, intente más tarde.';
  }

  if (process.env.NODE_ENV === "development") {
    // En desarrollo, enviamos un poco más de contexto pero filtrando tecnicismos del mensaje principal
    res.status(err.statusCode).json({
      status: err.status,
      message: publicMessage,
      originalMessage: err.isOperational ? err.message : 'Hidden for security', 
      stack: err.stack, // En dev el stack es útil, pero el mensaje debe ser limpio
    });
  } else {
    // Production: Silencio total sobre detalles técnicos
    res.status(err.statusCode).json({
      status: err.status,
      message: publicMessage,
    });
  }
};
