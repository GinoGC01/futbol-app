import jwt from 'jsonwebtoken'
import { isDeployed } from './envHelpers.js'

export function signToken(id, email) {
  return jwt.sign({ sub: id, email }, process.env.JWT_SECRET, { expiresIn: '2h' })
}

export function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isDeployed(),
    sameSite: isDeployed() ? 'none' : 'lax',
    maxAge: 2 * 60 * 60 * 1000 // 2 horas
  })
}
