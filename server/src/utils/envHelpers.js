/**
 * Helpers para evaluar el entorno de ejecución (NODE_ENV).
 * Centraliza la lógica para que "staging" se comporte como producción
 * en aspectos de seguridad (cookies, CORS, logs), pero se distinga
 * cuando sea necesario (mock de emails, debug).
 */

const env = process.env.NODE_ENV || 'development'

/**
 * ¿Estamos en un entorno desplegado (producción o staging)?
 * Usar para: cookies secure, sameSite, CORS estricto, ocultar stack traces.
 */
export const isDeployed = () => ['production', 'staging'].includes(env)

/**
 * ¿Estamos en desarrollo local?
 */
export const isDev = () => env === 'development'

/**
 * ¿Estamos en modo test?
 */
export const isTest = () => env === 'test'

/**
 * Entorno actual como string.
 */
export const currentEnv = env
