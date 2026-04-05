const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const { z }   = require('zod')
const { query } = require('../db')
const { signToken } = require('../middleware/auth')

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(1),
})
const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body)
    const hash = await bcrypt.hash(body.password, 12)

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role`,
      [body.email, hash, body.name]
    )
    const user  = rows[0]
    const token = signToken({ id: user.id, email: user.email, role: user.role })
    res.status(201).json({ token, user })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 가입된 이메일입니다' })
    next(e)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body)
    const { rows } = await query(
      `SELECT * FROM users WHERE email = $1`, [body.email]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸습니다' })

    const ok = await bcrypt.compare(body.password, user.password_hash)
    if (!ok)  return res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸습니다' })

    const token = signToken({ id: user.id, email: user.email, role: user.role })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (e) { next(e) }
})

// GET /api/auth/me
const { requireAuth } = require('../middleware/auth')
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, name, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    )
    res.json(rows[0])
  } catch (e) { next(e) }
})

module.exports = router
