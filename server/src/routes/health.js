import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

/**
 * @route   GET /health
 * @desc    Health check route for monitoring the backend and database connection
 * @access  Public
 */
router.get('/', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'checking...'
    }
  }

  try {
    // Basic connectivity check to Supabase
    const { error } = await supabaseAdmin.from('liga').select('id', { count: 'exact', head: true }).limit(1)
    
    if (error) {
      healthcheck.status = 'degraded'
      healthcheck.services.database = 'error'
      healthcheck.error = error.message
      return res.status(503).json(healthcheck)
    }

    healthcheck.services.database = 'connected'
    res.json(healthcheck)
  } catch (error) {
    healthcheck.status = 'error'
    healthcheck.services.database = 'disconnected'
    healthcheck.error = error.message
    res.status(503).json(healthcheck)
  }
})

export default router
