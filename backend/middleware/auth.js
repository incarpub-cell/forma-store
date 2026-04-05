const jwt      = require('jsonwebtoken')
const bcrypt   = require('bcryptjs')
const { query } = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'forma-dev-secret-change-in-prod'

// ── JWT 인증 ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다' })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: '토큰이 만료됐거나 올바르지 않습니다' })
  }
}

// 관리자 전용
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: '관리자 권한이 필요합니다' })
    next()
  })
}

// ── API Key 인증 (파트너/외부 자동업로드) ───────────────────
async function requireApiKey(req, res, next) {
  const header = req.headers.authorization || ''
  const rawKey = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!rawKey) return res.status(401).json({ error: 'API 키가 없습니다' })

  // prefix로 후보 조회 후 bcrypt 검증
  const prefix = rawKey.slice(0, 12)
  const { rows } = await query(
    `SELECT * FROM api_keys WHERE key_prefix = $1 AND is_active = TRUE`,
    [prefix]
  )
  if (!rows.length) return res.status(401).json({ error: '유효하지 않은 API 키입니다' })

  const valid = await bcrypt.compare(rawKey, rows[0].key_hash)
  if (!valid)  return res.status(401).json({ error: '유효하지 않은 API 키입니다' })

  // 권한 확인
  const perm = req.requiredPermission
  if (perm && !rows[0].permissions.includes(perm))
    return res.status(403).json({ error: `${perm} 권한이 없습니다` })

  // 마지막 사용 시각 업데이트
  query(`UPDATE api_keys SET last_used = NOW() WHERE id = $1`, [rows[0].id])

  req.apiKey = rows[0]
  next()
}

// ── JWT 발급 ────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { requireAuth, requireAdmin, requireApiKey, signToken }
